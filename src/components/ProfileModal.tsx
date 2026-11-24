'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Flame,
  Trophy,
  TrendingUp,
  Clock,
  Activity,
  Layers,
  ArrowRight,
  Download,
  Trash2,
  Sparkles,
  Keyboard,
  Target,
  Zap,
  Check,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  SessionRecord,
  AggregatedMasteryProfile,
  ChronicWeakBigram,
  FingerName,
} from '@/types/typing';
import {
  getHistory,
  getMasteryProfile,
  clearAllHistory,
  exportHistoryJson,
} from '@/lib/storage';
import { COMMON_WORDS } from '@/lib/words';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDrill?: (words: string[]) => void;
}

// Physical QWERTY keyboard layout rows
const KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  ['space'],
];

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateWeaknessWords(chronicBigrams: ChronicWeakBigram[], count: number = 30): string[] {
  const bigramStrings = chronicBigrams.map((b) => b.bigram.toLowerCase());
  if (bigramStrings.length === 0) {
    return COMMON_WORDS.slice(0, count);
  }

  const matchingWords = COMMON_WORDS.filter((word) =>
    bigramStrings.some((bg) => word.toLowerCase().includes(bg))
  );

  if (matchingWords.length >= count) {
    return matchingWords.slice(0, count);
  }

  // If not enough unique words, combine matches and fill
  const pool = [...matchingWords];
  while (pool.length < count) {
    pool.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]);
  }
  return pool;
}

