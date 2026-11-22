import {
  SessionRecord,
  AggregatedMasteryProfile,
  ChronicWeakBigram,
  ProfileHistoricalContext,
  TypingStats,
  FingerName,
} from '../types/typing';

export const STORAGE_KEY_HISTORY = 'typoloop_history_v1';
export const STORAGE_KEY_PROFILE = 'typoloop_profile_v1';

const DEFAULT_FINGER_ERRORS: Record<FingerName, number> = {
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

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const globalObj = globalThis as unknown as { localStorage?: Storage };
  if (typeof globalThis !== 'undefined' && globalObj.localStorage) {
    return globalObj.localStorage;
  }
  return null;
}

export function getDefaultProfile(): AggregatedMasteryProfile {
  return {
    totalSessions: 0,
    totalTimeSeconds: 0,
    totalWordsTyped: 0,
    personalBests: {
      bestWpm: 0,
      bestRawWpm: 0,
      bestAccuracy: 0,
      longestCleanStreak: 0,
    },
    rollingAverages: {
      wpm: 0,
      rawWpm: 0,
      accuracy: 0,
      consistency: 0,
    },
    lifetimeFingerErrors: { ...DEFAULT_FINGER_ERRORS },
    lifetimeKeyErrors: {},
    chronicWeakBigrams: [],
    activityDates: {},
    streakDays: 0,
    lastActiveDate: undefined,
  };
}

