'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [localVal, setLocalVal] = useState<number>(duration);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastSoundRef = useRef<number>(duration);

  // Sync external duration updates when not actively dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalVal(duration);
    }
  }, [duration, isDragging]);

  const currentVal = isDragging ? localVal : duration;

  // Find closest index for currentVal
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

  // Update value based on pointer clientX
  const updateFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;

      const usableWidth = rect.width - TRACK_INSET_PX * 2;
      const ratio =
        usableWidth > 0
          ? Math.min(Math.max((clientX - rect.left - TRACK_INSET_PX) / usableWidth, 0), 1)
          : Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const targetIndex = Math.min(
        Math.max(Math.round(ratio * (TIME_OPTIONS.length - 1)), 0),
        TIME_OPTIONS.length - 1
      );
      const selectedDuration = TIME_OPTIONS[targetIndex];

      setLocalVal(selectedDuration);
      onChangeDuration(selectedDuration);

      if (soundEnabled && lastSoundRef.current !== selectedDuration) {
        sound.playKeyClick(false);
        lastSoundRef.current = selectedDuration;
      }
    },
    [onChangeDuration, soundEnabled]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    e.preventDefault();
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // silent
    }
    setIsDragging(false);
  };

  const handleSelectBenchmark = (val: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setLocalVal(val);
    onChangeDuration(val);
    if (soundEnabled) {
      sound.playKeyClick(false);
    }
  };

  return (
    <div className="inline-flex items-center select-none font-mono text-xs">
      <div
        className={`flex flex-col sm:flex-row items-center gap-3 bg-[#ede4d8] px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-2xl border border-[#d8c9b8] shadow-xs transition-shadow duration-300 ${
          isDragging
            ? 'border-[#b4692c] bg-[#faede0] shadow-md ring-2 ring-[#b4692c]/20'
            : 'hover:border-[#b4692c]/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        {/* Left: Timer Icon & Label */}
        <div className="flex items-center space-x-2 text-[#b4692c]">
          <Timer
            className={`w-4 h-4 transition-transform duration-200 ${
              isDragging ? 'scale-115 rotate-12 text-[#b4692c]' : 'text-[#b4692c]'
            }`}
          />
          <span className="font-bold text-xs text-[#1f1610] tracking-wide">Time</span>
        </div>

        {/* Center: Custom Smooth Scrubbing Track */}
        <div className="flex flex-col justify-center px-1">
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative flex items-center w-52 sm:w-60 md:w-72 h-8 cursor-pointer touch-none select-none"
          >
            {/* Background Track Bar */}
            <div className="w-full h-2.5 bg-[#dfd2c2] rounded-full overflow-hidden relative shadow-inner">
              {/* Dynamic Gradient Fill (Smooth spring easing to exact selected notch) */}
              <div
                className="h-full bg-gradient-to-r from-[#c87d32] to-[#b4692c] rounded-full transition-all duration-200 ease-out"
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
                      isPassed ? 'bg-white shadow-xs scale-110' : 'bg-[#bca997]'
                    }`}
                    style={{ left: tickPos, transform: 'translate(-50%, -50%)' }}
                  />
                );
              })}
            </div>

            {/* Hardware-Accelerated Smooth Thumb */}
            <div
              className={`absolute top-1/2 w-6 h-6 rounded-full bg-white border-2 border-[#b4692c] shadow-md flex items-center justify-center pointer-events-none will-change-transform transition-all duration-200 ease-out ${
                isDragging ? 'scale-120 shadow-lg ring-4 ring-[#b4692c]/25' : 'hover:scale-110'
              }`}
              style={{ left: thumbPos, transform: 'translate(-50%, -50%)' }}
            >
              {/* Center Roasted Pip */}
              <div
                className={`w-1.5 h-1.5 rounded-full bg-[#b4692c] transition-transform duration-150 ${
                  isDragging ? 'scale-125 bg-[#8a4b1b]' : ''
                }`}
              />
            </div>
          </div>

          {/* Clickable Benchmark Labels directly beneath each tick mark */}
          <div className="relative w-52 sm:w-60 md:w-72 h-4 text-[10px] font-mono text-[#8e7a6d]">
            {TIME_OPTIONS.map((val, idx) => {
              const tickPos = getTrackPosition(idx / (TIME_OPTIONS.length - 1));
              const isSelected = currentVal === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={(e) => handleSelectBenchmark(val, e)}
                  style={{ position: 'absolute', left: tickPos, transform: 'translateX(-50%)' }}
                  className={`hover:text-[#b4692c] transition-all cursor-pointer ${
                    isSelected ? 'text-[#b4692c] font-bold scale-110' : ''
                  }`}
                >
                  {val}s
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#cbb8a3] hidden sm:block" />

        {/* Live Animated Duration Badge */}
        <div
          className={`flex items-center justify-center min-w-[50px] px-2.5 py-1 rounded-xl font-bold font-mono text-xs transition-all duration-150 shadow-2xs ${
            isDragging
              ? 'bg-[#b4692c] text-white scale-110 shadow-sm'
              : 'bg-[#faede0] text-[#b4692c] border border-[#e4ccb5]'
          }`}
        >
          <span>{currentVal}s</span>
        </div>
      </div>
    </div>
  );
}
