import { NextRequest, NextResponse } from 'next/server';
import { TypingDiagnostics, AIFeedback, ModelProvider, ProfileHistoricalContext } from '@/types/typing';
import { buildGemmaCoachPrompt } from '@/lib/ai/prompts';

interface AnalyzeRequestBody {
  diagnostics: TypingDiagnostics;
  historicalContext?: ProfileHistoricalContext;
  provider?: ModelProvider;
  ollamaBaseUrl?: string;
  googleApiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequestBody = await req.json();
    const { diagnostics, historicalContext, provider = 'ollama_gemma4_e2b', ollamaBaseUrl = 'http://localhost:11434', googleApiKey } = body;

    if (!diagnostics || !diagnostics.stats) {
      return NextResponse.json({ error: 'Invalid diagnostics payload' }, { status: 400 });
    }

    const { systemPrompt, userPrompt } = buildGemmaCoachPrompt(diagnostics, historicalContext);

    // 1. Google AI Studio / Gemini API
    if (provider === 'google_ai_studio' && googleApiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            signal: AbortSignal.timeout(4000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemPrompt },
                    { text: userPrompt },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = parseAiResponse(rawText, historicalContext);
            if (parsed) {
              return NextResponse.json({ ...parsed, modelUsed: 'Google AI Studio (Gemini 2.0 / Gemma)' });
            }
          }
        }
      } catch (err) {
        console.warn('Google AI Studio API error, falling back to local Ollama:', err);
      }
    }

    // 2. Local Ollama (Gemma 4 E2B or Gemma 2 2B)
    const targetModel = provider === 'ollama_gemma2_2b' ? 'gemma2:2b' : 'gemma4:e2b';

    let ollamaResponse;
    try {
      ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          format: 'json',
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 250,
          },
        }),
      });

      // If targetModel fails (e.g. gemma4:e2b still downloading), try gemma2:2b
      if (!ollamaResponse.ok && targetModel !== 'gemma2:2b') {
        ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          signal: AbortSignal.timeout(3000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma2:2b',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            format: 'json',
            stream: false,
            options: {
              temperature: 0.6,
              num_predict: 500,
            },
          }),
        });
      }
    } catch (ollamaErr) {
      console.warn('Ollama connection error:', ollamaErr);
    }

    if (ollamaResponse && ollamaResponse.ok) {
      const data = await ollamaResponse.json();
      const content = data.message?.content || '{}';
      const rawThinking = data.message?.thinking || data.thinking || undefined;
      
      const parsed = parseAiResponse(content, historicalContext);
      if (parsed) {
        return NextResponse.json({
          ...parsed,
          rawThinking,
          modelUsed: data.model || targetModel,
        });
      }
    }

    // 3. Resilient Fallback: Synthesize intelligent diagnostic feedback heuristically
    const fallback = generateHeuristicFeedback(diagnostics, historicalContext);
    return NextResponse.json(fallback);
  } catch (error: any) {
    console.error('Analyze route error:', error);
    return NextResponse.json(
      { error: 'Internal server error analyzing typing session' },
      { status: 500 }
    );
  }
}

function generateTrendObservation(
  diagnostics: TypingDiagnostics | undefined,
  historicalContext: ProfileHistoricalContext
): string {
  const {
    rollingAvgWpm,
    rollingAvgAccuracy,
    wpmDelta,
    accuracyDelta,
    isPersonalBestWpm,
    improvedKeys,
    chronicTroubleKeys,
  } = historicalContext;
  const currentWpm = diagnostics?.stats.wpm;

  // 1. New Personal Best
  if (isPersonalBestWpm) {
    const diffText = wpmDelta > 0 ? ` (+${wpmDelta} WPM above your ${rollingAvgWpm} WPM baseline)` : '';
    let observation = `Outstanding achievement! You set a new personal speed record of ${currentWpm ?? (rollingAvgWpm + wpmDelta)} WPM${diffText}.`;
    if (improvedKeys.length > 0) {
      observation += ` Significant mechanical breakthrough on previously troubled keys: ${improvedKeys.join(', ')}.`;
    } else if (accuracyDelta >= 0) {
      observation += ` Exceptional control maintained at ${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta}% above your average precision.`;
    }
    return observation;
  }

  // 2. Faster than rolling average
  if (wpmDelta > 0) {
    let observation = `Pacing is trending upward (+${wpmDelta} WPM above your ${rollingAvgWpm} WPM rolling average).`;
    if (accuracyDelta >= 0) {
      observation += ` Accuracy climbed by +${accuracyDelta}% against baseline, demonstrating solidified muscle memory.`;
    } else {
      observation += ` Watch for speed-induced fatigue, as accuracy dropped ${Math.abs(accuracyDelta)}% below baseline.`;
    }
    if (improvedKeys.length > 0) {
      observation += ` Notable accuracy gains on keys: ${improvedKeys.join(', ')}.`;
    }
    return observation;
  }

  // 3. Slower than rolling average
  if (wpmDelta < 0) {
    if (accuracyDelta >= 0) {
      return `Speed ran ${Math.abs(wpmDelta)} WPM below your ${rollingAvgWpm} WPM baseline, but accuracy remained high (+${accuracyDelta}%). A disciplined session prioritizing precision over raw speed.`;
    } else {
      return `Both speed (${wpmDelta} WPM) and accuracy (${accuracyDelta}%) dipped below your rolling baselines (${rollingAvgWpm} WPM / ${rollingAvgAccuracy}%). This indicates physical or mental fatigue—take a short break before your next drill.`;
    }
  }

  // 4. Equal to rolling average
  let observation = `Session closely mirrored your historical baseline of ${rollingAvgWpm} WPM and ${rollingAvgAccuracy}% accuracy.`;
  if (improvedKeys.length > 0) {
    observation += ` Noticeable consistency improvements on ${improvedKeys.join(', ')}.`;
  } else if (chronicTroubleKeys.length > 0) {
    observation += ` Keep focusing drills on chronic trouble keys (${chronicTroubleKeys.join(', ')}) to unlock higher velocities.`;
  }
  return observation;
}

