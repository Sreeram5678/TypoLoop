import { NextRequest, NextResponse } from 'next/server';
import { GenerateTextRequest, GenerateTextResponse, AIThemeId } from '@/types/typing';
import { buildGemmaParagraphPrompt } from '@/lib/ai/prompts';
import { cleanTextForTyping, getCuratedPassage, getRandomCuratedPassage, paragraphToWords } from '@/lib/paragraphs';

export async function POST(req: NextRequest) {
  try {
    const body: GenerateTextRequest = await req.json().catch(() => ({}));
    const {
      theme = 'scifi',
      customPrompt,
      continuationContext,
      weakBigrams,
      weakKeys,
      provider = 'ollama_gemma4_e2b',
      ollamaBaseUrl = 'http://localhost:11434',
      googleApiKey,
      wordCount = 70,
    } = body;

    const { systemPrompt, userPrompt } = buildGemmaParagraphPrompt({
      theme,
      customPrompt,
      continuationContext,
      weakBigrams,
      weakKeys,
      targetWordCount: wordCount,
    });

    const effectiveGoogleKey = googleApiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    // 1. Try Google AI Studio (Gemini 2.0 / Gemma)
    if (provider === 'google_ai_studio' && effectiveGoogleKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveGoogleKey}`,
          {
            method: 'POST',
            signal: AbortSignal.timeout(12000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: systemPrompt }, { text: userPrompt }],
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
            const parsed = parseAiTextResponse(rawText);
            if (parsed && parsed.paragraph) {
              const cleaned = cleanTextForTyping(parsed.paragraph);
              return NextResponse.json<GenerateTextResponse>({
                title: parsed.title || customPrompt || 'Gemini Story Stream',
                text: cleaned,
                words: paragraphToWords(cleaned),
                theme,
                modelUsed: 'Google AI Studio (Gemini 2.0)',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Google AI Studio API error during text generation, falling back:', err);
      }
    }

    // 2. Try Local Ollama (Gemma 4 E2B or Gemma 2 2B)
    const targetModel = provider === 'ollama_gemma2_2b' ? 'gemma2:2b' : 'gemma4:e2b';
    const numPredict = Math.max(280, Math.ceil(wordCount * 2.5));

    try {
      let ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        signal: AbortSignal.timeout(25000),
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
            temperature: 0.7,
            num_predict: numPredict,
          },
        }),
      });

      // Fallback to gemma2:2b if targetModel fails
      if (!ollamaResponse.ok && targetModel !== 'gemma2:2b') {
        ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
          method: 'POST',
          signal: AbortSignal.timeout(20000),
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
              temperature: 0.7,
              num_predict: numPredict,
            },
          }),
        });
      }

      if (ollamaResponse && ollamaResponse.ok) {
        const data = await ollamaResponse.json();
        const content = data.message?.content || '{}';
        const parsed = parseAiTextResponse(content);
        if (parsed && parsed.paragraph) {
          const cleaned = cleanTextForTyping(parsed.paragraph);
          return NextResponse.json<GenerateTextResponse>({
            title: parsed.title || customPrompt || 'Gemma Narrative Drill',
            text: cleaned,
            words: paragraphToWords(cleaned),
            theme,
            modelUsed: data.model || targetModel,
          });
        }
      }
    } catch (ollamaErr) {
      console.warn('Ollama offline or unreachable for text generation:', ollamaErr);
    }

    // 3. Resilient Fallback: Curated High-Quality Passage
    const fallback = (!theme || theme === 'custom')
      ? getRandomCuratedPassage()
      : getCuratedPassage(theme as AIThemeId);
    const cleaned = cleanTextForTyping(fallback.text);
    return NextResponse.json<GenerateTextResponse>({
      title: fallback.title,
      text: cleaned,
      words: paragraphToWords(cleaned),
      theme: fallback.theme,
      modelUsed: 'TypoLoop Curated Engine (Offline Fallback)',
    });
  } catch (error: any) {
    console.error('generate-text route fatal error:', error);
    const fallback = getRandomCuratedPassage();
    const cleaned = cleanTextForTyping(fallback.text);
    return NextResponse.json<GenerateTextResponse>({
      title: fallback.title,
      text: cleaned,
      words: paragraphToWords(cleaned),
      theme: fallback.theme,
      modelUsed: 'TypoLoop Curated Fallback',
    });
  }
}

interface ParsedParagraph {
  title?: string;
  paragraph?: string;
}

function parseAiTextResponse(raw: string): ParsedParagraph | null {
  const cleaned = raw.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();

  // Attempt 1: Standard JSON.parse
  try {
    const obj = JSON.parse(cleaned);
    const paragraph = obj.paragraph || obj.text || obj.passage || obj.content;
    if (paragraph && typeof paragraph === 'string') {
      return {
        title: obj.title || obj.headline || 'Generated Passage',
        paragraph,
      };
    }
  } catch {
    // Attempt 2: Fix trailing commas
    try {
      const fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
      const obj = JSON.parse(fixed);
      const paragraph = obj.paragraph || obj.text || obj.passage || obj.content;
      if (paragraph && typeof paragraph === 'string') {
        return {
          title: obj.title || obj.headline || 'Generated Passage',
          paragraph,
        };
      }
    } catch {
      // Attempt 3: Regex match
      const pMatch = cleaned.match(/"(?:paragraph|text|passage|content)"\s*:\s*"([^"]+)"/);
      const tMatch = cleaned.match(/"(?:title|headline)"\s*:\s*"([^"]+)"/);
      if (pMatch && pMatch[1]) {
        return {
          title: tMatch ? tMatch[1] : 'Generated Passage',
          paragraph: pMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"'),
        };
      }
    }
  }

  // If response is just plain text (didn't format as JSON)
  if (cleaned.length > 30 && !cleaned.startsWith('{')) {
    return {
      title: 'Gemma Thought Flow',
      paragraph: cleaned,
    };
  }

  return null;
}
