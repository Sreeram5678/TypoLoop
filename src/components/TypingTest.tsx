'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { KeystrokeEvent } from '@/types/typing';
import { sound } from '@/lib/sound';
import { RotateCcw, Clock, Sparkles, Loader2, Dices, AlertCircle } from 'lucide-react';
import { RANDOM_PROMPT_TOPICS } from '@/lib/paragraphs';

interface TypingTestProps {
  words: string[];
  duration: number; // in seconds
  soundEnabled: boolean;
  showLiveWpm: boolean;
  isAiDrill?: boolean;
  storyTitle?: string;
  storyModel?: string;
  isLoadingNewText?: boolean;
  isPrefetchingMore?: boolean;
  onFinish: (keystrokes: KeystrokeEvent[], elapsedSeconds: number) => void;
  onReset: () => void;
  onActiveChange?: (isActive: boolean) => void;
  onGenerateCustom?: (prompt: string) => void;
  onGenerateRandom?: (topic?: string) => void;
  onNearEnd?: (remainingWords: number) => void;
  generationError?: string | null;
}

export function TypingTest({
  words,
  duration,
  soundEnabled,
  showLiveWpm,
  isAiDrill = false,
  storyTitle,
  storyModel,
  isLoadingNewText = false,
  isPrefetchingMore = false,
  onFinish,
  onReset,
  onActiveChange,
  onGenerateCustom,
  onGenerateRandom,
  onNearEnd,
  generationError,
}: TypingTestProps) {
  // Custom prompt input state
  const [promptInput, setPromptInput] = useState('');

  // Typing state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [typedChars, setTypedChars] = useState<string[][]>(() =>
    words.map(() => [])
  );

  // Timing state
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAcc, setLiveAcc] = useState(100);
  const [prevDuration, setPrevDuration] = useState(duration);

  // Sync duration changes when test is not active
  if (duration !== prevDuration) {
    setPrevDuration(duration);
    if (!isActive) {
      setTimeLeft(duration);
    }
  }

  // Guard against duplicate finish calls
  const isFinishedRef = useRef(false);

  // Track previous words array and active state to differentiate complete resets from live extensions
  const prevWordsRef = useRef<string[]>(words);
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Keystroke telemetry
  const keystrokesRef = useRef<KeystrokeEvent[]>([]);
  const lastKeyTimeRef = useRef<number | null>(null);
  const keyDownTimesRef = useRef<Map<string, number>>(new Map());

  // Input & layout refs
  const inputRef = useRef<HTMLInputElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Sync words updates & reset
  useEffect(() => {
    const prevWords = prevWordsRef.current;

    // Check if this is an in-flight extension (active test, new words appended to the end)
    const isExtension =
      isActiveRef.current &&
      words.length > prevWords.length &&
      prevWords.length > 0 &&
      prevWords.every((w, i) => w === words[i]);

    prevWordsRef.current = words;

    if (isExtension) {
      // Seamlessly grow typedChars for new words without resetting cursor, timer or keystrokes
      setTypedChars((prev) => {
        const added = words.slice(prev.length).map(() => []);
        return [...prev, ...added];
      });
      return;
    }

    // Full reset (e.g. new test, reset button, prompt change)
    isFinishedRef.current = false;
    setTypedChars(words.map(() => []));
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setTimeLeft(duration);
    setIsActive(false);
    setStartTime(null);
    setLiveWpm(0);
    setLiveAcc(100);
    keystrokesRef.current = [];
    lastKeyTimeRef.current = null;
    if (wordsContainerRef.current) {
      wordsContainerRef.current.scrollTop = 0;
    }
    inputRef.current?.focus();
  }, [words, duration]);

  // Notify parent of typing active state
  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  // Handlers for Gemma custom paragraph and random paragraph generation
  const handleGenerateCustom = () => {
    if (!promptInput.trim() || isLoadingNewText || !onGenerateCustom) return;
    onGenerateCustom(promptInput.trim());
  };

  const handleGenerateRandom = () => {
    if (isLoadingNewText || !onGenerateRandom) return;
    const randomTopic = RANDOM_PROMPT_TOPICS[Math.floor(Math.random() * RANDOM_PROMPT_TOPICS.length)];
    setPromptInput(randomTopic);
    onGenerateRandom(randomTopic);
  };

  // Finish test callback (deferred to prevent React setState-in-render conflict)
  const finishTest = useCallback(() => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsActive(false);
    const elapsed = duration - timeLeft || duration;

    // Use setTimeout(..., 0) so onFinish state updates in Home happen outside any render cycle
    setTimeout(() => {
      onFinish(keystrokesRef.current, elapsed);
    }, 0);
  }, [duration, timeLeft, onFinish]);

  // Timer countdown effect
  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      finishTest();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft, finishTest]);

  // Auto-scroll container when user advances to subsequent lines
  useEffect(() => {
    const container = wordsContainerRef.current;
    const wordElem = activeWordRef.current;
    if (!container || !wordElem) return;

    const wordTop = wordElem.offsetTop;
    const containerTop = container.scrollTop;
    const relativePos = wordTop - containerTop;

    // Line 1 is at 24px, line 2 at 75px, line 3 at 126px.
    // Three lines fit comfortably in the 190px container without scrolling.
    // Only scroll when advancing beyond line 2 (relativePos > 85px),
    // centering the active line on row 2 (wordTop - 75).
    if (relativePos > 85) {
      container.scrollTo({
        top: Math.max(0, wordTop - 75),
        behavior: 'smooth',
      });
    } else if (relativePos < 20 && containerTop > 0) {
      container.scrollTo({
        top: Math.max(0, wordTop - 24),
        behavior: 'smooth',
      });
    }
  }, [currentWordIndex]);

  // Keep input focused
  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  // Keyboard navigation & handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isLoadingNewText) return;

    // Restart hotkeys: Esc or Tab
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      onReset();
      return;
    }

    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      return;
    }

    const now = Date.now();
    keyDownTimesRef.current.set(e.key, now);

    // Start timer on first keystroke
    if (!isActive && timeLeft > 0 && !isFinishedRef.current) {
      setIsActive(true);
      setStartTime(now);
      lastKeyTimeRef.current = now;
    }

    const iki = lastKeyTimeRef.current ? Math.min(now - lastKeyTimeRef.current, 5000) : 0;
    lastKeyTimeRef.current = now;

    const currentWord = words[currentWordIndex] || '';
    const currentWordTyped = typedChars[currentWordIndex] || [];

    // 1. Backspace handling
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (currentCharIndex > 0) {
        const nextTyped = [...typedChars];
        nextTyped[currentWordIndex] = currentWordTyped.slice(0, -1);
        setTypedChars(nextTyped);
        setCurrentCharIndex((prev) => prev - 1);
      } else if (currentWordIndex > 0 && typedChars[currentWordIndex - 1]?.length > 0) {
        const prevWordIndex = currentWordIndex - 1;
        setCurrentWordIndex(prevWordIndex);
        setCurrentCharIndex(typedChars[prevWordIndex].length);
      }
      return;
    }

    // 2. Space handling (word completion)
    if (e.key === ' ') {
      e.preventDefault();
      if (currentWordTyped.length === 0) return; // Don't advance on empty word

      const expectedChar = ' ';
      const isCorrect = currentCharIndex === currentWord.length;

      keystrokesRef.current.push({
        key: ' ',
        code: e.code,
        expected: expectedChar,
        timestamp: now,
        duration: 80,
        isCorrect,
        iki,
        targetWordIndex: currentWordIndex,
        charIndex: currentCharIndex,
      });

      if (soundEnabled) sound.playKeyClick(false);

      if (currentWordIndex + 1 < words.length) {
        const nextWordIndex = currentWordIndex + 1;
        setCurrentWordIndex(nextWordIndex);
        setCurrentCharIndex(0);

        // Check if user is nearing the end of available words buffer
        const remaining = words.length - nextWordIndex;
        if (remaining <= 15) {
          onNearEnd?.(remaining);
        }
      } else {
        // Reached end of current words pool
        if (timeLeft > 0 && onNearEnd) {
          onNearEnd(0);
        } else {
          finishTest();
        }
      }
      return;
    }

    // 3. Regular printable character
    if (e.key.length === 1) {
      e.preventDefault();
      const expectedChar = currentWord[currentCharIndex] || '';
      const isCorrect = e.key === expectedChar;

      keystrokesRef.current.push({
        key: e.key,
        code: e.code,
        expected: expectedChar,
        timestamp: now,
        duration: 80,
        isCorrect,
        iki,
        targetWordIndex: currentWordIndex,
        charIndex: currentCharIndex,
      });

      if (soundEnabled) sound.playKeyClick(!isCorrect);

      const nextTyped = [...typedChars];
      nextTyped[currentWordIndex] = [...currentWordTyped, e.key];
      setTypedChars(nextTyped);
      setCurrentCharIndex((prev) => prev + 1);

      // Update live stats on keystroke inside handler
      const total = keystrokesRef.current.length;
      const correct = keystrokesRef.current.filter((k) => k.isCorrect).length;
      const elapsed = startTime ? (now - startTime) / 1000 : 0;
      if (elapsed > 2) {
        setLiveWpm(Math.round((correct / 5) / (elapsed / 60)));
      }
      if (total > 0) {
        setLiveAcc(Math.round((correct / total) * 100));
      }
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className="relative flex flex-col w-full max-w-4xl mx-auto select-none outline-none cursor-text transition-all duration-300"
    >
      {/* Hidden input to capture physical keystrokes smoothly */}
      <input
        ref={inputRef}
        type="text"
        autoFocus
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 opacity-0 cursor-default pointer-events-none"
      />

      {/* Test Meta Header: Story Title / Drill on Left, Live Stats & Timer on Right */}
      <div className="flex items-center justify-between mb-4 px-2 min-h-[40px]">
        {/* Left: Story Title or Gemma Drill indicator */}
        <div className="flex items-center space-x-2">
          {storyTitle ? (
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b4692c]" />
              <span className="text-[#2a1e17] font-serif font-bold text-base tracking-wide">
                {storyTitle}
              </span>
              {storyModel && (
                <span className="hidden sm:inline-block ml-2 text-[11px] text-[#5e4f45] font-mono bg-[#efe6dd] px-2 py-0.5 rounded-lg border border-[#d8c9b8]">
                  Brewed via <span className="text-[#b4692c] font-semibold">{storyModel}</span>
                </span>
              )}
            </div>
          ) : isAiDrill ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#faede0] border border-[#b4692c]/40 text-[#b4692c] rounded-xl text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemma Adaptive Drill</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-[#786558] italic hidden sm:block">
                Touch typing flow
              </span>
            </div>
          )}
        </div>

        {/* Right: Live Metrics & Countdown Timer */}
        <div className="flex items-center space-x-4">
          {showLiveWpm && isActive && (
            <div className="flex items-center space-x-3.5 text-xs font-mono bg-white px-3 py-1 rounded-xl border border-[#d8c9b8] shadow-xs animate-in fade-in">
              <span className="text-[#5e4f45]">
                WPM: <strong className="text-[#b4692c] font-bold text-sm">{liveWpm}</strong>
              </span>
              <span className="text-[#5e4f45]">
                ACC: <strong className="text-[#2a6f43] font-bold text-sm">{liveAcc}%</strong>
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-2xl font-mono font-bold text-[#b4692c] bg-[#faede0] px-3.5 py-1 rounded-xl border border-[#d8c9b8] shadow-xs">
            <Clock className="w-5 h-5 text-[#b4692c]" />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* Words Display Area with Smooth Line Auto-Scroll */}
      <div
        ref={wordsContainerRef}
        className="relative h-[190px] overflow-hidden rounded-2xl p-6 bg-white border-2 border-[#d8c9b8] shadow-sm"
      >
        {isLoadingNewText && (
          <div className="absolute inset-0 bg-[#fbf8f3]/90 backdrop-blur-xs flex items-center justify-center space-x-2.5 z-10 rounded-2xl animate-in fade-in duration-150">
            <Loader2 className="w-5 h-5 text-[#b4692c] animate-spin" />
            <span className="text-sm font-mono font-medium text-[#2a1e17]">Gemma is brewing your custom passage...</span>
          </div>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-3 font-mono text-2xl font-medium leading-relaxed">
          {words.map((word, wIdx) => {
            const isCurrentWord = wIdx === currentWordIndex;
            const typed = typedChars[wIdx] || [];
            const isAtOrBeyondWordEnd = isCurrentWord && currentCharIndex >= word.length;
            const hasExtraChars = typed.length > word.length;

            return (
              <span
                key={wIdx}
                ref={isCurrentWord ? activeWordRef : null}
                className={`relative inline-flex items-center transition-opacity duration-200 ${
                  wIdx < currentWordIndex - 8 ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {/* Active word subtle coffeehouse backdrop - strictly absolute so layout width is 100% invariant */}
                {isCurrentWord && (
                  <span className="absolute -inset-x-1.5 -inset-y-0.5 bg-[#faede0]/60 rounded-md -z-10 pointer-events-none" />
                )}

                {/* Render expected characters */}
                {word.split('').map((char, cIdx) => {
                  const typedChar = typed[cIdx];
                  const isCharTyped = typedChar !== undefined;
                  const isCorrect = isCharTyped && typedChar === char;
                  const isCurrentChar = isCurrentWord && cIdx === currentCharIndex;
                  const isLastExpectedChar = cIdx === word.length - 1;
                  const showCaretAfterThis =
                    isAtOrBeyondWordEnd &&
                    !hasExtraChars &&
                    isLastExpectedChar;

                  let colorClass = 'text-[#786558]';
                  if (isCharTyped) {
                    colorClass = isCorrect
                      ? 'text-[#1a120c]'
                      : 'text-[#b9382b] bg-[#fde8e6] rounded-xs underline decoration-[#b9382b] decoration-2';
                  }

                  return (
                    <span
                      key={cIdx}
                      className={`relative inline-block ${colorClass} transition-colors duration-75`}
                    >
                      {/* Caret before current char */}
                      {isCurrentChar && (
                        <span className="absolute -left-[1px] top-1 bottom-1 w-[2px] bg-[#b4692c] animate-pulse shadow-[0_0_8px_rgba(180,105,44,0.9)] rounded-full pointer-events-none" />
                      )}
                      {/* Caret after last char of word when completed */}
                      {showCaretAfterThis && (
                        <span className="absolute -right-[1px] top-1 bottom-1 w-[2px] bg-[#b4692c] animate-pulse shadow-[0_0_8px_rgba(180,105,44,0.9)] rounded-full pointer-events-none" />
                      )}
                      {char}
                    </span>
                  );
                })}

                {/* Render extra typed characters beyond expected word */}
                {typed.slice(word.length).map((extraChar, eIdx) => {
                  const isLastExtra = eIdx === typed.length - word.length - 1;
                  const showCaretAfterExtra = isAtOrBeyondWordEnd && isLastExtra;

                  return (
                    <span
                      key={`extra-${eIdx}`}
                      className="relative inline-block text-[#b9382b] bg-[#fde8e6] rounded-xs underline decoration-[#b9382b] decoration-2"
                    >
                      {showCaretAfterExtra && (
                        <span className="absolute -right-[1px] top-1 bottom-1 w-[2px] bg-[#b4692c] animate-pulse shadow-[0_0_8px_rgba(180,105,44,0.9)] rounded-full pointer-events-none" />
                      )}
                      {extraChar}
                    </span>
                  );
                })}

                {/* Edge case: empty word with caret */}
                {word.length === 0 && isCurrentWord && (
                  <span className="relative inline-block w-0">
                    <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#b4692c] animate-pulse shadow-[0_0_8px_rgba(180,105,44,0.9)] rounded-full pointer-events-none" />
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom Hotkey Help Bar */}
      <div className="flex items-center justify-center mt-6 space-x-4 text-xs text-[#5e4f45] font-mono">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="keycap-button flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-[#d8c9b8] bg-[#efe6dd] hover:bg-[#e6dacb] text-[#2a1e17] font-semibold transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#b4692c]" />
          <span>Restart Test</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white text-[#2a1e17] font-bold rounded border border-[#d8c9b8]">Tab</span>
        </button>
        <span className="text-[#d8c9b8]">|</span>
        <span className="text-xs font-medium text-[#5e4f45]">Click text or start typing to begin</span>
      </div>

      {/* Gemma Paragraph Generator Bar (At the bottom of these) */}
      {(onGenerateCustom || onGenerateRandom) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-6 p-2 sm:p-2.5 bg-white border-2 border-[#d8c9b8] rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all hover:border-[#c5b4a1]"
        >
          <div className="relative flex-1 flex items-center">
            <Sparkles className="absolute left-3 w-4 h-4 text-[#b4692c] pointer-events-none" />
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerateCustom();
                }
              }}
              placeholder="Type what paragraph you want Gemma to create (e.g. quantum physics, coffee roasting)..."
              disabled={isLoadingNewText}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#fbf8f3] text-[#1f1610] placeholder:text-[#8a796e] rounded-xl border border-[#d8c9b8] focus:border-[#b4692c] focus:bg-white focus:ring-2 focus:ring-[#b4692c]/20 outline-none transition-all disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateCustom();
              }}
              disabled={isLoadingNewText || !promptInput.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#b4692c] hover:bg-[#9a5620] active:scale-[0.98] text-white font-mono text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Generate custom paragraph with Gemma"
            >
              {isLoadingNewText ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGenerateRandom();
              }}
              disabled={isLoadingNewText}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-[#efe6dd] hover:bg-[#e6dacb] active:scale-[0.98] text-[#2a1e17] border border-[#d8c9b8] font-mono text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Generate a random paragraph with Gemma"
            >
              <Dices className="w-3.5 h-3.5 text-[#b4692c]" />
              <span>Random</span>
            </button>
          </div>
        </div>
      )}

      {/* Generation Error Banner */}
      {generationError && (
        <div className="mt-2 text-xs font-mono text-[#b9382b] bg-[#fde8e6] border border-[#f5c2bd] px-3.5 py-2 rounded-xl flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{generationError}</span>
        </div>
      )}
    </div>
  );
}