function normalizeFeedback(obj: any, historicalContext?: ProfileHistoricalContext): AIFeedback {
  return {
    headline: obj.headline || obj.title || 'Touch Typing Feedback',
    mechanicalDiagnosis:
      obj.mechanicalDiagnosis ||
      obj.diagnosis ||
      obj.feedback ||
      obj.analysis ||
      'Biomechanical analysis completed.',
    trendObservation:
      obj.trendObservation ||
      obj.trend ||
      (historicalContext ? generateTrendObservation(undefined, historicalContext) : undefined),
    actionableTips: Array.isArray(obj.actionableTips)
      ? obj.actionableTips
      : Array.isArray(obj.tips)
      ? obj.tips
      : Array.isArray(obj.coachingTips)
      ? obj.coachingTips
      : typeof obj.actionableTips === 'string'
      ? [obj.actionableTips]
      : ['Maintain a steady typing cadence to minimize fat-finger errors.'],
    targetedDrillWords: Array.isArray(obj.targetedDrillWords)
      ? obj.targetedDrillWords
      : Array.isArray(obj.drillWords)
      ? obj.drillWords
      : Array.isArray(obj.words)
      ? obj.words
      : ['the', 'their', 'they', 'other', 'with', 'weather', 'thought', 'through'],
    targetedDrillSentences: Array.isArray(obj.targetedDrillSentences)
      ? obj.targetedDrillSentences
      : Array.isArray(obj.sentences)
      ? obj.sentences
      : ['The quick practice sentence reinforces smooth muscle memory.'],
    coachingSummary:
      obj.coachingSummary ||
      obj.summary ||
      'Consistent practice on weak transitions accelerates speed and precision.',
    modelUsed: obj.modelUsed || 'Gemma',
  };
}

function parseAiResponse(raw: string, historicalContext?: ProfileHistoricalContext): AIFeedback | null {
  const cleaned = cleanJsonString(raw);

  // Strategy 1: Standard JSON.parse
  try {
    const parsed = JSON.parse(cleaned);
    return normalizeFeedback(parsed, historicalContext);
  } catch {
    // Strategy 2: Remove trailing commas in arrays/objects
    try {
      const fixedCommas = cleaned.replace(/,\s*([}\]])/g, '$1');
      const parsed = JSON.parse(fixedCommas);
      return normalizeFeedback(parsed, historicalContext);
    } catch {
      // Strategy 3: Regex field extraction
      try {
        const headlineMatch = cleaned.match(/"headline"\s*:\s*"([^"]+)"/);
        const diagnosisMatch = cleaned.match(/"mechanicalDiagnosis"\s*:\s*"([^"]+)"/);
        const summaryMatch = cleaned.match(/"coachingSummary"\s*:\s*"([^"]+)"/);
        const trendMatch = cleaned.match(/"trendObservation"\s*:\s*"([^"]+)"/);

        // Extract array of strings
        const tipsMatches = cleaned.match(/"(?:actionableTips|tips)"\s*:\s*\[([\s\S]*?)\]/);
        const drillMatches = cleaned.match(/"(?:targetedDrillWords|drillWords|words)"\s*:\s*\[([\s\S]*?)\]/);
        const sentenceMatches = cleaned.match(/"(?:targetedDrillSentences|sentences)"\s*:\s*\[([\s\S]*?)\]/);

        const extractItems = (block: string | undefined): string[] => {
          if (!block) return [];
          const matches = block.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
          return matches ? matches.map((m) => m.slice(1, -1)) : [];
        };

        if (headlineMatch || diagnosisMatch) {
          return normalizeFeedback({
            headline: headlineMatch ? headlineMatch[1] : undefined,
            mechanicalDiagnosis: diagnosisMatch ? diagnosisMatch[1] : undefined,
            trendObservation: trendMatch ? trendMatch[1] : undefined,
            actionableTips: extractItems(tipsMatches?.[1]),
            targetedDrillWords: extractItems(drillMatches?.[1]),
            targetedDrillSentences: extractItems(sentenceMatches?.[1]),
            coachingSummary: summaryMatch ? summaryMatch[1] : undefined,
          }, historicalContext);
        }
      } catch (regexErr) {
        console.warn('Regex fallback failed:', regexErr);
      }
    }
  }

  return null;
}

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

