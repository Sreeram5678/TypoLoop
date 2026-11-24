'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getTestHistory,
  clearTestHistory,
  saveTestToHistory,
  TestHistoryEntry,
} from '@/lib/history';
import {
  Activity,
  Flame,
  Award,
  Clock,
  RotateCcw,
  Trash2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Coffee,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [history, setHistory] = useState<TestHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getTestHistory());
  }, []);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your local session history?')) {
      clearTestHistory();
      setHistory([]);
    }
  };

  const handleGenerateSampleData = () => {
    const sampleStats = [
      { wpm: 62, rawWpm: 66, accuracy: 94, consistency: 88, elapsedTime: 30, correctChars: 186, incorrectChars: 12, wpmTimeline: [] },
      { wpm: 68, rawWpm: 71, accuracy: 96, consistency: 90, elapsedTime: 30, correctChars: 204, incorrectChars: 8, wpmTimeline: [] },
      { wpm: 72, rawWpm: 76, accuracy: 95, consistency: 91, elapsedTime: 30, correctChars: 216, incorrectChars: 11, wpmTimeline: [] },
      { wpm: 78, rawWpm: 81, accuracy: 97, consistency: 93, elapsedTime: 30, correctChars: 234, incorrectChars: 7, wpmTimeline: [] },
      { wpm: 84, rawWpm: 87, accuracy: 98, consistency: 95, elapsedTime: 30, correctChars: 252, incorrectChars: 5, wpmTimeline: [] },
      { wpm: 88, rawWpm: 91, accuracy: 98, consistency: 96, elapsedTime: 30, correctChars: 264, incorrectChars: 4, wpmTimeline: [] },
    ];

    sampleStats.forEach((s, idx) => {
      saveTestToHistory(s as any, idx % 2 === 0 ? 'coffee' : 'words');
    });

    setHistory(getTestHistory());
  };

  // Calculations
  const totalTests = history.length;
  const bestWpm = totalTests > 0 ? Math.max(...history.map((h) => h.wpm)) : 0;
  const avgWpm =
    totalTests > 0
      ? Math.round(history.reduce((acc, h) => acc + h.wpm, 0) / totalTests)
      : 0;
  const avgAccuracy =
    totalTests > 0
      ? Math.round(history.reduce((acc, h) => acc + h.accuracy, 0) / totalTests)
      : 100;
  const totalKeystrokes =
    totalTests > 0
      ? history.reduce((acc, h) => acc + h.correctChars + h.incorrectChars, 0)
      : 0;

  // Chronological history for chart (oldest to newest)
  const chronological = [...history].reverse();

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ddd0c2]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#c87d32] uppercase tracking-wider font-semibold">
            <Activity className="w-4 h-4" />
            <span>Telemetry History & Growth</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2a1e17] mt-1">
            Typing Speed & Rhythm Analytics
          </h1>
          <p className="text-xs text-[#786558] mt-1 max-w-xl">
            Track your neuromuscular adaptation over time. All telemetry is securely stored in your local browser sandbox.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {totalTests === 0 ? (
            <button
              onClick={handleGenerateSampleData}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#efe6dd] hover:bg-[#c87d32] text-[#2a1e17] hover:text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Progression</span>
            </button>
          ) : (
            <button
              onClick={handleClear}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-[#ddd0c2] hover:border-[#a34338] text-[#786558] hover:text-[#a34338] rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Lifetime Metric Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Best WPM */}
        <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#786558] mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">All-Time Peak</span>
            <Award className="w-4 h-4 text-[#c87d32]" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-mono font-bold text-[#c87d32]">{bestWpm}</span>
            <span className="text-xs font-mono text-[#786558]">wpm</span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono block">Peak recorded velocity</span>
        </div>

        {/* Avg WPM */}
        <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#786558] mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">Average Speed</span>
            <TrendingUp className="w-4 h-4 text-[#2a1e17]" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-mono font-bold text-[#2a1e17]">{avgWpm}</span>
            <span className="text-xs font-mono text-[#786558]">wpm</span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono block">Across {totalTests} sessions</span>
        </div>

        {/* Avg Accuracy */}
        <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#786558] mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">Overall Accuracy</span>
            <Sparkles className="w-4 h-4 text-[#4a7c59]" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-mono font-bold text-[#4a7c59]">{avgAccuracy}%</span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono block">Precision benchmark</span>
        </div>

        {/* Total Keystrokes */}
        <div className="p-6 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#786558] mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">Keystrokes Logged</span>
            <Clock className="w-4 h-4 text-[#786558]" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-4xl font-mono font-bold text-[#2a1e17]">{totalKeystrokes}</span>
          </div>
          <span className="text-[11px] text-[#786558] mt-1 font-mono block">Total characters typed</span>
        </div>
      </div>

      {/* 3. WPM Progression Over Time SVG Chart */}
      <div className="p-6 md:p-8 bg-white border border-[#ddd0c2] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#2a1e17]">
              WPM Progression Timeline
            </h2>
            <p className="text-xs text-[#786558]">
              Velocity trajectory across sequential practice tests
            </p>
          </div>
          <span className="text-xs font-mono text-[#c87d32] bg-[#faede0] px-3 py-1 rounded-lg border border-[#ddd0c2]">
            {totalTests} Tests Recorded
          </span>
        </div>

        {chronological.length > 1 ? (
          <div className="w-full h-48 pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 120" preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              <line x1="0" y1="30" x2="600" y2="30" stroke="#efe6dd" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="600" y2="60" stroke="#efe6dd" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#efe6dd" strokeDasharray="3 3" />

              {/* Progression Line */}
              {(() => {
                const maxVal = Math.max(100, ...chronological.map((h) => h.wpm));
                const minVal = Math.min(30, ...chronological.map((h) => h.wpm));
                const range = maxVal - minVal || 1;

                const points = chronological
                  .map((h, idx) => {
                    const x = (idx / (chronological.length - 1)) * 600;
                    const y = 110 - ((h.wpm - minVal) / range) * 90;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#c87d32"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points}
                    />
                    {chronological.map((h, idx) => {
                      const x = (idx / (chronological.length - 1)) * 600;
                      const y = 110 - ((h.wpm - minVal) / range) * 90;
                      return (
                        <g key={h.id}>
                          <circle
                            cx={x}
                            cy={y}
                            r="4.5"
                            fill="#ffffff"
                            stroke="#c87d32"
                            strokeWidth="2.5"
                          />
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-mono text-[#786558] bg-[#fbf8f3] rounded-xl border border-[#ddd0c2]">
            Complete at least 2 practice sessions to render progression trajectories.
          </div>
        )}
      </div>

      {/* 4. Session History Log Table */}
      <div className="bg-white border border-[#ddd0c2] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#ddd0c2] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#2a1e17]">
              Session History Log
            </h2>
            <p className="text-xs text-[#786558]">
              Recent touch typing sessions with granular metrics
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-[#c87d32] hover:text-[#b46b25]"
          >
            <span>Launch New Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#fbf8f3] border-b border-[#ddd0c2] text-[#786558]">
                <tr>
                  <th className="py-3 px-6">Date & Time</th>
                  <th className="py-3 px-6">Mode</th>
                  <th className="py-3 px-6">Net Speed</th>
                  <th className="py-3 px-6">Accuracy</th>
                  <th className="py-3 px-6">Consistency</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6">Typos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ddd0c2]/60">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#fbf8f3]/60 transition-colors">
                    <td className="py-3 px-6 text-[#786558]">
                      {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-6 text-[#2a1e17] font-semibold">
                      {entry.mode}
                    </td>
                    <td className="py-3 px-6">
                      <span className="font-bold text-[#c87d32] text-sm">{entry.wpm}</span>
                      <span className="text-[10px] text-[#786558] ml-1">wpm</span>
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`font-semibold ${
                          entry.accuracy >= 95 ? 'text-[#4a7c59]' : 'text-[#c87d32]'
                        }`}
                      >
                        {entry.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-6 text-[#786558]">
                      {entry.consistency}%
                    </td>
                    <td className="py-3 px-6 text-[#786558]">
                      {entry.elapsedSeconds}s
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-[#a34338] font-semibold">{entry.incorrectChars}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs font-mono text-[#786558]">
            No sessions recorded yet. Start practicing in the Arena to log performance!
          </div>
        )}
      </div>
    </div>
  );
}