export function ProfileModal({ isOpen, onClose, onStartDrill }: ProfileModalProps) {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [profile, setProfile] = useState<AggregatedMasteryProfile | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<'lifetime' | 'recent'>('lifetime');
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    session: SessionRecord;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<{
    key: string;
    errors: number;
  } | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  // Load data on open / refresh
  const loadData = () => {
    try {
      const hist = getHistory();
      const prof = getMasteryProfile();
      setHistory(hist || []);
      setProfile(prof || null);
    } catch {
      setHistory([]);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setHoveredPoint(null);
      setHoveredKey(null);
    }
  }, [isOpen]);

  // ESC key listener & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Primary KPIs
  const bestWpm = profile?.personalBests?.bestWpm || 0;
  const bestAccuracy = profile?.personalBests?.bestAccuracy || 0;
  const rollingWpm = profile?.rollingAverages?.wpm || 0;
  const rollingAccuracy = profile?.rollingAverages?.accuracy || 0;
  const rollingConsistency = profile?.rollingAverages?.consistency || 0;
  const totalSeconds = profile?.totalTimeSeconds || 0;
  const totalWords = profile?.totalWordsTyped || 0;
  const totalSessions = profile?.totalSessions || history.length || 0;
  const streakDays = profile?.streakDays || 0;
  const activeDaysCount = Object.keys(profile?.activityDates || {}).filter(
    (d) => (profile?.activityDates?.[d] || 0) > 0
  ).length;

  // Progression Chart sessions (chronological order: oldest to newest, up to 25 sessions)
  const chartSessions = useMemo(() => {
    return [...history].reverse().slice(-25);
  }, [history]);

  // Active chronic weak bigrams
  const activeChronicBigrams = useMemo(() => {
    if (!profile?.chronicWeakBigrams) return [];
    return profile.chronicWeakBigrams
      .filter((b) => b.status === 'active')
      .sort((a, b) => b.errorCount - a.errorCount);
  }, [profile]);

  // Keyboard heatmap error calculation
  const heatmapKeyErrors = useMemo(() => {
    if (heatmapMode === 'lifetime') {
      return profile?.lifetimeKeyErrors || {};
    }

    // Recent mode: errors from the past 5 sessions
    const recent5 = history.slice(0, 5);
    const errors: Record<string, number> = {};
    for (const session of recent5) {
      const summaryErrors = session.diagnosticsSummary?.keyErrors || {};
      for (const [key, count] of Object.entries(summaryErrors)) {
        const norm = key.toLowerCase();
        errors[norm] = (errors[norm] || 0) + count;
      }
    }
    return errors;
  }, [heatmapMode, profile, history]);

  // Max errors for color scaling
  const maxKeyErrors = useMemo(() => {
    const values = Object.values(heatmapKeyErrors);
    return values.length > 0 ? Math.max(1, ...values) : 1;
  }, [heatmapKeyErrors]);

  // Start weakness drill action
  const handleStartWeaknessDrill = () => {
    if (activeChronicBigrams.length === 0) return;
    const drillWords = generateWeaknessWords(activeChronicBigrams, 30);
    onClose();
    if (onStartDrill) {
      onStartDrill(drillWords);
    }
  };

  // Export JSON handler
  const handleExportJson = () => {
    try {
      const jsonStr = exportHistoryJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'typoloop-data-backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2500);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  // Clear data handler
  const handleClearHistory = () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently clear all typing sessions and mastery profiles? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      clearAllHistory();
      setHistory([]);
      setProfile(null);
    } catch (err) {
      console.error('Failed to clear data:', err);
    }
  };

  if (!isOpen) return null;

  // Chart coordinate calculations
  const svgWidth = 640;
  const svgHeight = 160;
  const padding = { top: 20, right: 30, bottom: 28, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const wpmValues = chartSessions.map((s) => s.stats.wpm);
  const chartAvg = rollingWpm || (wpmValues.length > 0
    ? Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length)
    : 0);

  const minWpm = Math.max(0, (wpmValues.length > 0 ? Math.min(...wpmValues, chartAvg) : 0) - 10);
  const maxWpm = Math.max(
    (wpmValues.length > 0 ? Math.max(...wpmValues, chartAvg) : 80) + 10,
    minWpm + 20
  );

  const getX = (idx: number) => {
    if (chartSessions.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (idx / (chartSessions.length - 1)) * plotWidth;
  };

  const getY = (wpm: number) => {
    const ratio = (wpm - minWpm) / (maxWpm - minWpm);
    return padding.top + plotHeight - ratio * plotHeight;
  };

  // Build SVG path
  const points = chartSessions.map((s, idx) => ({
    x: getX(idx),
    y: getY(s.stats.wpm),
    session: s,
    index: idx,
  }));

  const linePath = points.length > 0
    ? points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')
    : '';

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
    : '';

  const avgBaselineY = getY(chartAvg);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            1. HEADER
           ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner shadow-amber-500/10">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-zinc-100 tracking-tight">
                Biomechanical Profile & Long-Term Analytics
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Compounding muscle-memory telemetry across all typing sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            SCROLLABLE CONTENT BODY
           ========================================================================= */}
        <div className="overflow-y-auto px-5 sm:px-7 py-6 space-y-6 flex-1 text-sm text-zinc-300">
          {/* =======================================================================
              2. TOP PRIMARY KPI CARDS (GRID OF 4)
             ======================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: All-Time Peak Speed */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Peak Speed</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">
                  {bestWpm} <span className="text-xs text-zinc-500 font-normal">WPM</span>
                </div>
                <div className="mt-1 flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {bestAccuracy}% Acc
                  </span>
                  <span>Personal Best</span>
                </div>
              </div>
            </div>

            {/* Card 2: Rolling 10-Session Average */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Rolling 10-Avg</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-100">
                  {rollingWpm} <span className="text-xs text-zinc-500 font-normal">WPM</span>
                </div>
                <div className="mt-1 flex items-center space-x-1.5 text-[11px] font-mono text-zinc-400">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {rollingAccuracy}% Acc
                  </span>
                  <span>{rollingConsistency}% Cons</span>
                </div>
              </div>
            </div>

            {/* Card 3: Total Practice */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Total Practice</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-100">
                  {formatTime(totalSeconds)}
                </div>
                <div className="mt-1 text-[11px] font-mono text-zinc-400 truncate">
                  {totalWords.toLocaleString()} words • {totalSessions} tests
                </div>
              </div>
            </div>

            {/* Card 4: Daily Streak */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">Daily Streak</span>
                <Flame className={`w-4 h-4 ${streakDays > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-600'}`} />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-amber-500">
                  {streakDays} <span className="text-xs text-zinc-500 font-normal">{streakDays === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-zinc-400">
                  {activeDaysCount} active practice {activeDaysCount === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>
          </div>

          {/* =======================================================================
              3. PROGRESSION CHART (WPM LINE CHART)
             ======================================================================= */}
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-bold text-sm text-zinc-200">
                  Velocity & Precision Progression
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  ({chartSessions.length} recorded session{chartSessions.length === 1 ? '' : 's'})
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono text-zinc-400">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Session WPM</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 border-b-2 border-dashed border-zinc-500" />
                  <span>Avg Baseline ({chartAvg} WPM)</span>
                </div>
              </div>
            </div>

            {chartSessions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <Zap className="w-8 h-8 text-zinc-600" />
                <p className="font-mono text-xs text-zinc-400">
                  No historical telemetry recorded yet.
                </p>
                <p className="text-[11px] text-zinc-500 max-w-sm">
                  Complete your first 15s, 30s, or 60s test in the arena to generate velocity progression curves.
                </p>
              </div>
            ) : (
              <div className="relative pt-2">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-40 sm:h-44 overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="profileWpmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Grid lines */}
                  {[0, 0.5, 1].map((ratio) => {
                    const y = padding.top + plotHeight * ratio;
                    const val = Math.round(maxWpm - ratio * (maxWpm - minWpm));
                    return (
                      <g key={ratio}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={padding.left + plotWidth}
                          y2={y}
                          stroke="#27272a"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="9"
                          fill="#71717a"
                          fontFamily="monospace"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Dashed Average Baseline */}
                  {chartAvg > 0 && (
                    <g>
                      <line
                        x1={padding.left}
                        y1={avgBaselineY}
                        x2={padding.left + plotWidth}
                        y2={avgBaselineY}
                        stroke="#71717a"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                      />
                      <text
                        x={padding.left + plotWidth - 4}
                        y={avgBaselineY - 5}
                        textAnchor="end"
                        fontSize="9"
                        fill="#a1a1aa"
                        fontFamily="monospace"
                      >
                        Baseline {chartAvg} WPM
                      </text>
                    </g>
                  )}

                  {/* Shaded Area */}
                  {areaPath && (
                    <path d={areaPath} fill="url(#profileWpmGradient)" />
                  )}

                  {/* Velocity Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {points.map((pt) => {
                    const isHovered = hoveredPoint?.index === pt.index;
                    return (
                      <g key={pt.index}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 3.5}
                          fill={isHovered ? '#fbbf24' : '#18181b'}
                          stroke="#f59e0b"
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredPoint(pt)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl text-xs font-mono space-y-1"
                    style={{
                      left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                      top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                    }}
                  >
                    <div className="text-[10px] text-zinc-400 border-b border-zinc-800 pb-1">
                      {formatDate(hoveredPoint.session.timestamp)} • {hoveredPoint.session.mode || 'session'}
                    </div>
                    <div className="flex items-center space-x-3 text-zinc-100">
                      <div>
                        Speed:{' '}
                        <span className="font-bold text-amber-400">
                          {hoveredPoint.session.stats.wpm} WPM
                        </span>{' '}
                        <span className="text-[10px] text-zinc-500">
                          (raw {hoveredPoint.session.stats.rawWpm})
                        </span>
                      </div>
                      <div>
                        Acc:{' '}
                        <span className="font-bold text-emerald-400">
                          {hoveredPoint.session.stats.accuracy}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =======================================================================
              4. KEYBOARD MASTERY HEATMAP
             ======================================================================= */}
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
              <div>
                <div className="flex items-center space-x-2">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <h3 className="font-serif font-bold text-sm text-zinc-200">
                    Keyboard Mastery Heatmap
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Physical error hotspot distribution across all keystroke telemetry
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setHeatmapMode('lifetime')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    heatmapMode === 'lifetime'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Lifetime Mastery (All-Time)
                </button>
                <button
                  onClick={() => setHeatmapMode('recent')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    heatmapMode === 'recent'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Recent Sessions (Last 5)
                </button>
              </div>
            </div>

            {/* Virtual QWERTY Keyboard */}
            <div className="py-2 flex flex-col items-center space-y-1.5 select-none overflow-x-auto">
              {KEYBOARD_ROWS.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  className="flex items-center space-x-1 sm:space-x-1.5"
                  style={{
                    paddingLeft:
                      rowIdx === 1 ? '0.75rem' : rowIdx === 2 ? '1.5rem' : rowIdx === 3 ? '2.25rem' : '0rem',
                  }}
                >
                  {row.map((keyChar) => {
                    const isSpace = keyChar === 'space';
                    const displayKey = isSpace ? 'SPACE' : keyChar.toUpperCase();
                    const errors = heatmapKeyErrors[keyChar.toLowerCase()] || 0;

                    // Heatmap shading
                    let keyColor = 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800';
                    if (errors > 0) {
                      const ratio = errors / maxKeyErrors;
                      if (ratio > 0.6 || errors >= 5) {
                        // Heavy mistake hotspot (Rose/Red)
                        keyColor =
                          'bg-rose-950/70 border-rose-600 text-rose-200 shadow-sm shadow-rose-950 hover:bg-rose-900/80';
                      } else if (ratio > 0.25 || errors >= 2) {
                        // Minor to moderate mistakes (Amber)
                        keyColor =
                          'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-xs shadow-amber-950 hover:bg-amber-900/70';
                      } else {
                        // Very few mistakes (Zinc/Warm border)
                        keyColor =
                          'bg-amber-950/30 border-amber-700/50 text-amber-300/90 hover:bg-amber-950/50';
                      }
                    }

                    return (
                      <div
                        key={keyChar}
                        className={`relative rounded-lg border font-mono text-center transition-all cursor-pointer flex flex-col items-center justify-center ${keyColor} ${
                          isSpace
                            ? 'w-48 sm:w-64 h-8 sm:h-9 text-[10px] tracking-widest'
                            : 'w-7 h-8 sm:w-9 sm:h-10 text-xs sm:text-sm font-semibold'
                        }`}
                        onMouseEnter={() => setHoveredKey({ key: keyChar, errors })}
                        onMouseLeave={() => setHoveredKey(null)}
                      >
                        <span>{displayKey}</span>
                        {errors > 0 && !isSpace && (
                          <span className="text-[9px] text-rose-300 font-mono -mt-1 leading-none font-normal">
                            {errors}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Keyboard Legend & Hover Inspector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs font-mono">
              <div className="flex items-center space-x-3 text-zinc-400">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Legend:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800" />
                  <span>Clean (0)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-amber-950/70 border border-amber-500 text-amber-200" />
                  <span>Minor (1-2)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded bg-rose-950/80 border border-rose-500 text-rose-200" />
                  <span>Hotspot (3+)</span>
                </div>
              </div>

              {/* Hover Status */}
              <div className="text-zinc-300 text-right">
                {hoveredKey ? (
                  <span>
                    Key <strong className="text-amber-400">&ldquo;{hoveredKey.key.toUpperCase()}&rdquo;</strong>:{' '}
                    <span className={hoveredKey.errors > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                      {hoveredKey.errors} mistake{hoveredKey.errors === 1 ? '' : 's'} logged
                    </span>
                  </span>
                ) : (
                  <span className="text-zinc-500 text-[11px]">Hover over any key to inspect typo counts</span>
                )}
              </div>
            </div>
          </div>

          {/* =======================================================================
              5. PERSISTENT TROUBLEMAKER BIGRAMS / WEAKNESS QUEUE
             ======================================================================= */}
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2.5">
                <Target className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-serif font-bold text-sm text-zinc-200">
                      Persistent Troublemaker Bigrams
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {activeChronicBigrams.length} active
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Transitions with repeated latencies or high fat-finger transposition rates
                  </p>
                </div>
              </div>

              {activeChronicBigrams.length > 0 && (
                <button
                  onClick={handleStartWeaknessDrill}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Practice Weaknesses</span>
                </button>
              )}
            </div>

            {activeChronicBigrams.length === 0 ? (
              <div className="py-6 flex items-center justify-center space-x-2 text-zinc-400 font-mono text-xs">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>No active chronic troublemaker bigrams detected. Your key transitions are steady!</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                {activeChronicBigrams.slice(0, 8).map((bg) => (
                  <div
                    key={bg.bigram}
                    className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 hover:border-rose-500/50 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-mono font-bold text-amber-400 tracking-wider">
                        &ldquo;{bg.bigram}&rdquo;
                      </span>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div className="text-rose-400 font-semibold">{bg.errorCount} typos</div>
                      <div className="text-zinc-500">{bg.avgIkiMs}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =======================================================================
              6. SESSION HISTORY LOG TABLE
             ======================================================================= */}
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <h3 className="font-serif font-bold text-sm text-zinc-200">
                  Recent Session Log
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">
                  (Showing last {Math.min(history.length, 15)} sessions)
                </span>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-zinc-500">
                No session log available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Duration</th>
                      <th className="py-2.5 px-3">Net WPM</th>
                      <th className="py-2.5 px-3">Raw WPM</th>
                      <th className="py-2.5 px-3">Accuracy</th>
                      <th className="py-2.5 px-3">Consistency</th>
                      <th className="py-2.5 px-3">Key Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                    {history.slice(0, 15).map((session, idx) => {
                      const topKeyErrors = Object.entries(
                        session.diagnosticsSummary?.keyErrors || {}
                      )
                        .filter(([_, count]) => count > 0)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([k, c]) => `${k.toUpperCase()} (${c})`)
                        .join(', ');

                      return (
                        <tr
                          key={session.id || idx}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-zinc-400">
                            {formatDate(session.timestamp)}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            <span className="capitalize">{session.mode || 'standard'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {session.duration ? `${session.duration}s` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-amber-400">
                            {session.stats?.wpm || 0}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {session.stats?.rawWpm || 0}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                (session.stats?.accuracy || 0) >= 96
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : (session.stats?.accuracy || 0) >= 90
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {session.stats?.accuracy || 0}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {session.stats?.consistency || 0}%
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs">
                            {topKeyErrors ? (
                              <span className="text-rose-400/90">{topKeyErrors}</span>
                            ) : (
                              <span className="text-emerald-400/70">Clean</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            7. DATA MANAGEMENT FOOTER
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            {/* Export Data */}
            <button
              onClick={handleExportJson}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs font-mono transition-all flex items-center space-x-2 cursor-pointer"
            >
              {exportCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Exported Backup!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export Data (JSON)</span>
                </>
              )}
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 hover:border-rose-600 text-rose-300 text-xs font-mono transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear History</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
