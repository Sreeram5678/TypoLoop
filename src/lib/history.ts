import { TypingDiagnostics, TypingStats } from '@/types/typing';

export interface TestHistoryEntry {
  id: string;
  timestamp: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  elapsedSeconds: number;
  correctChars: number;
  incorrectChars: number;
  mode: string;
}

const HISTORY_STORAGE_KEY = 'typoloop_history';
const LATEST_DIAG_KEY = 'typoloop_latest_diagnostics';

export function saveTestToHistory(
  stats: TypingStats,
  mode: string = 'timed',
  diagnostics?: TypingDiagnostics
): TestHistoryEntry {
  const entry: TestHistoryEntry = {
    id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    wpm: stats.wpm,
    rawWpm: stats.rawWpm,
    accuracy: stats.accuracy,
    consistency: stats.consistency,
    elapsedSeconds: stats.elapsedTime,
    correctChars: stats.correctChars,
    incorrectChars: stats.incorrectChars,
    mode,
  };

  if (typeof window !== 'undefined') {
    try {
      const existingStr = localStorage.getItem(HISTORY_STORAGE_KEY);
      const existing: TestHistoryEntry[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [entry, ...existing].slice(0, 50); // Keep last 50
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));

      if (diagnostics) {
        localStorage.setItem(LATEST_DIAG_KEY, JSON.stringify(diagnostics));
      }
    } catch {
      // storage limit or SSR
    }
  }

  return entry;
}

export function getTestHistory(): TestHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLatestDiagnostics(): TypingDiagnostics | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LATEST_DIAG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTestHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(LATEST_DIAG_KEY);
  }
}
