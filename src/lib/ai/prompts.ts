import { TypingDiagnostics, ProfileHistoricalContext } from '@/types/typing';

export function buildGemmaCoachPrompt(
  diagnostics: TypingDiagnostics,
  historicalContext?: ProfileHistoricalContext
): {
  systemPrompt: string;
  userPrompt: string;
} {
  const stats = diagnostics.stats || {
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    consistency: 100,
    elapsedTime: 30,
  };

  const weakBigrams = diagnostics.weakBigrams || [];
  const hesitations = diagnostics.hesitations || [];
  const errorTypeBreakdown = diagnostics.errorTypeBreakdown || {
    ADJACENT_FAT_FINGER: 0,
    TRANSPOSITION: 0,
    CASE_MISMATCH: 0,
    OTHER: 0,
  };
  const handBalance = diagnostics.handBalance || {
    leftHandErrors: 0,
    rightHandErrors: 0,
    leftErrorPercentage: 50,
    rightErrorPercentage: 50,
  };
  const fingerErrors = diagnostics.fingerErrors || ({} as Record<string, number>);

  // Find fingers with errors
  const weakFingers = Object.entries(fingerErrors)
    .filter(([_, count]) => (count as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([finger, count]) => `${finger.replace('_', ' ')} (${count} errors)`);

  const systemPrompt = `You are TypoLoop's Elite Biomechanical Touch-Typing Coach powered by Google Gemma.
Analyze the user's keystroke telemetry and provide a biomechanical diagnosis and targeted drills.
Evaluate both the current biomechanical error telemetry AND the historical trajectory.
Keep your thinking process concise (under 3 bullet points) and output valid JSON matching the schema.

REQUIRED JSON SCHEMA:
{
  "headline": "A punchy, encouraging 4-7 word title analyzing their session",
  "mechanicalDiagnosis": "2-3 sentences explaining exactly which fingers, transitions, and keys caused mistakes and why",
  "actionableTips": [
    "Tip 1: specific physical finger placement or reach adjustment",
    "Tip 2: pacing, rhythm, or alternation technique",
    "Tip 3: key-specific muscle memory drill"
  ],
  "targetedDrillWords": ["10-14 specific practice words containing their problem keys"],
  "targetedDrillSentences": [
    "A fluent practice sentence containing their weak keys naturally.",
    "Another targeted sentence to build muscle memory rhythm."
  ],
  "coachingSummary": "1-2 encouraging sentences on speed vs accuracy balance.",
  "trendObservation": "1-2 sentences comparing this attempt to their historical baseline, noting if they set a personal record, improved a specific weakness, or showed fatigue."
}`;

  let historicalSection = '';
  if (historicalContext) {
    historicalSection = `
HISTORICAL PROFILE & BASELINE:
- Lifetime Sessions: ${historicalContext.totalSessions}
- Rolling Baseline WPM: ${historicalContext.rollingAvgWpm} (Current Delta: ${historicalContext.wpmDelta > 0 ? '+' : ''}${historicalContext.wpmDelta} WPM)
- Rolling Baseline Accuracy: ${historicalContext.rollingAvgAccuracy}% (Current Delta: ${historicalContext.accuracyDelta > 0 ? '+' : ''}${historicalContext.accuracyDelta}%)
- Personal Best Achieved: ${historicalContext.isPersonalBestWpm ? 'YES (New Peak Speed Record!)' : 'No'}
- Chronic Trouble Keys: ${historicalContext.chronicTroubleKeys.join(', ') || 'None'}
- Keys Improved This Session: ${historicalContext.improvedKeys.join(', ') || 'None'}
`;
  }

  const userPrompt = `Analyze this typing test telemetry session:
- Speed: ${stats.wpm} WPM (Raw: ${stats.rawWpm} WPM)
- Accuracy: ${stats.accuracy}% (${stats.correctChars} correct, ${stats.incorrectChars} incorrect)
- Consistency: ${stats.consistency}%
- Duration: ${stats.elapsedTime} seconds

BIOMECHANICAL ERROR TELEMETRY:
- Hand Error Distribution: Left Hand ${handBalance.leftErrorPercentage}% vs Right Hand ${handBalance.rightErrorPercentage}%
- Weakest Fingers: ${weakFingers.length > 0 ? weakFingers.join(', ') : 'Even finger balance'}
- Error Classifications:
  * Adjacent Key 'Fat-Finger' Substitutions: ${errorTypeBreakdown.ADJACENT_FAT_FINGER}
  * Transposition / Inversions: ${errorTypeBreakdown.TRANSPOSITION}
  * Case/Shift Mismatches: ${errorTypeBreakdown.CASE_MISMATCH}
  * Other Errors: ${errorTypeBreakdown.OTHER}

- Weakest Bigram Transitions: ${
    weakBigrams.length > 0
      ? weakBigrams.map((b) => `"${b.bigram}" (${b.errorCount} errors, ${b.avgIkiMs}ms latency)`).join(', ')
      : 'None'
  }
- Hesitation Latencies: ${
    hesitations.length > 0
      ? hesitations.map((h) => `'${h.character}' (${h.avgLatencyMs}ms)`).join(', ')
      : 'Smooth cadence'
  }
${historicalSection}
Diagnose their subconscious typing habits and generate their adaptive TypoLoop drill now in JSON format.`;

  return { systemPrompt, userPrompt };
}

export interface GemmaParagraphPromptOptions {
  theme?: string;
  customPrompt?: string;
  continuationContext?: string;
  weakBigrams?: string[];
  weakKeys?: string[];
  targetWordCount?: number;
}

export function buildGemmaParagraphPrompt(options: GemmaParagraphPromptOptions): {
  systemPrompt: string;
  userPrompt: string;
} {
  const {
    theme = 'scifi',
    customPrompt,
    continuationContext,
    weakBigrams = [],
    weakKeys = [],
    targetWordCount = 70,
  } = options;

  const systemPrompt = `You are TypoLoop's Master Literary Text Generator powered by Google Gemma.
Your job is to generate a beautiful, coherent, immersive paragraph for touch-typing practice.
Keep your thinking process concise (under 2 sentences) and immediately output valid JSON.

STRICT TYPING SPECIFICATIONS:
1. Output MUST be valid JSON with this exact schema:
{
  "title": "A punchy, evocative 2-5 word title",
  "paragraph": "The exact paragraph for touch typing."
}
2. LENGTH: Approximately ${targetWordCount} words (3-5 well-crafted, continuous sentences).
3. FLOW & CADENCE: Use natural punctuation, diverse sentence lengths, and engaging rhythm.
4. TYPOGRAPHY SAFETY: Use only standard ASCII keyboard characters (letters, numbers, commas, periods, standard hyphens '-', single quotes ''', and standard double quotes '\"'). NEVER use fancy smart/curly quotes, em-dashes ('—'), or special unicode symbols.
5. NO MARKDOWN: The paragraph string should be raw prose without markdown asterisks, bolding, or lists.`;

  let promptFocus = '';

  if (continuationContext && continuationContext.trim().length > 0) {
    promptFocus = `STORY CONTINUATION MODE:
The ongoing passage ended with: "...${continuationContext.trim()}".
Seamlessly continue the story from this exact point with the next sentences. Do not restart, summarize, or re-introduce characters; jump straight into the next narrative development.`;
  } else if (customPrompt && customPrompt.trim().length > 0) {
    promptFocus = `Topic: "${customPrompt.trim()}". Write an engaging, vivid passage on this exact subject.`;
  } else if (theme === 'adaptive' || (weakKeys.length > 0 || weakBigrams.length > 0)) {
    const keyDetails = [
      weakKeys.length > 0 ? `Problem Keys/Fingers: ${weakKeys.join(', ')}` : '',
      weakBigrams.length > 0 ? `Weak Bigram Transitions: ${weakBigrams.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    promptFocus = `BIOMECHANICAL ADAPTIVE DRILL MODE:
${keyDetails}
Create a captivating narrative passage that naturally and frequently integrates words containing these problem keys and bigram transitions.
The story must read like genuine literature or journalism—NOT a random word list. Weave the target letters seamlessly into authentic vocabulary.`;
  } else {
    const themeDescriptions: Record<string, string> = {
      coffee: 'Artisanal coffee brewing, single-origin roasting, espresso extractions, and the quiet ritual of morning cafe focus.',
      scifi: 'Deep space exploration, celestial phenomena, starships, or astronomical wonder.',
      cyberpunk: 'A neon-drenched metropolis, cybernetic systems, rain-slicked pavement, or high-tech intrigue.',
      tech: 'Elegant software design, operating systems, compilers, algorithms, or the craft of programming.',
      philosophy: 'Stoic resilience, contemplation of human consciousness, time, or the cosmos.',
      literature: 'Lyrical scenery, quiet craftsmanship, the majesty of nature, or classic adventure.',
    };
    const desc = themeDescriptions[theme] || themeDescriptions.scifi;
    promptFocus = `Theme: ${theme.toUpperCase()} (${desc}). Craft a vivid, atmospheric narrative passage.`;
  }

  const userPrompt = `Generate a fresh, immersive touch-typing paragraph now in JSON format.
${promptFocus}
Target Word Count: approximately ${targetWordCount} words.`;

  return { systemPrompt, userPrompt };
}