export function getDateString(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateStreak(
  activityDates: Record<string, number>,
  referenceDate?: Date
): number {
  const activeDates = Object.keys(activityDates).filter((d) => (activityDates[d] || 0) > 0);
  if (activeDates.length === 0) return 0;

  const ref = referenceDate ? new Date(referenceDate) : new Date();
  // Anchor to 12:00 PM to avoid DST offset boundary issues
  const current = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0);
  let currentKey = getDateString(current.getTime());

  // If the reference date itself has no activity, allow yesterday as grace period
  if (!activityDates[currentKey] || activityDates[currentKey] <= 0) {
    current.setDate(current.getDate() - 1);
    currentKey = getDateString(current.getTime());
    if (!activityDates[currentKey] || activityDates[currentKey] <= 0) {
      return 0;
    }
  }

  let streak = 0;
  while (true) {
    const key = getDateString(current.getTime());
    if (activityDates[key] && activityDates[key] > 0) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getHistory(): SessionRecord[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getMasteryProfile(): AggregatedMasteryProfile {
  const storage = getStorage();
  if (!storage) return getDefaultProfile();
  try {
    const raw = storage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return getDefaultProfile();
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultProfile(),
      ...parsed,
      personalBests: {
        ...getDefaultProfile().personalBests,
        ...(parsed.personalBests || {}),
      },
      rollingAverages: {
        ...getDefaultProfile().rollingAverages,
        ...(parsed.rollingAverages || {}),
      },
      lifetimeFingerErrors: {
        ...getDefaultProfile().lifetimeFingerErrors,
        ...(parsed.lifetimeFingerErrors || {}),
      },
      lifetimeKeyErrors: {
        ...(parsed.lifetimeKeyErrors || {}),
      },
      chronicWeakBigrams: parsed.chronicWeakBigrams || [],
      activityDates: parsed.activityDates || {},
    };
  } catch {
    return getDefaultProfile();
  }
}

export function computeHistoricalContext(
  currentStats: TypingStats,
  currentErrors: Record<string, number> = {},
  profileOverride?: AggregatedMasteryProfile
): ProfileHistoricalContext {
  const profile = profileOverride || getMasteryProfile();

  const rollingAvgWpm = profile.rollingAverages.wpm;
  const rollingAvgAccuracy = profile.rollingAverages.accuracy;

  const wpmDelta = Math.round((currentStats.wpm - rollingAvgWpm) * 10) / 10;
  const accuracyDelta = Math.round((currentStats.accuracy - rollingAvgAccuracy) * 10) / 10;

  const isPersonalBestWpm = profile.totalSessions === 0
    ? currentStats.wpm > 0
    : currentStats.wpm > profile.personalBests.bestWpm;

  // Identify chronic trouble keys: keys with persistent errors historically (sorted descending)
  const sortedLifetimeKeys = Object.entries(profile.lifetimeKeyErrors || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const chronicTroubleKeys = sortedLifetimeKeys
    .filter(([, count]) => count >= 2 || sortedLifetimeKeys.length <= 3)
    .slice(0, 5)
    .map(([key]) => key);

  // Improved keys: keys that were chronic trouble keys, but had 0 errors in this session
  const improvedKeys = chronicTroubleKeys.filter(
    (key) => !currentErrors[key] || currentErrors[key] === 0
  );

  return {
    totalSessions: profile.totalSessions,
    rollingAvgWpm,
    rollingAvgAccuracy,
    wpmDelta,
    accuracyDelta,
    isPersonalBestWpm,
    chronicTroubleKeys,
    improvedKeys,
  };
}

export function saveSession(
  record: Omit<SessionRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: number }
): {
  profile: AggregatedMasteryProfile;
  historicalContext: ProfileHistoricalContext;
  record: SessionRecord;
} {
  const prevProfile = getMasteryProfile();
  const prevHistory = getHistory();

  const id =
    record.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const timestamp = record.timestamp ?? Date.now();

  const finalRecord: SessionRecord = {
    ...record,
    id,
    timestamp,
  };

  // Compute historical context relative to baseline before this session was merged
  const historicalContext = computeHistoricalContext(
    finalRecord.stats,
    finalRecord.diagnosticsSummary?.keyErrors || {},
    prevProfile
  );
  historicalContext.totalSessions = prevProfile.totalSessions + 1;

  // New history list (newest first, up to 100 sessions)
  const updatedHistory = [finalRecord, ...prevHistory].slice(0, 100);

  // Calculate rolling averages over up to the last 10 sessions
  const last10 = updatedHistory.slice(0, 10);
  const count10 = last10.length;
  const rollingAverages = {
    wpm: Math.round((last10.reduce((acc, s) => acc + (s.stats?.wpm || 0), 0) / count10) * 10) / 10,
    rawWpm: Math.round((last10.reduce((acc, s) => acc + (s.stats?.rawWpm || 0), 0) / count10) * 10) / 10,
    accuracy: Math.round((last10.reduce((acc, s) => acc + (s.stats?.accuracy || 0), 0) / count10) * 10) / 10,
    consistency: Math.round((last10.reduce((acc, s) => acc + (s.stats?.consistency || 0), 0) / count10) * 10) / 10,
  };

  // Personal Bests
  const prevBests = prevProfile.personalBests || {
    bestWpm: 0,
    bestRawWpm: 0,
    bestAccuracy: 0,
    longestCleanStreak: 0,
  };

  const sessionCleanStreak =
    (record as { longestCleanStreak?: number }).longestCleanStreak ??
    (finalRecord.stats.incorrectChars === 0 ? finalRecord.stats.correctChars : 0);

  const personalBests = {
    bestWpm: Math.max(prevBests.bestWpm, finalRecord.stats.wpm),
    bestRawWpm: Math.max(prevBests.bestRawWpm, finalRecord.stats.rawWpm),
    bestAccuracy: Math.max(prevBests.bestAccuracy, finalRecord.stats.accuracy),
    longestCleanStreak: Math.max(prevBests.longestCleanStreak || 0, sessionCleanStreak),
  };

  // Words typed (1 word = 5 chars or explicit wordCount)
  const wordsTyped =
    (record as { wordCount?: number }).wordCount ??
    Math.round((finalRecord.stats?.correctChars ?? 0) / 5);

  // Accumulate lifetime finger errors
  const lifetimeFingerErrors: Record<FingerName, number> = {
    ...DEFAULT_FINGER_ERRORS,
    ...(prevProfile.lifetimeFingerErrors || {}),
  };
  if (finalRecord.diagnosticsSummary?.fingerErrors) {
    for (const [finger, errCount] of Object.entries(finalRecord.diagnosticsSummary.fingerErrors)) {
      if (finger in lifetimeFingerErrors) {
        lifetimeFingerErrors[finger as FingerName] =
          (lifetimeFingerErrors[finger as FingerName] || 0) + (errCount || 0);
      } else {
        lifetimeFingerErrors[finger as FingerName] = errCount || 0;
      }
    }
  }

  // Accumulate lifetime key errors
  const lifetimeKeyErrors: Record<string, number> = {
    ...(prevProfile.lifetimeKeyErrors || {}),
  };
  if (finalRecord.diagnosticsSummary?.keyErrors) {
    for (const [key, errCount] of Object.entries(finalRecord.diagnosticsSummary.keyErrors)) {
      lifetimeKeyErrors[key] = (lifetimeKeyErrors[key] || 0) + (errCount || 0);
    }
  }

  // Activity dates & streak
  const dateKey = getDateString(finalRecord.timestamp);
  const activityDates: Record<string, number> = {
    ...(prevProfile.activityDates || {}),
  };
  activityDates[dateKey] = (activityDates[dateKey] || 0) + 1;
  const streakDays = calculateStreak(activityDates, new Date(finalRecord.timestamp));

  // Chronic Weak Bigrams update
  const chronicBigramsMap = new Map<string, ChronicWeakBigram>();
  for (const c of prevProfile.chronicWeakBigrams || []) {
    chronicBigramsMap.set(c.bigram, { ...c });
  }

  const sessionBigrams = finalRecord.diagnosticsSummary?.weakBigrams || [];
  const sessionBigramKeys = new Set<string>();

  for (const b of sessionBigrams) {
    sessionBigramKeys.add(b.bigram);
    const existing = chronicBigramsMap.get(b.bigram);
    if (existing) {
      const newTotalErrors = existing.errorCount + b.errorCount;
      existing.avgIkiMs =
        newTotalErrors > 0
          ? Math.round(
              (existing.avgIkiMs * existing.errorCount + b.avgIkiMs * b.errorCount) /
                newTotalErrors
            )
          : b.avgIkiMs;
      existing.errorCount = newTotalErrors;
      existing.lastSeen = finalRecord.timestamp;
      existing.status = 'active';
    } else {
      chronicBigramsMap.set(b.bigram, {
        bigram: b.bigram,
        errorCount: b.errorCount,
        avgIkiMs: b.avgIkiMs,
        lastSeen: finalRecord.timestamp,
        status: 'active',
      });
    }
  }

  // Handle graduation: if a chronic bigram was active and has been clean for 3+ consecutive sessions
  for (const chronic of chronicBigramsMap.values()) {
    if (!sessionBigramKeys.has(chronic.bigram) && chronic.status === 'active') {
      let consecutiveCleanSessions = 0;
      for (const s of updatedHistory) {
        const hadError = s.diagnosticsSummary?.weakBigrams?.some(
          (wb) => wb.bigram === chronic.bigram
        );
        if (!hadError) {
          consecutiveCleanSessions++;
        } else {
          break;
        }
      }
      if (consecutiveCleanSessions >= 3) {
        chronic.status = 'graduated';
      }
    }
  }

  const chronicWeakBigrams = Array.from(chronicBigramsMap.values());

  const updatedProfile: AggregatedMasteryProfile = {
    totalSessions: prevProfile.totalSessions + 1,
    totalTimeSeconds:
      Math.round(
        (prevProfile.totalTimeSeconds + (finalRecord.duration || finalRecord.stats?.elapsedTime || 0)) *
          100
      ) / 100,
    totalWordsTyped: prevProfile.totalWordsTyped + wordsTyped,
    personalBests,
    rollingAverages,
    lifetimeFingerErrors,
    lifetimeKeyErrors,
    chronicWeakBigrams,
    activityDates,
    streakDays,
    lastActiveDate: dateKey,
  };

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
      storage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updatedProfile));
    } catch (err) {
      console.error('Failed to save to storage:', err);
    }
  }

  return {
    profile: updatedProfile,
    historicalContext,
    record: finalRecord,
  };
}

