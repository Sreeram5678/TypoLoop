export type FingerName =
  | 'left_pinky'
  | 'left_ring'
  | 'left_middle'
  | 'left_index'
  | 'left_thumb'
  | 'right_thumb'
  | 'right_index'
  | 'right_middle'
  | 'right_ring'
  | 'right_pinky';

export type ErrorType =
  | 'ADJACENT_FAT_FINGER'
  | 'TRANSPOSITION'
  | 'OMISSION'
  | 'INSERTION'
  | 'CASE_MISMATCH'
  | 'OTHER';

export interface KeystrokeEvent {
  key: string;
  code: string;
  expected: string;
  timestamp: number;
  duration: number; // keydown to keyup in ms
  isCorrect: boolean;
  iki: number; // Inter-Keystroke Interval (latency from previous keydown in ms)
  targetWordIndex: number;
  charIndex: number;
}

export interface TypingStats {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalKeystrokes: number;
  elapsedTime: number; // in seconds
  consistency: number; // 0 - 100%
  wpmTimeline: Array<{ time: number; wpm: number; rawWpm: number; errors: number }>;
}

export interface WeakBigram {
  bigram: string;
  errorCount: number;
  avgIkiMs: number;
}

export interface HesitationSpot {
  character: string;
  avgLatencyMs: number;
  count: number;
}

export interface ClassifiedError {
  expected: string;
  actual: string;
  type: ErrorType;
  finger: FingerName;
  timestamp: number;
}

export interface TypingDiagnostics {
  stats: TypingStats;
  weakBigrams: WeakBigram[];
  hesitations: HesitationSpot[];
  classifiedErrors: ClassifiedError[];
  fingerErrors: Record<FingerName, number>;
  handBalance: {
    leftHandErrors: number;
    rightHandErrors: number;
    leftErrorPercentage: number;
    rightErrorPercentage: number;
  };
  errorTypeBreakdown: Record<ErrorType, number>;
}

export interface AIFeedback {
  headline: string;
  mechanicalDiagnosis: string;
  actionableTips: string[];
  targetedDrillWords: string[];
  targetedDrillSentences: string[];
  coachingSummary: string;
  trendObservation?: string;
  rawThinking?: string;
  modelUsed: string;
}

export type ModelProvider = 'ollama_gemma4_e2b' | 'ollama_gemma2_2b' | 'google_ai_studio';

export type TypingMode = 'words' | 'ai_paragraph';

export type AIThemeId =
  | 'coffee'
  | 'scifi'
  | 'cyberpunk'
  | 'tech'
  | 'philosophy'
  | 'literature'
  | 'adaptive'
  | 'custom';

export interface AITheme {
  id: AIThemeId;
  label: string;
  icon: string;
  description: string;
}

export interface GenerateTextRequest {
  theme?: AIThemeId;
  customPrompt?: string;
  continuationContext?: string;
  weakBigrams?: string[];
  weakKeys?: string[];
  provider?: ModelProvider;
  ollamaBaseUrl?: string;
  googleApiKey?: string;
  wordCount?: number;
}

export interface GenerateTextResponse {
  title: string;
  text: string;
  words: string[];
  theme: AIThemeId;
  modelUsed: string;
}

export interface AppSettings {
  modelProvider: ModelProvider;
  ollamaBaseUrl: string;
  googleApiKey?: string;
  testDuration: number;
  soundEnabled: boolean;
  showLiveWpm: boolean;
  smoothCaret: boolean;
  typingMode?: TypingMode;
  aiTheme?: AIThemeId;
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  mode: TypingMode;
  theme?: string;
  duration: number; // in seconds
  stats: TypingStats;
  diagnosticsSummary: {
    weakBigrams: WeakBigram[];
    hesitations: HesitationSpot[];
    fingerErrors: Record<FingerName, number>;
    keyErrors: Record<string, number>;
    errorTypeBreakdown: Record<ErrorType, number>;
    handBalance: {
      leftHandErrors: number;
      rightHandErrors: number;
      leftErrorPercentage: number;
      rightErrorPercentage: number;
    };
  };
  aiHeadline?: string;
  aiDiagnosis?: string;
}

export interface ChronicWeakBigram {
  bigram: string;
  errorCount: number;
  avgIkiMs: number;
  lastSeen: number;
  status: 'active' | 'graduated';
}

export interface AggregatedMasteryProfile {
  totalSessions: number;
  totalTimeSeconds: number;
  totalWordsTyped: number;
  personalBests: {
    bestWpm: number;
    bestRawWpm: number;
    bestAccuracy: number;
    longestCleanStreak: number;
  };
  rollingAverages: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
  };
  lifetimeFingerErrors: Record<FingerName, number>;
  lifetimeKeyErrors: Record<string, number>;
  chronicWeakBigrams: ChronicWeakBigram[];
  activityDates: Record<string, number>; // "YYYY-MM-DD" -> count
  streakDays: number;
  lastActiveDate?: string;
}

export interface ProfileHistoricalContext {
  totalSessions: number;
  rollingAvgWpm: number;
  rollingAvgAccuracy: number;
  wpmDelta: number; // current - rollingAvg
  accuracyDelta: number; // current - rollingAvg
  isPersonalBestWpm: boolean;
  chronicTroubleKeys: string[];
  improvedKeys: string[];
}
