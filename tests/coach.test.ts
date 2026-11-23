import assert from 'node:assert';
import test from 'node:test';
import { buildGemmaCoachPrompt } from '../src/lib/ai/prompts';
import { TypingDiagnostics, ProfileHistoricalContext } from '../src/types/typing';
import { POST } from '../src/app/api/analyze/route';
import { NextRequest } from 'next/server';

const mockDiagnostics: TypingDiagnostics = {
  stats: {
    wpm: 75,
    rawWpm: 80,
    accuracy: 96,
    correctChars: 300,
    incorrectChars: 12,
    extraChars: 0,
    missedChars: 0,
    totalKeystrokes: 312,
    elapsedTime: 30,
    consistency: 90,
    wpmTimeline: [],
  },
  weakBigrams: [{ bigram: 'th', errorCount: 3, avgIkiMs: 140 }],
  hesitations: [{ character: 'p', avgLatencyMs: 250, count: 2 }],
  classifiedErrors: [
    { expected: 'p', actual: 'o', type: 'ADJACENT_FAT_FINGER', finger: 'right_pinky', timestamp: 1000 },
  ],
  fingerErrors: {
    left_pinky: 0,
    left_ring: 0,
    left_middle: 0,
    left_index: 0,
    left_thumb: 0,
    right_thumb: 0,
    right_index: 0,
    right_middle: 0,
    right_ring: 0,
    right_pinky: 1,
  },
  handBalance: {
    leftHandErrors: 0,
    rightHandErrors: 1,
    leftErrorPercentage: 0,
    rightErrorPercentage: 100,
  },
  errorTypeBreakdown: {
    ADJACENT_FAT_FINGER: 1,
    TRANSPOSITION: 0,
    OMISSION: 0,
    INSERTION: 0,
    CASE_MISMATCH: 0,
    OTHER: 0,
  },
};

test('buildGemmaCoachPrompt includes trendObservation in schema', () => {
  const { systemPrompt, userPrompt } = buildGemmaCoachPrompt(mockDiagnostics);

  assert.ok(systemPrompt.includes('"trendObservation"'));
  assert.ok(systemPrompt.includes('Evaluate both the current biomechanical error telemetry AND the historical trajectory.'));
  assert.strictEqual(userPrompt.includes('HISTORICAL PROFILE & BASELINE:'), false);
});

test('buildGemmaCoachPrompt formats historicalContext correctly in userPrompt', () => {
  const historicalContext: ProfileHistoricalContext = {
    totalSessions: 14,
    rollingAvgWpm: 68,
    rollingAvgAccuracy: 94,
    wpmDelta: 7,
    accuracyDelta: 2,
    isPersonalBestWpm: true,
    chronicTroubleKeys: ['p', 'q'],
    improvedKeys: ['b', 'z'],
  };

  const { systemPrompt, userPrompt } = buildGemmaCoachPrompt(mockDiagnostics, historicalContext);

  assert.ok(systemPrompt.includes('"trendObservation"'));
  assert.ok(userPrompt.includes('HISTORICAL PROFILE & BASELINE:'));
  assert.ok(userPrompt.includes('- Lifetime Sessions: 14'));
  assert.ok(userPrompt.includes('- Rolling Baseline WPM: 68 (Current Delta: +7 WPM)'));
  assert.ok(userPrompt.includes('- Rolling Baseline Accuracy: 94% (Current Delta: +2%)'));
  assert.ok(userPrompt.includes('- Personal Best Achieved: YES (New Peak Speed Record!)'));
  assert.ok(userPrompt.includes('- Chronic Trouble Keys: p, q'));
  assert.ok(userPrompt.includes('- Keys Improved This Session: b, z'));
});

test('POST /api/analyze populates trendObservation in heuristic fallback mode', async () => {
  const historicalContext: ProfileHistoricalContext = {
    totalSessions: 25,
    rollingAvgWpm: 70,
    rollingAvgAccuracy: 95,
    wpmDelta: 5,
    accuracyDelta: 1,
    isPersonalBestWpm: true,
    chronicTroubleKeys: ['p'],
    improvedKeys: ['p'],
  };

  const request = new NextRequest('http://localhost:3000/api/analyze', {
    method: 'POST',
    body: JSON.stringify({
      diagnostics: mockDiagnostics,
      historicalContext,
      provider: 'ollama_gemma4_e2b',
      ollamaBaseUrl: 'http://127.0.0.1:99999', // Guaranteed invalid to trigger heuristic fallback
    }),
  });

  const response = await POST(request);
  assert.strictEqual(response.status, 200);

  const data = await response.json();
  assert.ok(data.headline);
  assert.ok(data.mechanicalDiagnosis);
  assert.ok(data.trendObservation);
  assert.ok(data.trendObservation.includes('personal speed record') || data.trendObservation.includes('Personal Record'));
});
