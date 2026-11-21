import {
  KeystrokeEvent,
  TypingStats,
  TypingDiagnostics,
  WeakBigram,
  HesitationSpot,
  ClassifiedError,
  FingerName,
  ErrorType,
} from '@/types/typing';
import { areKeysPhysicallyAdjacent, getKeyFinger, getKeyHand } from './keyboard-layout';

export function calculateTypingStats(
  keystrokes: KeystrokeEvent[],
  elapsedSeconds: number,
  expectedText: string
): TypingStats {
  const durationMinutes = Math.max(elapsedSeconds / 60, 0.05);
  const totalKeystrokes = keystrokes.length;

  let correctChars = 0;
  let incorrectChars = 0;

  for (const ks of keystrokes) {
    if (ks.isCorrect) {
      correctChars++;
    } else {
      incorrectChars++;
    }
  }

  // Standard touch typing formula: 1 word = 5 characters
  const rawWpm = Math.round((totalKeystrokes / 5) / durationMinutes);
  const netWpm = Math.max(0, Math.round((correctChars / 5) / durationMinutes));
  const accuracy = totalKeystrokes > 0
    ? Math.round((correctChars / totalKeystrokes) * 1000) / 10
    : 100;

  // Compute second-by-second timeline
  const wpmTimeline: Array<{ time: number; wpm: number; rawWpm: number; errors: number }> = [];
  const maxSecond = Math.ceil(elapsedSeconds);

  for (let sec = 1; sec <= maxSecond; sec++) {
    const keysInWindow = keystrokes.filter(
      (k) => (k.timestamp - keystrokes[0]?.timestamp) <= sec * 1000
    );
    const windowCorrect = keysInWindow.filter((k) => k.isCorrect).length;
    const windowErrors = keysInWindow.filter((k) => !k.isCorrect).length;
    const windowMins = sec / 60;

    const curWpm = Math.round((windowCorrect / 5) / windowMins);
    const curRawWpm = Math.round((keysInWindow.length / 5) / windowMins);

    wpmTimeline.push({
      time: sec,
      wpm: curWpm,
      rawWpm: curRawWpm,
      errors: windowErrors,
    });
  }

  // Calculate consistency (% inverse of coefficient of variation)
  let consistency = 85;
  if (wpmTimeline.length > 2) {
    const wpms = wpmTimeline.map((t) => t.wpm);
    const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / wpms.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    consistency = Math.max(0, Math.min(100, Math.round(100 - cv * 100)));
  }

  return {
    wpm: netWpm,
    rawWpm,
    accuracy,
    correctChars,
    incorrectChars,
    extraChars: 0,
    missedChars: Math.max(0, expectedText.length - totalKeystrokes),
    totalKeystrokes,
    elapsedTime: elapsedSeconds,
    consistency,
    wpmTimeline,
  };
}