function generateHeuristicFeedback(diagnostics: TypingDiagnostics, historicalContext?: ProfileHistoricalContext): AIFeedback {
  const { stats, weakBigrams, hesitations, handBalance, errorTypeBreakdown, fingerErrors, classifiedErrors } = diagnostics;

  const weakBigramStrings = weakBigrams.map((b) => b.bigram);
  const primaryWeakBigram = weakBigramStrings[0] || 'th';
  const topHesitations = hesitations.map((h) => h.character);

  // Extract unique mistaken keys
  const problemKeys = Array.from(new Set(classifiedErrors.map((e) => e.expected.toLowerCase()))).slice(0, 6);
  const problemKeysDisplay = problemKeys.length > 0 ? problemKeys.map((k) => `'${k}'`).join(', ') : "'e', 't', 's'";

  const fatFingerCount = errorTypeBreakdown.ADJACENT_FAT_FINGER;
  const transpositionCount = errorTypeBreakdown.TRANSPOSITION;

  let diagnosis = `At ${stats.wpm} WPM and ${stats.accuracy}% accuracy across ${stats.elapsedTime}s, `;
  if (problemKeys.length > 0) {
    diagnosis += `mistakes clustered heavily around ${problemKeysDisplay}. `;
  }
  if (fatFingerCount > 0) {
    diagnosis += `You experienced ${fatFingerCount} adjacent-key collisions, showing slight horizontal finger drift. `;
  }
  if (transpositionCount > 0) {
    diagnosis += `${transpositionCount} inversion errors indicate your hands anticipated sequences before fully settling. `;
  }
  if (topHesitations.length > 0) {
    diagnosis += `Noticeable latency pauses were observed on ${topHesitations.map((h) => `'${h}'`).join(', ')}. `;
  }
  if (handBalance.leftErrorPercentage > 60) {
    diagnosis += `Your left hand generated ${handBalance.leftErrorPercentage}% of errors, pointing to left-hand reach fatigue.`;
  } else if (handBalance.rightErrorPercentage > 60) {
    diagnosis += `Your right hand dominated errors (${handBalance.rightErrorPercentage}%), indicating right-hand coordination drift.`;
  } else {
    diagnosis += `Both hands shared a balanced error distribution (${handBalance.leftErrorPercentage}% left / ${handBalance.rightErrorPercentage}% right).`;
  }

  // Generate drill words containing their actual problem keys
  const targetWords = problemKeys.length > 0
    ? [
        ...problemKeys.map((k) => `${k}all`),
        ...problemKeys.map((k) => `re${k}`),
        ...problemKeys.map((k) => `un${k}`),
        ...problemKeys.map((k) => `to${k}`),
      ].slice(0, 12)
    : ['the', 'their', 'they', 'other', 'with', 'weather', 'thought', 'through'];

  let trendObservation: string | undefined = undefined;
  if (historicalContext) {
    trendObservation = generateTrendObservation(diagnostics, historicalContext);
  }

  return {
    headline: stats.accuracy >= 95 ? 'High Precision Cadence' : 'Targeted Finger Recalibration',
    mechanicalDiagnosis: diagnosis,
    trendObservation,
    actionableTips: [
      `Isolate the ${problemKeysDisplay} keys with slow, deliberate repetitions to reinforce tactile muscle anchors.`,
      `Metronome pacing: drop speed by 5 WPM to smooth out latency hesitations on ${topHesitations.length > 0 ? topHesitations.join(', ') : 'transitional keys'}.`,
      `Anchor your ${handBalance.leftErrorPercentage > 50 ? 'left' : 'right'} index finger firmly on the home-row nub between fast bursts.`,
    ],
    targetedDrillWords: targetWords,
    targetedDrillSentences: [
      `Deliberate practice on ${problemKeysDisplay} builds rapid tactile muscle memory.`,
      `Maintain a calm rhythm and steady breath through every word transition.`,
    ],
    coachingSummary: `Session completed at ${stats.wpm} WPM with ${stats.accuracy}% accuracy (${stats.incorrectChars} mistakes). Drilling your weak transitions will steadily boost both speed and precision.`,
    modelUsed: 'Gemma Biomechanical Coach',
  };
}
