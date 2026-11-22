import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import {
  saveSession,
  getHistory,
  getMasteryProfile,
  computeHistoricalContext,
  exportHistoryJson,
  importHistoryJson,
  clearAllHistory,
  calculateStreak,
} from '../src/lib/storage';
import { TypingStats, FingerName, ErrorType } from '../src/types/typing';

class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

// Mock localStorage and window in Node environment
const mockStorage = new MockLocalStorage();
(globalThis as unknown as { localStorage: Storage }).localStorage = mockStorage as unknown as Storage;
(globalThis as unknown as { window: unknown }).window = globalThis;

const EMPTY_FINGERS: Record<FingerName, number> = {
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

const EMPTY_ERROR_BREAKDOWN: Record<ErrorType, number> = {
  ADJACENT_FAT_FINGER: 0,
  TRANSPOSITION: 0,
  OMISSION: 0,
  INSERTION: 0,
  CASE_MISMATCH: 0,
  OTHER: 0,
};

function makeSampleStats(overrides: Partial<TypingStats> = {}): TypingStats {
  return {
    wpm: 60,
    rawWpm: 65,
    accuracy: 95,
    correctChars: 150,
    incorrectChars: 5,
    extraChars: 0,
    missedChars: 2,
    totalKeystrokes: 155,
    elapsedTime: 30,
    consistency: 85,
    wpmTimeline: [],
    ...overrides,
  };
}

describe('Storage Engine and Mastery Profile Aggregator', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('getMasteryProfile returns default profile when storage is empty', () => {
    const profile = getMasteryProfile();
    assert.strictEqual(profile.totalSessions, 0);
    assert.strictEqual(profile.totalTimeSeconds, 0);
    assert.strictEqual(profile.totalWordsTyped, 0);
    assert.strictEqual(profile.personalBests.bestWpm, 0);
    assert.strictEqual(profile.personalBests.bestAccuracy, 0);
    assert.strictEqual(profile.rollingAverages.wpm, 0);
    assert.strictEqual(profile.streakDays, 0);
    assert.deepStrictEqual(profile.chronicWeakBigrams, []);
    assert.strictEqual(profile.lifetimeFingerErrors.left_index, 0);
  });

  it('saveSession generates ID, timestamp, and adds session to history and profile', () => {
    const { profile, historicalContext, record } = saveSession({
      mode: 'words',
      duration: 30,
      stats: makeSampleStats({ wpm: 75, rawWpm: 80, accuracy: 96 }),
      diagnosticsSummary: {
        weakBigrams: [{ bigram: 'th', errorCount: 2, avgIkiMs: 140 }],
        hesitations: [],
        fingerErrors: {
          ...EMPTY_FINGERS,
          left_index: 2,
          right_index: 1,
        },
        keyErrors: { t: 2, h: 1 },
        errorTypeBreakdown: {
          ...EMPTY_ERROR_BREAKDOWN,
          ADJACENT_FAT_FINGER: 1,
          OMISSION: 1,
        },
        handBalance: {
          leftHandErrors: 2,
          rightHandErrors: 1,
          leftErrorPercentage: 67,
          rightErrorPercentage: 33,
        },
      },
    });

    // Verify record generation
    assert.ok(record.id.length > 0);
    assert.ok(record.timestamp > 0);

    // Verify history contains record
    const history = getHistory();
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].id, record.id);
    assert.strictEqual(history[0].stats.wpm, 75);

    // Verify profile telemetry
    assert.strictEqual(profile.totalSessions, 1);
    assert.strictEqual(profile.totalTimeSeconds, 30);
    assert.strictEqual(profile.totalWordsTyped, 30); // 150 correct chars / 5 = 30 words
    assert.strictEqual(profile.personalBests.bestWpm, 75);
    assert.strictEqual(profile.personalBests.bestRawWpm, 80);
    assert.strictEqual(profile.personalBests.bestAccuracy, 96);
    assert.strictEqual(profile.rollingAverages.wpm, 75);
    assert.strictEqual(profile.lifetimeFingerErrors.left_index, 2);
    assert.strictEqual(profile.lifetimeFingerErrors.right_index, 1);
    assert.strictEqual(profile.lifetimeKeyErrors['t'], 2);
    assert.strictEqual(profile.lifetimeKeyErrors['h'], 1);
    assert.strictEqual(profile.streakDays, 1);

    // Verify historical context
    assert.strictEqual(historicalContext.totalSessions, 1);
    assert.strictEqual(historicalContext.isPersonalBestWpm, true);
    assert.strictEqual(historicalContext.rollingAvgWpm, 0); // baseline before session
    assert.strictEqual(historicalContext.wpmDelta, 75);
  });

  it('rollingAverages correctly calculates over the last 10 sessions', () => {
    // Save 12 sessions with varying speeds
    for (let i = 1; i <= 12; i++) {
      saveSession({
        mode: 'words',
        duration: 30,
        stats: makeSampleStats({
          wpm: i * 10, // 10, 20, 30, ..., 120
          rawWpm: i * 10 + 5,
          accuracy: 90 + (i % 10),
          consistency: 80,
        }),
        diagnosticsSummary: {
          weakBigrams: [],
          hesitations: [],
          fingerErrors: { ...EMPTY_FINGERS },
          keyErrors: {},
          errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
          handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
        },
      });
    }

    const history = getHistory();
    assert.strictEqual(history.length, 12);

    const profile = getMasteryProfile();
    // Last 10 sessions are sessions 12 down to 3 (values: 30, 40, 50, 60, 70, 80, 90, 100, 110, 120)
    // Sum = (30 + 120) * 10 / 2 = 750 / 10 = 75 WPM
    assert.strictEqual(profile.rollingAverages.wpm, 75);
    // Raw WPM: 75 + 5 = 80
    assert.strictEqual(profile.rollingAverages.rawWpm, 80);
    assert.strictEqual(profile.personalBests.bestWpm, 120);
    assert.strictEqual(profile.totalSessions, 12);
  });

  it('session history is capped at 100 entries', () => {
    for (let i = 0; i < 110; i++) {
      saveSession({
        mode: 'words',
        duration: 10,
        stats: makeSampleStats({ wpm: 50 }),
        diagnosticsSummary: {
          weakBigrams: [],
          hesitations: [],
          fingerErrors: { ...EMPTY_FINGERS },
          keyErrors: {},
          errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
          handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
        },
      });
    }

    const history = getHistory();
    assert.strictEqual(history.length, 100);
    const profile = getMasteryProfile();
    assert.strictEqual(profile.totalSessions, 110); // Profile tracks true lifetime count
  });

  it('calculates consecutive day streaks correctly across dates', () => {
    const dates: Record<string, number> = {
      '2026-11-18': 2,
      '2026-11-19': 1,
      '2026-11-20': 4,
      '2026-11-21': 3,
    };
    const streak = calculateStreak(dates, new Date('2026-11-21T15:00:00Z'));
    assert.strictEqual(streak, 4);

    // If day was missed (e.g. 2026-11-19 missing)
    const datesWithGap: Record<string, number> = {
      '2026-11-18': 2,
      '2026-11-20': 4,
      '2026-11-21': 3,
    };
    const streakGap = calculateStreak(datesWithGap, new Date('2026-11-21T15:00:00Z'));
    assert.strictEqual(streakGap, 2); // 21st and 20th
  });

  it('manages chronic weak bigrams: accrual and graduation after 3 clean sessions', () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Session 1: 'in' has errors
    saveSession({
      timestamp: now - 4 * oneDay,
      mode: 'words',
      duration: 30,
      stats: makeSampleStats(),
      diagnosticsSummary: {
        weakBigrams: [{ bigram: 'in', errorCount: 3, avgIkiMs: 180 }],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS },
        keyErrors: {},
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
      },
    });

    let profile = getMasteryProfile();
    let inBigram = profile.chronicWeakBigrams.find((b) => b.bigram === 'in');
    assert.ok(inBigram);
    assert.strictEqual(inBigram.errorCount, 3);
    assert.strictEqual(inBigram.status, 'active');

    // Session 2: 'in' clean
    saveSession({
      timestamp: now - 3 * oneDay,
      mode: 'words',
      duration: 30,
      stats: makeSampleStats(),
      diagnosticsSummary: {
        weakBigrams: [],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS },
        keyErrors: {},
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
      },
    });
    profile = getMasteryProfile();
    inBigram = profile.chronicWeakBigrams.find((b) => b.bigram === 'in');
    assert.strictEqual(inBigram?.status, 'active'); // Only 1 clean session so far

    // Session 3: 'in' clean (2 clean sessions)
    saveSession({
      timestamp: now - 2 * oneDay,
      mode: 'words',
      duration: 30,
      stats: makeSampleStats(),
      diagnosticsSummary: {
        weakBigrams: [],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS },
        keyErrors: {},
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
      },
    });
    profile = getMasteryProfile();
    inBigram = profile.chronicWeakBigrams.find((b) => b.bigram === 'in');
    assert.strictEqual(inBigram?.status, 'active'); // Only 2 clean sessions

    // Session 4: 'in' clean (3 clean sessions -> should graduate!)
    saveSession({
      timestamp: now - 1 * oneDay,
      mode: 'words',
      duration: 30,
      stats: makeSampleStats(),
      diagnosticsSummary: {
        weakBigrams: [],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS },
        keyErrors: {},
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
      },
    });
    profile = getMasteryProfile();
    inBigram = profile.chronicWeakBigrams.find((b) => b.bigram === 'in');
    assert.strictEqual(inBigram?.status, 'graduated');

    // Session 5: 'in' suffers a regression with errors -> reverts to active
    saveSession({
      timestamp: now,
      mode: 'words',
      duration: 30,
      stats: makeSampleStats(),
      diagnosticsSummary: {
        weakBigrams: [{ bigram: 'in', errorCount: 1, avgIkiMs: 200 }],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS },
        keyErrors: {},
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
      },
    });
    profile = getMasteryProfile();
    inBigram = profile.chronicWeakBigrams.find((b) => b.bigram === 'in');
    assert.strictEqual(inBigram?.status, 'active');
    assert.strictEqual(inBigram?.errorCount, 4); // 3 + 1
  });

  it('computeHistoricalContext accurately detects deltas, personal bests, and improved keys', () => {
    // Populate profile with previous session
    saveSession({
      mode: 'words',
      duration: 30,
      stats: makeSampleStats({ wpm: 60, accuracy: 94 }),
      diagnosticsSummary: {
        weakBigrams: [],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS },
        keyErrors: { p: 5, q: 4, z: 3 },
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 0, rightHandErrors: 0, leftErrorPercentage: 50, rightErrorPercentage: 50 },
      },
    });

    // Test a new session where:
    // - wpm is 70 (+10 delta)
    // - accuracy is 98% (+4% delta)
    // - 'p' and 'z' have 0 errors (improved!), but 'q' still has errors
    const context = computeHistoricalContext(
      makeSampleStats({ wpm: 70, accuracy: 98 }),
      { q: 2 } // current session key errors
    );

    assert.strictEqual(context.rollingAvgWpm, 60);
    assert.strictEqual(context.rollingAvgAccuracy, 94);
    assert.strictEqual(context.wpmDelta, 10);
    assert.strictEqual(context.accuracyDelta, 4);
    assert.strictEqual(context.isPersonalBestWpm, true);
    assert.ok(context.chronicTroubleKeys.includes('p'));
    assert.ok(context.chronicTroubleKeys.includes('q'));
    assert.ok(context.chronicTroubleKeys.includes('z'));
    assert.ok(context.improvedKeys.includes('p'));
    assert.ok(context.improvedKeys.includes('z'));
    assert.ok(!context.improvedKeys.includes('q')); // 'q' still had errors
  });

  it('exportHistoryJson, clearAllHistory, and importHistoryJson preserve telemetry integrity', () => {
    saveSession({
      mode: 'words',
      duration: 30,
      stats: makeSampleStats({ wpm: 85, rawWpm: 90, accuracy: 99 }),
      diagnosticsSummary: {
        weakBigrams: [{ bigram: 'er', errorCount: 1, avgIkiMs: 120 }],
        hesitations: [],
        fingerErrors: { ...EMPTY_FINGERS, left_middle: 1 },
        keyErrors: { e: 1 },
        errorTypeBreakdown: { ...EMPTY_ERROR_BREAKDOWN },
        handBalance: { leftHandErrors: 1, rightHandErrors: 0, leftErrorPercentage: 100, rightErrorPercentage: 0 },
      },
    });

    const exportedJson = exportHistoryJson();
    assert.ok(typeof exportedJson === 'string');
    assert.ok(exportedJson.includes('typoloop'));
    assert.ok(exportedJson.includes('"wpm": 85'));

    // Clear history
    clearAllHistory();
    assert.strictEqual(getHistory().length, 0);
    assert.strictEqual(getMasteryProfile().totalSessions, 0);

    // Import back
    const success = importHistoryJson(exportedJson);
    assert.strictEqual(success, true);

    const restoredHistory = getHistory();
    assert.strictEqual(restoredHistory.length, 1);
    assert.strictEqual(restoredHistory[0].stats.wpm, 85);

    const restoredProfile = getMasteryProfile();
    assert.strictEqual(restoredProfile.totalSessions, 1);
    assert.strictEqual(restoredProfile.personalBests.bestWpm, 85);
    assert.strictEqual(restoredProfile.lifetimeKeyErrors['e'], 1);

    // Invalid JSON import returns false
    const invalidSuccess = importHistoryJson('{ invalid json');
    assert.strictEqual(invalidSuccess, false);
  });
});