export function extractDiagnostics(
  keystrokes: KeystrokeEvent[],
  stats: TypingStats
): TypingDiagnostics {
  const fingerErrors: Record<FingerName, number> = {
    left_pinky: 0,
    left_ring: 0,
    left_middle: 0,
    left_index: 0,
    left_thumb: 0,
    right_thumb: 0,
    right_index: 0,
    right_middle: 0,
    right_ring: 0,
    right_pinky: 0,
  };

  const errorTypeBreakdown: Record<ErrorType, number> = {
    ADJACENT_FAT_FINGER: 0,
    TRANSPOSITION: 0,
    OMISSION: 0,
    INSERTION: 0,
    CASE_MISMATCH: 0,
    OTHER: 0,
  };

  const classifiedErrors: ClassifiedError[] = [];
  const bigramMap: Map<string, { errors: number; totalIki: number; count: number }> = new Map();
  const latencyMap: Map<string, { totalIki: number; count: number }> = new Map();

  let leftHandErrors = 0;
  let rightHandErrors = 0;

  // Calculate median IKI for hesitation detection
  const ikis = keystrokes.map((k) => k.iki).filter((i) => i > 20 && i < 3000);
  const avgIki = ikis.length > 0 ? ikis.reduce((a, b) => a + b, 0) / ikis.length : 180;
  const hesitationThreshold = Math.max(avgIki * 2.2, 350);

  for (let i = 0; i < keystrokes.length; i++) {
    const cur = keystrokes[i];
    const prev = i > 0 ? keystrokes[i - 1] : null;

    // Track latency per char
    if (cur.key && cur.key.length === 1 && cur.iki > 0) {
      const char = cur.key.toLowerCase();
      const existing = latencyMap.get(char) || { totalIki: 0, count: 0 };
      latencyMap.set(char, {
        totalIki: existing.totalIki + cur.iki,
        count: existing.count + 1,
      });
    }

    // Track bigram
    if (prev && prev.key.length === 1 && cur.key.length === 1) {
      const bigram = (prev.expected + cur.expected).toLowerCase();
      const existing = bigramMap.get(bigram) || { errors: 0, totalIki: 0, count: 0 };
      bigramMap.set(bigram, {
        errors: existing.errors + (!cur.isCorrect ? 1 : 0),
        totalIki: existing.totalIki + cur.iki,
        count: existing.count + 1,
      });
    }

    // Classify error if incorrect
    if (!cur.isCorrect) {
      const finger = getKeyFinger(cur.expected);
      const hand = getKeyHand(cur.expected);
      fingerErrors[finger] = (fingerErrors[finger] || 0) + 1;

      if (hand === 'left') leftHandErrors++;
      else rightHandErrors++;

      let errorType: ErrorType = 'OTHER';

      // 1. Transposition check (e.g. typed 'e' then 'h' for 'the')
      if (
        prev &&
        !prev.isCorrect &&
        prev.key === cur.expected &&
        cur.key === prev.expected
      ) {
        errorType = 'TRANSPOSITION';
      }
      // 2. Case mismatch check
      else if (cur.key.toLowerCase() === cur.expected.toLowerCase()) {
        errorType = 'CASE_MISMATCH';
      }
      // 3. Adjacent key fat-finger check
      else if (areKeysPhysicallyAdjacent(cur.key, cur.expected)) {
        errorType = 'ADJACENT_FAT_FINGER';
      }

      errorTypeBreakdown[errorType]++;

      classifiedErrors.push({
        expected: cur.expected,
        actual: cur.key,
        type: errorType,
        finger,
        timestamp: cur.timestamp,
      });
    }
  }

  // Top weak bigrams (sorted by error count, then by average latency)
  const weakBigrams: WeakBigram[] = Array.from(bigramMap.entries())
    .filter(([_, data]) => data.errors > 0 || (data.count >= 2 && data.totalIki / data.count > hesitationThreshold))
    .map(([bigram, data]) => ({
      bigram,
      errorCount: data.errors,
      avgIkiMs: Math.round(data.totalIki / data.count),
    }))
    .sort((a, b) => b.errorCount - a.errorCount || b.avgIkiMs - a.avgIkiMs)
    .slice(0, 8);

  // Hesitation spots (characters where user paused significantly)
  const hesitations: HesitationSpot[] = Array.from(latencyMap.entries())
    .map(([character, data]) => ({
      character,
      avgLatencyMs: Math.round(data.totalIki / data.count),
      count: data.count,
    }))
    .filter((h) => h.avgLatencyMs >= hesitationThreshold && h.count >= 2)
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 6);

  const totalErrors = leftHandErrors + rightHandErrors;
  const leftErrorPercentage = totalErrors > 0 ? Math.round((leftHandErrors / totalErrors) * 100) : 50;
  const rightErrorPercentage = totalErrors > 0 ? Math.round((rightHandErrors / totalErrors) * 100) : 50;

  return {
    stats,
    weakBigrams,
    hesitations,
    classifiedErrors,
    fingerErrors,
    handBalance: {
      leftHandErrors,
      rightHandErrors,
      leftErrorPercentage,
      rightErrorPercentage,
    },
    errorTypeBreakdown,
  };
}
