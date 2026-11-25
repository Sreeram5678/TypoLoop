'use client';

import React, { useState, useEffect, useId } from 'react';
import { Timer } from 'lucide-react';
import { sound } from '@/lib/sound';

export const TIME_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
// Inset ticks from the rounded track ends so the first/last dots sit cleanly inside the pill.
const TRACK_INSET_PX = 6;

const getTrackPosition = (ratio: number) =>
  `calc(${TRACK_INSET_PX}px + (100% - ${TRACK_INSET_PX * 2}px) * ${ratio})`;

interface TimeSelectorProps {
  duration: number;
  onChangeDuration: (duration: number) => void;
  disabled?: boolean;
  soundEnabled?: boolean;
}

export function TimeSelector({
  duration,
  onChangeDuration,
  disabled = false,
  soundEnabled = true,
}: TimeSelectorProps) {
  const inputId = useId();
  const [localVal, setLocalVal] = useState<number>(duration);
  const [isDragging, setIsDragging] = useState(false);

  // Sync external duration updates when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalVal(duration);
    }
  }, [duration, isDragging]);

  const currentVal = isDragging ? localVal : duration;

  const getIndexFromDuration = (dur: number) => {
    let closestIdx = 0;
    let minDiff = Infinity;
    TIME_OPTIONS.forEach((val, idx) => {
      const diff = Math.abs(val - dur);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  const currentIndex = getIndexFromDuration(currentVal);
  const progressRatio = currentIndex / (TIME_OPTIONS.length - 1);
  const thumbPos = getTrackPosition(progressRatio);
  const fillWidth =
    currentIndex === 0
      ? '0%'
      : currentIndex === TIME_OPTIONS.length - 1
      ? '100%'
      : thumbPos;

  const commitDuration = (selectedDuration: number) => {
    const changed = selectedDuration !== currentVal;
    setLocalVal(selectedDuration);
    onChangeDuration(selectedDuration);
    if (soundEnabled && changed) {
      sound.playKeyClick(false);
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const idx = Number(e.target.value);
    const selectedDuration = TIME_OPTIONS[idx] ?? TIME_OPTIONS[0];
    commitDuration(selectedDuration);
  };

  const handleSelectBenchmark = (val: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    commitDuration(val);
  };

  return (
    <div className="inline-flex items-center select-none font-mono text-xs">
      <div
        className={`flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-[#ede4d8] px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl border transition-all duration-200 shadow-xs ${
          isDragging
            ? 'border-[#b4692c] bg-[#f7ecdf] shadow-md ring-2 ring-[#b4692c]/15'
            : 'border-[#d6c6b3] hover:border-[#b4692c]/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {/* Left: Timer Icon & Label */}
        <label
          htmlFor={inputId}
          className="flex items-center gap-1.5 text-[#9a531d] cursor-pointer shrink-0"
        >
          <Timer
            className={`w-4 h-4 transition-transform duration-200 ${
              isDragging ? 'scale-110 rotate-12 text-[#b4692c]' : 'text-[#b4692c]'
            }`}
          />
          <span className="font-bold text-xs text-[#2b1e16] tracking-wide">Time</span>
        </label>

        {/* Center: Accessible Native Range Slider + Custom Track & Ticks */}
        <div className="flex flex-col justify-center">
          <div className="relative flex items-center w-56 sm:w-64 md:w-72 h-6">
            {/* Native Range Input for full keyboard, pointer, and screen-reader support */}
            <input
              id={inputId}
              type="range"
              min={0}
              max={TIME_OPTIONS.length - 1}
              step={1}
              value={currentIndex}
              disabled={disabled}
              aria-label="Test duration"
              aria-valuetext={`${currentVal} seconds`}
              onChange={handleRangeChange}
              onPointerDown={() => setIsDragging(true)}
              onPointerUp={() => setIsDragging(false)}
              onPointerCancel={() => setIsDragging(false)}
              onBlur={() => setIsDragging(false)}
              className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0"
            />

            {/* Background Track Bar */}
            <div className="w-full h-2 bg-[#cbb8a3] rounded-full overflow-hidden relative shadow-inner pointer-events-none">
              {/* Dynamic Gradient Fill */}
              <div
                className="h-full bg-gradient-to-r from-[#d4843a] to-[#b4692c] rounded-full transition-all duration-200 ease-out"
                style={{ width: fillWidth }}
              />
            </div>

            {/* Benchmark Tick Marks along the Track */}
            <div className="absolute inset-0 pointer-events-none">
              {TIME_OPTIONS.map((val, idx) => {
                const tickPos = getTrackPosition(idx / (TIME_OPTIONS.length - 1));
                const isPassed = currentVal >= val;
                return (
                  <div
                    key={val}
                    className={`absolute top-1/2 w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      isPassed ? 'bg-[#fffaf3]/90 shadow-2xs' : 'bg-[#8e7a6d]/60'
                    }`}
                    style={{ left: tickPos, transform: 'translate(-50%, -50%)' }}
                  />
                );
              })}
            </div>

            {/* Custom Visual Thumb (responds to hover, drag, and keyboard focus-visible) */}
            <div
              className={`absolute top-1/2 w-5 h-5 rounded-full bg-[#fffaf3] border-2 border-[#b4692c] shadow-sm flex items-center justify-center pointer-events-none will-change-transform transition-all duration-200 ease-out peer-hover:scale-110 peer-focus-visible:ring-4 peer-focus-visible:ring-[#b4692c]/30 ${
                isDragging ? 'scale-115 shadow-md ring-4 ring-[#b4692c]/25' : ''
              }`}
              style={{ left: thumbPos, transform: 'translate(-50%, -50%)' }}
            >
              {/* Center Roasted Pip */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                  isDragging ? 'bg-[#8a4b1b]' : 'bg-[#b4692c]'
                }`}
              />
            </div>
          </div>

          {/* Clickable Benchmark Labels directly beneath each tick mark */}
          <div className="relative w-56 sm:w-64 md:w-72 h-4 mt-0.5 text-[10px] font-mono tabular-nums text-[#766356]">
            {TIME_OPTIONS.map((val, idx) => {
              const tickPos = getTrackPosition(idx / (TIME_OPTIONS.length - 1));
              const isSelected = currentVal === val;
              return (
                <button
                  key={val}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => handleSelectBenchmark(val, e)}
                  style={{ position: 'absolute', left: tickPos, transform: 'translateX(-50%)' }}
                  className={`px-1 rounded transition-colors duration-150 cursor-pointer hover:text-[#9a531d] ${
                    isSelected ? 'text-[#9a531d] font-bold' : ''
                  }`}
                >
                  {val}s
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#cbb8a3]/80 hidden sm:block" />

        {/* Live Animated Duration Badge */}
        <div
          aria-live="polite"
          className={`flex items-center justify-center min-w-[52px] px-2.5 py-1 rounded-xl font-bold font-mono tabular-nums text-xs transition-all duration-150 ${
            isDragging
              ? 'bg-[#b4692c] text-white border border-[#b4692c] shadow-sm'
              : 'bg-[#faf1e6] text-[#9a531d] border border-[#dfc5aa] shadow-2xs'
          }`}
        >
          <span>{currentVal}s</span>
        </div>
      </div>
    </div>
  );
}
