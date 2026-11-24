'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLatestDiagnostics } from '@/lib/history';
import { useSettings } from '@/context/SettingsContext';
import { TypingDiagnostics, AIFeedback } from '@/types/typing';
import {
  Brain,
  Sparkles,
  Zap,
  Activity,
  Play,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Coffee,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function CoachPage() {
  const { settings } = useSettings();
  const [diagnostics, setDiagnostics] = useState<TypingDiagnostics | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [customDrillTopic, setCustomDrillTopic] = useState('');

  // Load latest diagnostics from localStorage or default baseline
  useEffect(() => {
    const latest = getLatestDiagnostics();
    if (latest && latest.stats) {
      setDiagnostics(latest);
    } else {
      // Default sample diagnostics for new visitors
      setDiagnostics({
        stats: {
          wpm: 74,
          rawWpm: 78,
          accuracy: 96,
          correctChars: 245,
          incorrectChars: 9,
          extraChars: 0,
          missedChars: 0,
          totalKeystrokes: 254,
          elapsedTime: 30,
          consistency: 91,
          wpmTimeline: [
            { time: 5, wpm: 68, rawWpm: 72, errors: 0 },
            { time: 10, wpm: 75, rawWpm: 79, errors: 1 },
            { time: 15, wpm: 72, rawWpm: 75, errors: 0 },
            { time: 20, wpm: 78, rawWpm: 81, errors: 1 },
            { time: 25, wpm: 76, rawWpm: 79, errors: 0 },
            { time: 30, wpm: 74, rawWpm: 78, errors: 0 },
          ],
        },
        weakBigrams: [
          { bigram: 'ph', errorCount: 2, avgIkiMs: 182 },
          { bigram: 'gr', errorCount: 2, avgIkiMs: 165 },
          { bigram: 'qu', errorCount: 1, avgIkiMs: 148 },
          { bigram: 'tr', errorCount: 1, avgIkiMs: 132 },
        ],
        hesitations: [
          { character: 'p', avgLatencyMs: 195, count: 4 },
          { character: 'g', avgLatencyMs: 172, count: 5 },
          { character: 'b', avgLatencyMs: 154, count: 3 },
        ],
        classifiedErrors: [
          {
            expected: 'p',
            actual: 'o',
            type: 'ADJACENT_FAT_FINGER',
            finger: 'right_pinky',
            timestamp: Date.now() - 15000,
          },
          {
            expected: 'r',
            actual: 'e',
            type: 'ADJACENT_FAT_FINGER',
            finger: 'left_index',
            timestamp: Date.now() - 10000,
          },
        ],
        fingerErrors: {
          left_pinky: 1,
          left_ring: 1,
          left_middle: 0,
          left_index: 2,
          left_thumb: 0,
          right_thumb: 0,
          right_index: 1,
          right_middle: 1,
          right_ring: 1,
          right_pinky: 2,
        },
        handBalance: {
          leftHandErrors: 4,
          rightHandErrors: 5,
          leftErrorPercentage: 44,
          rightErrorPercentage: 56,
        },
        errorTypeBreakdown: {
          ADJACENT_FAT_FINGER: 5,
          TRANSPOSITION: 2,
          OMISSION: 1,
          INSERTION: 1,
          CASE_MISMATCH: 0,
          OTHER: 0,
        },
      });
    }
  }, []);

  // Request fresh AI coaching feedback
  const handleAnalyzeWithGemma = async () => {
    if (!diagnostics) return;
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostics,
          provider: settings.modelProvider,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          googleApiKey: settings.googleApiKey,
        }),
      });

      if (res.ok) {
        const feedback: AIFeedback = await res.json();
        setAiFeedback(feedback);
      }
    } catch (err) {
      console.error('Error invoking Gemma coach:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const weakFingerList = diagnostics
    ? Object.entries(diagnostics.fingerErrors)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ddd0c2]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#c87d32] uppercase tracking-wider font-semibold">
            <Brain className="w-4 h-4" />
            <span>Neuromuscular Intelligence</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2a1e17] mt-1">
            Google Gemma 4 AI Coach Lab
          </h1>
          <p className="text-xs text-[#786558] mt-1 max-w-xl">
            Touch typing is neuromuscular coordination. Gemma 4 analyzes physical inter-keystroke intervals (IKI),
            finger fatigue asymmetry, and physical key collisions to prescribe targeted micro-drills.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAnalyzeWithGemma}
            disabled={isLoadingAi}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#c87d32] hover:bg-[#b46b25] text-white text-xs font-mono font-bold rounded-xl shadow-md shadow-[#c87d32]/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
            <span>{isLoadingAi ? 'Gemma Thinking...' : 'Run Gemma Biomechanical Audit'}</span>
          </button>
        </div>
      </div>

      {/* 2. Biomechanical Telemetry Overview Grid */}
      {diagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Hand Balance & Symmetry */}
          <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#786558] font-semibold">
                Hand Load Symmetry
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#faede0] text-[#c87d32] font-semibold">
                Biomechanics
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#2a1e17] font-semibold">
                  Left Hand: {diagnostics.handBalance.leftErrorPercentage}%
                </span>
                <span className="text-[#786558] font-semibold">
                  Right Hand: {diagnostics.handBalance.rightErrorPercentage}%
                </span>
              </div>
              <div className="w-full h-3 bg-[#efe6dd] rounded-full overflow-hidden flex border border-[#ddd0c2]">
                <div
                  className="h-full bg-[#c87d32] transition-all duration-500"
                  style={{ width: `${diagnostics.handBalance.leftErrorPercentage}%` }}
                />
                <div
                  className="h-full bg-[#786558] transition-all duration-500"
                  style={{ width: `${diagnostics.handBalance.rightErrorPercentage}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-[#786558] leading-relaxed">
              {Math.abs(diagnostics.handBalance.leftErrorPercentage - diagnostics.handBalance.rightErrorPercentage) <= 15
                ? 'Your bilateral finger activation is well-balanced. Both hemispheres share mechanical reach evenly.'
                : 'Asymmetrical fatigue detected. One hand is carrying compensatory strain during high-speed bursts.'}
            </p>
          </div>

          {/* Card 2: Fat-Finger Adjacency Index */}
          <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#786558] font-semibold">
                Key Adjacency Collisions
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#efe6dd] text-[#786558]">
                Mechanical
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-mono font-bold text-[#2a1e17]">
                {diagnostics.errorTypeBreakdown.ADJACENT_FAT_FINGER}
              </span>
              <span className="text-xs text-[#786558] font-mono">lateral strike slips</span>
            </div>

            <p className="text-xs text-[#786558] leading-relaxed">
              Lateral clipping occurs when fingers strike adjacent physical keycaps (such as O/P or C/V) due to flat hand angles.
            </p>
          </div>

          {/* Card 3: Weak Bigram Latencies */}
          <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#786558] font-semibold">
                Weak Transition Latency
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#efe6dd] text-[#786558]">
                IKI Latency
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {diagnostics.weakBigrams.map((b, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 bg-[#fbf8f3] border border-[#ddd0c2] rounded-lg text-xs font-mono flex items-center space-x-1.5"
                >
                  <span className="font-bold text-[#c87d32]">&quot;{b.bigram}&quot;</span>
                  <span className="text-[10px] text-[#786558]">{b.avgIkiMs}ms</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#786558] leading-relaxed">
              Average latency exceeds normal 80ms rhythm threshold on these letter transitions.
            </p>
          </div>
        </div>
      )}

      {/* 3. Detailed Finger Breakdown & Physical Analysis */}
      {diagnostics && (
        <div className="p-6 md:p-8 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#ddd0c2]">
            <div>
              <h2 className="font-serif text-xl font-bold text-[#2a1e17]">
                Individual Finger Load & Error Distribution
              </h2>
              <p className="text-xs text-[#786558]">
                Physical mapping of error frequency per digit across home, top, and bottom rows.
              </p>
            </div>
            <span className="text-xs font-mono text-[#786558]">
              {diagnostics.stats.totalKeystrokes} Total Keystrokes Logged
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'left_pinky', name: 'Left Pinky', hand: 'Left' },
              { id: 'left_ring', name: 'Left Ring', hand: 'Left' },
              { id: 'left_middle', name: 'Left Middle', hand: 'Left' },
              { id: 'left_index', name: 'Left Index', hand: 'Left' },
              { id: 'left_thumb', name: 'Left Thumb', hand: 'Left' },
              { id: 'right_thumb', name: 'Right Thumb', hand: 'Right' },
              { id: 'right_index', name: 'Right Index', hand: 'Right' },
              { id: 'right_middle', name: 'Right Middle', hand: 'Right' },
              { id: 'right_ring', name: 'Right Ring', hand: 'Right' },
              { id: 'right_pinky', name: 'Right Pinky', hand: 'Right' },
            ].map((f) => {
              const count = diagnostics.fingerErrors[f.id as keyof typeof diagnostics.fingerErrors] || 0;
              const hasErrors = count > 0;
              return (
                <div
                  key={f.id}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    hasErrors
                      ? 'bg-[#faede0]/60 border-[#c87d32]/40 text-[#2a1e17]'
                      : 'bg-[#fbf8f3] border-[#ddd0c2] text-[#786558]'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider block text-[#786558]">
                    {f.hand}
                  </span>
                  <span className="text-xs font-serif font-bold text-[#2a1e17] block mt-0.5">
                    {f.name.replace(/^(Left|Right)\s/, '')}
                  </span>
                  <div className="mt-2">
                    <span
                      className={`text-lg font-mono font-bold ${
                        hasErrors ? 'text-[#c87d32]' : 'text-[#4a7c59]'
                      }`}
                    >
                      {count}
                    </span>
                    <span className="text-[10px] text-[#786558] block font-mono">
                      {count === 1 ? 'error' : 'errors'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Gemma 4 AI Coaching Feedback Banner */}
      {aiFeedback ? (
        <div className="p-6 md:p-8 bg-[#fbf8f3] border border-[#c87d32]/50 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#ddd0c2]">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#c87d32] text-white rounded-xl">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#2a1e17]">
                  {aiFeedback.headline}
                </h3>
                <p className="text-xs text-[#786558] font-mono">
                  Engine: {aiFeedback.modelUsed}
                </p>
              </div>
            </div>

            <Link
              href={`/?drill=${encodeURIComponent(aiFeedback.targetedDrillWords.join(','))}`}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#c87d32] hover:bg-[#b46b25] text-white text-xs font-mono font-bold rounded-xl shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load Prescribed Drill</span>
            </Link>
          </div>

          <div className="p-4 bg-white border border-[#ddd0c2] rounded-xl text-xs md:text-sm text-[#2a1e17] leading-relaxed">
            {aiFeedback.mechanicalDiagnosis}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#786558] font-semibold">
              Actionable Biomechanical Corrections
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiFeedback.actionableTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-[#ddd0c2] rounded-xl text-xs text-[#2a1e17] leading-relaxed"
                >
                  <span className="text-[#c87d32] font-mono font-bold mr-1.5">0{idx + 1}.</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>

          {/* Drill Words Pills */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#786558] font-semibold">
              Synthesized Practice Vocabulary
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiFeedback.targetedDrillWords.map((w, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white border border-[#ddd0c2] rounded-lg text-xs font-mono text-[#2a1e17]"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white border border-[#ddd0c2] rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#faede0] text-[#c87d32] flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2a1e17]">
              Ready for Gemma 4 Biomechanical Synthesis
            </h3>
            <p className="text-xs text-[#786558] max-w-md mx-auto mt-1">
              Click &quot;Run Gemma Biomechanical Audit&quot; above to have Google Gemma 4 generate real-time ergonomic diagnoses and targeted drill regimens.
            </p>
          </div>
          <button
            onClick={handleAnalyzeWithGemma}
            disabled={isLoadingAi}
            className="px-6 py-2.5 bg-[#c87d32] hover:bg-[#b46b25] text-white text-xs font-mono font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Run Audit Now
          </button>
        </div>
      )}
    </div>
  );
}