export function rebuildProfileFromHistory(history: SessionRecord[]): AggregatedMasteryProfile {
  const chronological = [...history].sort((a, b) => a.timestamp - b.timestamp);
  let profile = getDefaultProfile();

  // Reset storage temporarily if needed, but here we can just simulate saving or aggregate directly
  for (const record of chronological) {
    const sessionCleanStreak =
      (record as unknown as { longestCleanStreak?: number }).longestCleanStreak ??
      (record.stats.incorrectChars === 0 ? record.stats.correctChars : 0);

    const personalBests = {
      bestWpm: Math.max(profile.personalBests.bestWpm, record.stats.wpm),
      bestRawWpm: Math.max(profile.personalBests.bestRawWpm, record.stats.rawWpm),
      bestAccuracy: Math.max(profile.personalBests.bestAccuracy, record.stats.accuracy),
      longestCleanStreak: Math.max(profile.personalBests.longestCleanStreak || 0, sessionCleanStreak),
    };

    const wordsTyped =
      (record as unknown as { wordCount?: number }).wordCount ??
      Math.round((record.stats?.correctChars ?? 0) / 5);

    const lifetimeFingerErrors: Record<FingerName, number> = {
      ...profile.lifetimeFingerErrors,
    };
    if (record.diagnosticsSummary?.fingerErrors) {
      for (const [finger, count] of Object.entries(record.diagnosticsSummary.fingerErrors)) {
        lifetimeFingerErrors[finger as FingerName] =
          (lifetimeFingerErrors[finger as FingerName] || 0) + (count || 0);
      }
    }

    const lifetimeKeyErrors: Record<string, number> = {
      ...profile.lifetimeKeyErrors,
    };
    if (record.diagnosticsSummary?.keyErrors) {
      for (const [key, count] of Object.entries(record.diagnosticsSummary.keyErrors)) {
        lifetimeKeyErrors[key] = (lifetimeKeyErrors[key] || 0) + (count || 0);
      }
    }

    const dateKey = getDateString(record.timestamp);
    const activityDates: Record<string, number> = {
      ...profile.activityDates,
    };
    activityDates[dateKey] = (activityDates[dateKey] || 0) + 1;

    profile = {
      ...profile,
      totalSessions: profile.totalSessions + 1,
      totalTimeSeconds:
        Math.round(
          (profile.totalTimeSeconds + (record.duration || record.stats?.elapsedTime || 0)) * 100
        ) / 100,
      totalWordsTyped: profile.totalWordsTyped + wordsTyped,
      personalBests,
      lifetimeFingerErrors,
      lifetimeKeyErrors,
      activityDates,
      lastActiveDate: dateKey,
    };
  }

  // Compute rolling averages from last 10 (chronological.slice(-10))
  const last10 = chronological.slice(-10);
  if (last10.length > 0) {
    const count = last10.length;
    profile.rollingAverages = {
      wpm: Math.round((last10.reduce((acc, s) => acc + (s.stats?.wpm || 0), 0) / count) * 10) / 10,
      rawWpm: Math.round((last10.reduce((acc, s) => acc + (s.stats?.rawWpm || 0), 0) / count) * 10) / 10,
      accuracy: Math.round((last10.reduce((acc, s) => acc + (s.stats?.accuracy || 0), 0) / count) * 10) / 10,
      consistency: Math.round((last10.reduce((acc, s) => acc + (s.stats?.consistency || 0), 0) / count) * 10) / 10,
    };
  }

  // Calculate streak from latest session date
  const latestSession = chronological[chronological.length - 1];
  if (latestSession) {
    profile.streakDays = calculateStreak(profile.activityDates, new Date(latestSession.timestamp));
  }

  // Compute chronic weak bigrams
  const chronicMap = new Map<string, ChronicWeakBigram>();
  for (let i = 0; i < chronological.length; i++) {
    const s = chronological[i];
    const weakBigrams = s.diagnosticsSummary?.weakBigrams || [];
    for (const b of weakBigrams) {
      const existing = chronicMap.get(b.bigram);
      if (existing) {
        const total = existing.errorCount + b.errorCount;
        existing.avgIkiMs =
          total > 0
            ? Math.round((existing.avgIkiMs * existing.errorCount + b.avgIkiMs * b.errorCount) / total)
            : b.avgIkiMs;
        existing.errorCount = total;
        existing.lastSeen = s.timestamp;
        existing.status = 'active';
      } else {
        chronicMap.set(b.bigram, {
          bigram: b.bigram,
          errorCount: b.errorCount,
          avgIkiMs: b.avgIkiMs,
          lastSeen: s.timestamp,
          status: 'active',
        });
      }
    }
  }

  // Check graduation against history
  const historyNewestFirst = [...chronological].reverse();
  for (const chronic of chronicMap.values()) {
    let cleanCount = 0;
    for (const s of historyNewestFirst) {
      const hadError = s.diagnosticsSummary?.weakBigrams?.some((wb) => wb.bigram === chronic.bigram);
      if (!hadError) {
        cleanCount++;
      } else {
        break;
      }
    }
    if (cleanCount >= 3) {
      chronic.status = 'graduated';
    }
  }

  profile.chronicWeakBigrams = Array.from(chronicMap.values());

  return profile;
}

export function exportHistoryJson(): string {
  const history = getHistory();
  const profile = getMasteryProfile();
  return JSON.stringify(
    {
      app: 'typoloop',
      version: 1,
      exportedAt: Date.now(),
      history,
      profile,
    },
    null,
    2
  );
}

export function importHistoryJson(jsonStr: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const parsed = JSON.parse(jsonStr);
    let history: SessionRecord[] = [];
    let profile: AggregatedMasteryProfile | null = null;

    if (Array.isArray(parsed)) {
      history = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.history)) {
        history = parsed.history;
      }
      if (parsed.profile && typeof parsed.profile === 'object') {
        profile = parsed.profile;
      }
    } else {
      return false;
    }

    if (!profile) {
      profile = rebuildProfileFromHistory(history);
    }

    storage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 100)));
    storage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function clearAllHistory(): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY_HISTORY);
      storage.removeItem(STORAGE_KEY_PROFILE);
    } catch {
      // ignore
    }
  }
}

// Aliases for convenience across components
export const clearAllData = clearAllHistory;
export const exportData = exportHistoryJson;
export const importData = importHistoryJson;

