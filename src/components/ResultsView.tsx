'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { TypingDiagnostics, AIFeedback, ProfileHistoricalContext } from '@/types/typing';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertCircle,
  Brain,
  Zap,
  ArrowRight,
  Coffee,
  Trophy,
  TrendingUp,
  Target,
} from 'lucide-react';

interface ResultsViewProps {
  diagnostics: TypingDiagnostics;
  aiFeedback: AIFeedback | null;
  isLoadingAi: boolean;
  historicalContext?: ProfileHistoricalContext | null;
  onRestart: () => void;
  onStartDrill: (words: string[]) => void;
  onStartAdaptiveStory?: () => void;
  onStartWeaknessWorkout?: () => void;
}

export function ResultsView({
  diagnostics,
  aiFeedback,
  isLoadingAi,
  historicalContext,
  onRestart,
  onStartDrill,
  onStartAdaptiveStory,
  onStartWeaknessWorkout,
}: ResultsViewProps) {
  const { stats, weakBigrams, hesitations, handBalance, fingerErrors, errorTypeBreakdown } =
    diagnostics;

  // Trigger celebratory confetti on high accuracy
  useEffect(() => {
    if (stats.accuracy >= 95 && stats.wpm >= 40) {
      try {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.6 },
          colors: ['#c87d32', '#4a7c59', '#e09f3e'],
        });
      } catch {
        // silent
      }
    }
  }, [stats.accuracy, stats.wpm]);

  // Keyboard heatmap keys
  const keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  const keyErrorCounts = diagnostics.classifiedErrors.reduce<Record<string, number>>(
    (acc, err) => {
      const k = err.expected.toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    {}
  );

  const maxKeyErrors = Math.max(1, ...Object.values(keyErrorCounts));

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* 1. Top Primary Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm">
        {/* Net WPM */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-[#786558]">Net Speed</span>
            {historicalContext?.isPersonalBestWpm ? (
              <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-xs animate-bounce">
                🏆 New Personal Best!
              </span>
            ) : historicalContext?.wpmDelta !== undefined ? (
              <span
                className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  historicalContext.wpmDelta >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {historicalContext.wpmDelta >= 0 ? '+' : ''}
                {historicalContext.wpmDelta} vs avg
              </span>
            ) : null}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-5xl font-mono font-bold text-[#c87d32] tracking-tight">
              {stats.wpm}
            </span>
            <span className="text-xs text-[#786558] font-mono">wpm</span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono">Raw: {stats.rawWpm} wpm</span>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-[#786558]">Accuracy</span>
            {historicalContext?.accuracyDelta !== undefined && (
              <span
                className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  historicalContext.accuracyDelta >= 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {historicalContext.accuracyDelta >= 0 ? '+' : ''}
                {historicalContext.accuracyDelta}% vs avg
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span
              className={`text-5xl font-mono font-bold tracking-tight ${
                stats.accuracy >= 95
                  ? 'text-[#4a7c59]'
                  : stats.accuracy >= 85
                  ? 'text-[#c87d32]'
                  : 'text-[#a34338]'
              }`}
            >
              {stats.accuracy}%
            </span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono">
            {stats.correctChars} / {stats.totalKeystrokes} chars
          </span>
        </div>

        {/* Consistency */}
        <div className="flex flex-col">
          <span className="text-xs font-mono uppercase tracking-wider text-[#786558]">Rhythm Flow</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-5xl font-mono font-bold text-[#3d2b21] tracking-tight">
              {stats.consistency}%
            </span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono">Cadence stability</span>
        </div>

        {/* Test Duration */}
        <div className="flex flex-col">
          <span className="text-xs font-mono uppercase tracking-wider text-[#786558]">Duration</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-5xl font-mono font-bold text-[#2a1e17] tracking-tight">
              {stats.elapsedTime}s
            </span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono">
            {stats.incorrectChars} typos logged
          </span>
        </div>
      </div>

      {/* 2. Google Gemma AI Coach Card */}
      <div className="relative overflow-hidden p-6 md:p-8 bg-white border border-[#c87d32]/40 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#ddd0c2]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#faede0] text-[#c87d32] rounded-xl shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#2a1e17] flex items-center space-x-2">
                <span>Google Gemma 4 AI Coach</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#faede0] text-[#c87d32] border border-[#ddd0c2] rounded-full">
                  Thinking Mode
                </span>
              </h2>
              <p className="text-xs text-[#786558]">
                Biomechanical error diagnosis & adaptive drill synthesizer
              </p>
            </div>
          </div>

          {aiFeedback?.modelUsed && (
            <span className="text-[11px] font-mono text-[#786558] bg-[#efe6dd] px-2.5 py-1 rounded-lg">
              {aiFeedback.modelUsed}
            </span>
          )}
        </div>

        {/* AI Content */}
        {isLoadingAi ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-2 border-[#c87d32]/30 border-t-[#c87d32] rounded-full animate-spin" />
              <Coffee className="absolute inset-0 m-auto w-4 h-4 text-[#c87d32] animate-pulse" />
            </div>
            <p className="text-xs font-mono text-[#786558] animate-pulse">
              Gemma 4 is extracting keystroke latency, bigram fatigue & hand symmetry...
            </p>
          </div>
        ) : aiFeedback ? (
          <div className="mt-6 space-y-6">
            {/* Longitudinal Trend Callout Banner */}
            {aiFeedback.trendObservation && (
              <div className="p-4 bg-gradient-to-r from-emerald-50/90 via-amber-50/70 to-emerald-50/90 border border-emerald-300/80 rounded-xl shadow-xs space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-emerald-950">
                    Longitudinal Trend & Trajectory
                  </h4>
                </div>
                <p className="text-xs md:text-sm text-[#2a1e17] leading-relaxed pl-6 font-medium">
                  {aiFeedback.trendObservation}
                </p>
              </div>
            )}

            {/* Headline & Diagnosis */}
            <div className="space-y-2 p-4 bg-[#fbf8f3] border border-[#ddd0c2] rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 bg-[#faede0] text-[#c87d32] rounded">
                  Diagnosis
                </span>
                <h3 className="text-sm md:text-base font-serif font-bold text-[#2a1e17] tracking-tight">
                  {aiFeedback.headline}
                </h3>
              </div>
              <p className="text-xs md:text-sm text-[#3d2b21] leading-relaxed pt-1">
                {aiFeedback.mechanicalDiagnosis}
              </p>
            </div>

            {/* Actionable Tips */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#786558] flex items-center space-x-1.5 font-semibold">
                <Zap className="w-3.5 h-3.5 text-[#c87d32]" />
                <span>Targeted Biomechanical Tips</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {(aiFeedback.actionableTips || []).map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#fbf8f3] border border-[#ddd0c2] rounded-xl text-xs text-[#3d2b21] leading-relaxed shadow-xs"
                  >
                    <span className="text-[#c87d32] font-mono font-bold mr-1.5">0{idx + 1}.</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#ddd0c2] gap-3">
              <div className="text-xs text-[#786558] font-mono">
                {aiFeedback.targetedDrillWords?.length || 0} custom drill words synthesized for your weak transitions
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={onRestart}
                  className="keycap-button flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#c87d32]" />
                  <span>Restart Test</span>
                </button>

                {/* Weakness Workout Button if chronic trouble keys exist */}
                {historicalContext?.chronicTroubleKeys && historicalContext.chronicTroubleKeys.length > 0 && (
                  <button
                    onClick={() => {
                      if (onStartWeaknessWorkout) {
                        onStartWeaknessWorkout();
                      } else {
                        onStartDrill(aiFeedback.targetedDrillWords);
                      }
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#4a7c59] hover:bg-[#3d664a] text-white text-xs font-mono font-bold rounded-xl shadow-md shadow-[#4a7c59]/25 transition-all"
                    title={`Focus workout on chronic trouble keys: ${historicalContext.chronicTroubleKeys.join(', ')}`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Weakness Workout</span>
                  </button>
                )}

                <button
                  onClick={() => onStartDrill(aiFeedback.targetedDrillWords)}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#c87d32] hover:bg-[#b46b25] text-white text-xs font-mono font-bold rounded-xl shadow-md shadow-[#c87d32]/25 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start AI Drill</span>
                </button>

                <Link
                  href="/coach"
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-[#efe6dd] hover:bg-[#e6dacb] text-[#2a1e17] border border-[#ddd0c2] text-xs font-mono font-semibold rounded-xl transition-all"
                >
                  <span>Open Coach Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 4. Biomechanical Breakdown Details: Heatmap & Hand Symmetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical Keyboard Heatmap */}
        <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#786558] font-semibold">
              Keyboard Error Heatmap
            </h4>
            <span className="text-[11px] text-[#786558] font-mono">Terracotta = Typos</span>
          </div>

          <div className="flex flex-col items-center space-y-1.5 py-2">
            {keyboardRows.map((row, rIdx) => (
              <div key={rIdx} className="flex space-x-1.5">
                {row.map((k) => {
                  const errs = keyErrorCounts[k] || 0;
                  const intensity = errs > 0 ? Math.min(1, errs / maxKeyErrors) : 0;
                  let bg = 'bg-[#efe6dd] text-[#786558] border border-[#ddd0c2]';
                  if (intensity > 0.6) bg = 'bg-[#a34338] text-white font-bold shadow-xs';
                  else if (intensity > 0.2) bg = 'bg-[#fdf0ee] text-[#a34338] border border-[#a34338]/40';
                  else if (intensity > 0) bg = 'bg-[#faede0] text-[#c87d32] border border-[#c87d32]/40';

                  return (
                    <span
                      key={k}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono transition-all ${bg}`}
                      title={`${k.toUpperCase()}: ${errs} mistakes`}
                    >
                      {k}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Hand Balance & Weak Bigrams */}
        <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-5">
          {/* Hand Balance Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-[#786558] mb-2 font-semibold">
              <span>Left Hand ({handBalance.leftErrorPercentage}%)</span>
              <span>Right Hand ({handBalance.rightErrorPercentage}%)</span>
            </div>
            <div className="w-full h-2.5 bg-[#efe6dd] rounded-full overflow-hidden flex border border-[#ddd0c2]">
              <div
                className="h-full bg-[#c87d32] transition-all duration-500"
                style={{ width: `${handBalance.leftErrorPercentage}%` }}
              />
              <div
                className="h-full bg-[#786558] transition-all duration-500"
                style={{ width: `${handBalance.rightErrorPercentage}%` }}
              />
            </div>
          </div>

          {/* Weakest Transitions */}
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#786558] block mb-2 font-semibold">
              Weakest Bigram Transitions
            </span>
            <div className="flex flex-wrap gap-2">
              {weakBigrams.length > 0 ? (
                weakBigrams.slice(0, 5).map((b, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#fbf8f3] border border-[#ddd0c2] rounded-lg text-xs font-mono text-[#2a1e17] flex items-center space-x-1"
                  >
                    <strong className="text-[#c87d32] font-bold">&quot;{b.bigram}&quot;</strong>
                    <span className="text-[#786558] text-[10px]">({b.avgIkiMs}ms)</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#4a7c59] font-mono">Rhythmic & balanced transitions!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
