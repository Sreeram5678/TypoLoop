'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { TypingTest } from '@/components/TypingTest';
import { ResultsView } from '@/components/ResultsView';
import { generateWordStream, INITIAL_WORDS, COMMON_WORDS, INITIAL_PASSAGE_TITLE, INITIAL_PASSAGE_MODEL } from '@/lib/words';
import { calculateTypingStats, extractDiagnostics } from '@/lib/analyzer';
import {
  CURATED_PASSAGES,
  getAllCuratedPassages,
  getRandomCuratedPassage,
  paragraphToWords,
  RANDOM_PROMPT_TOPICS,
} from '@/lib/paragraphs';
import { saveTestToHistory } from '@/lib/history';
import { saveSession, getMasteryProfile } from '@/lib/storage';
import { ProfileModal } from '@/components/ProfileModal';
import { TimeSelector } from '@/components/TimeSelector';
import { useSettings } from '@/context/SettingsContext';
import {
  KeystrokeEvent,
  TypingDiagnostics,
  AIFeedback,
  AIThemeId,
  ProfileHistoricalContext,
} from '@/types/typing';
import {
  Brain,
  BookOpen,
  Activity,
  ArrowRight,
  Sliders,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

function getTargetWordCount(durationSeconds: number): number {
  if (durationSeconds <= 15) return 90;
  if (durationSeconds <= 30) return 160;
  if (durationSeconds <= 60) return 280;
  return 420;
}

function PracticeArenaContent() {
  const { settings, updateSettings, openSettings } = useSettings();
  const searchParams = useSearchParams();

  const [curatedTitle, setCuratedTitle] = useState<string>(INITIAL_PASSAGE_TITLE);
  const [storyModel, setStoryModel] = useState<string | undefined>(INITIAL_PASSAGE_MODEL);
  const [testKey, setTestKey] = useState<number>(0);
  const [isGeneratingParagraph, setIsGeneratingParagraph] = useState(false);
  const [isPrefetchingMore, setIsPrefetchingMore] = useState(false);
  const isPrefetchingRef = useRef(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // View state
  const [view, setView] = useState<'test' | 'results'>('test');

  // Word pool - initialize deterministically with INITIAL_WORDS to guarantee 100% identical SSR & client hydration
  const [words, setWords] = useState<string[]>(INITIAL_WORDS);
  const [isAiDrill, setIsAiDrill] = useState(false);

  // Results & AI Feedback
  const [diagnostics, setDiagnostics] = useState<TypingDiagnostics | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Longitudinal Profile & Historical Context
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [historicalContext, setHistoricalContext] = useState<ProfileHistoricalContext | null>(null);
  const [isTestActive, setIsTestActive] = useState(false);

  // Check URL query parameters for custom drill
  useEffect(() => {
    const drillParam = searchParams.get('drill');
    if (drillParam) {
      try {
        const decoded = decodeURIComponent(drillParam).split(',').filter(Boolean);
        if (decoded.length > 0) {
          const repeated = [...decoded, ...decoded, ...decoded];
          setTimeout(() => {
            setWords(repeated);
            setIsAiDrill(true);
            setCuratedTitle('Custom Practice Drill');
            setTestKey((k) => k + 1);
          }, 0);
        }
      } catch {
        // silent
      }
    }
  }, [searchParams]);

  // Reset standard test with atmospheric curated passages drawn from all themes
  const handleResetTest = useCallback(() => {
    if (isAiDrill) {
      setWords((prev) => [...prev]);
    } else {
      const randomPassage = getRandomCuratedPassage(curatedTitle);
      const otherPassages = getAllCuratedPassages().filter((p) => p.title !== randomPassage.title);
      const shuffledOthers = [...otherPassages].sort(() => Math.random() - 0.5);
      const combinedText = [randomPassage.text, ...shuffledOthers.map((p) => p.text)].join(' ');
      setWords(paragraphToWords(combinedText));
      setCuratedTitle(randomPassage.title);
      setStoryModel('TypoLoop Reserve');
    }
    setIsAiDrill(false);
    setIsTestActive(false);
    setView('test');
    setDiagnostics(null);
    setAiFeedback(null);
    setTestKey((k) => k + 1);
  }, [isAiDrill, curatedTitle]);

  // Handle reset to starting page requested by logo/navigation clicks
  const resetToHomeStartingState = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', '/');
    }
    setIsAiDrill(false);
    setIsTestActive(false);
    setView('test');
    setDiagnostics(null);
    setAiFeedback(null);
    setWords([...INITIAL_WORDS]);
    setCuratedTitle(INITIAL_PASSAGE_TITLE);
    setStoryModel(INITIAL_PASSAGE_MODEL);
    setTestKey((k) => k + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('reset-typoloop-home', resetToHomeStartingState);
    return () => window.removeEventListener('reset-typoloop-home', resetToHomeStartingState);
  }, [resetToHomeStartingState]);

  // Safety net fallback to instantly append curated words if typist nears end
  const appendSafetyNetWords = useCallback(() => {
    const themeKeys: AIThemeId[] = ['coffee', 'scifi', 'cyberpunk', 'tech', 'philosophy', 'literature'];
    const randomTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];
    const passages = CURATED_PASSAGES[randomTheme] || CURATED_PASSAGES.coffee;
    const passage = passages[Math.floor(Math.random() * passages.length)];
    const newWords = paragraphToWords(passage.text);
    if (newWords.length > 0) {
      setWords((prev) => [...prev, ...newWords]);
    }
  }, []);

  // Near-end prefetching handler triggered by TypingTest
  const handleNearEnd = useCallback(
    async (remainingWords: number) => {
      if (!isTestActive) return;

      // Emergency safety net fallback: if typist is within <= 5 words and fetch is not ready yet,
      // immediately inject a curated passage chunk so the user NEVER stops.
      if (remainingWords <= 5) {
        appendSafetyNetWords();
        return;
      }

      // If already prefetching in background, don't trigger duplicate fetch
      if (isPrefetchingRef.current) return;

      isPrefetchingRef.current = true;
      setIsPrefetchingMore(true);

      try {
        if (isAiDrill) {
          // Drill mode: extend targeted drill stream seamlessly
          setWords((prev) => {
            const chunk = prev.slice(-30);
            return [...prev, ...(chunk.length > 0 ? chunk : INITIAL_WORDS.slice(0, 30))];
          });
        } else if (curatedTitle || storyModel) {
          // Gemma Story / Custom paragraph: request narrative continuation
          const lastWordsContext = words.slice(-15).join(' ');

          const res = await fetch('/api/generate-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customPrompt: curatedTitle || 'Atmospheric Touch Typing Story',
              continuationContext: lastWordsContext,
              theme: 'custom',
              provider: settings.modelProvider,
              ollamaBaseUrl: settings.ollamaBaseUrl,
              googleApiKey: settings.googleApiKey,
              wordCount: 65,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.words && data.words.length > 0) {
              setWords((prev) => [...prev, ...data.words]);
            } else {
              appendSafetyNetWords();
            }
          } else {
            appendSafetyNetWords();
          }
        } else {
          // Standard random word stream
          setWords((prev) => [...prev, ...generateWordStream(60)]);
        }
      } catch (err) {
        console.warn('Background text extension error:', err);
        appendSafetyNetWords();
      } finally {
        isPrefetchingRef.current = false;
        setIsPrefetchingMore(false);
      }
    },
    [
      isTestActive,
      isAiDrill,
      curatedTitle,
      storyModel,
      words,
      settings,
      appendSafetyNetWords,
    ]
  );

  // Generate custom paragraph using Gemma
  const handleGenerateCustomParagraph = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsGeneratingParagraph(true);
    setGenerationError(null);

    const targetWordCount = getTargetWordCount(settings.testDuration);

    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: promptText.trim(),
          theme: 'custom',
          provider: settings.modelProvider,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          googleApiKey: settings.googleApiKey,
          wordCount: targetWordCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.words && data.words.length > 0) {
          setWords(data.words);
          setCuratedTitle(data.title || promptText.trim());
          setStoryModel(data.modelUsed || 'Gemma 4');
          setIsAiDrill(false);
          setIsTestActive(false);
          setView('test');
          setDiagnostics(null);
          setAiFeedback(null);
          setGenerationError(null);
        } else {
          setGenerationError('Gemma did not return a passage. Please try another prompt.');
        }
      } else {
        setGenerationError('Server returned an error while generating. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Error generating paragraph with Gemma:', err);
      const msg = err instanceof Error ? err.message : 'Could not connect to Gemma service.';
      setGenerationError(msg);
    } finally {
      setIsGeneratingParagraph(false);
    }
  };

  // Generate random paragraph using Gemma
  const handleGenerateRandomParagraph = async (chosenTopic?: string) => {
    setIsGeneratingParagraph(true);
    setGenerationError(null);
    const topic = chosenTopic || RANDOM_PROMPT_TOPICS[Math.floor(Math.random() * RANDOM_PROMPT_TOPICS.length)];
    const targetWordCount = getTargetWordCount(settings.testDuration);

    try {
      const res = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: topic,
          theme: 'custom',
          provider: settings.modelProvider,
          ollamaBaseUrl: settings.ollamaBaseUrl,
          googleApiKey: settings.googleApiKey,
          wordCount: targetWordCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.words && data.words.length > 0) {
          setWords(data.words);
          setCuratedTitle(data.title || topic);
          setStoryModel(data.modelUsed || 'Gemma 4');
          setIsAiDrill(false);
          setIsTestActive(false);
          setView('test');
          setDiagnostics(null);
          setAiFeedback(null);
          setGenerationError(null);
        } else {
          setGenerationError('Gemma did not return a passage. Please try another topic.');
        }
      } else {
        setGenerationError('Server returned an error while generating. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Error generating random paragraph with Gemma:', err);
      // Seamlessly fall back to another passage from the curated library so user is never blocked
      const fallback = getRandomCuratedPassage(curatedTitle);
      const newWords = paragraphToWords(fallback.text);
      if (newWords.length > 0) {
        setWords(newWords);
        setCuratedTitle(fallback.title);
        setStoryModel('TypoLoop Curated Fallback');
        setIsAiDrill(false);
        setIsTestActive(false);
        setView('test');
        setDiagnostics(null);
        setAiFeedback(null);
        setGenerationError(null);
      } else {
        const msg = err instanceof Error ? err.message : 'Could not connect to Gemma service.';
        setGenerationError(msg);
      }
    } finally {
      setIsGeneratingParagraph(false);
    }
  };

  // Duration change (lightweight, butter-smooth update without resetting words during drag)
  const handleChangeDuration = useCallback((duration: number) => {
    updateSettings({ testDuration: duration });
  }, [updateSettings]);

  // When test finishes
  const handleFinishTest = async (keystrokes: KeystrokeEvent[], elapsedSeconds: number) => {
    const fullExpectedText = words.join(' ');
    const stats = calculateTypingStats(keystrokes, elapsedSeconds, fullExpectedText);
    const diag = extractDiagnostics(keystrokes, stats);

    setDiagnostics(diag);
    setView('results');
    setIsLoadingAi(true);

    // Save to persistent local history
    saveTestToHistory(stats, isAiDrill ? 'custom_drill' : 'random_words', diag);

    // Save session to longitudinal local storage
    const keyErrors = diag.classifiedErrors.reduce<Record<string, number>>((acc, err) => {
      const k = err.expected.toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const sessionResult = saveSession({
      mode: 'words',
      duration: elapsedSeconds,
      stats,
      diagnosticsSummary: {
        weakBigrams: diag.weakBigrams,
        hesitations: diag.hesitations,
        fingerErrors: diag.fingerErrors,
        keyErrors,
        errorTypeBreakdown: diag.errorTypeBreakdown,
        handBalance: diag.handBalance,
      },
    });

    const currentHistoricalContext = sessionResult.historicalContext;
    setHistoricalContext(currentHistoricalContext);

    // Call Gemma analysis API
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnostics: diag,
          historicalContext: currentHistoricalContext,
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
      console.error('Error invoking Gemma analysis:', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Load Gemma's targeted adaptive drill
  const handleStartDrill = (drillWords: string[]) => {
    if (!drillWords || drillWords.length === 0) return;
    const repeated = [...drillWords, ...drillWords, ...drillWords];
    setWords(repeated);
    setIsAiDrill(true);
    setCuratedTitle('Gemma Neuromuscular Drill');
    setView('test');
    setDiagnostics(null);
    setAiFeedback(null);
  };

  // Handle "Weakness Workout": generate words concentrating on chronic weak bigrams or keys
  const handleStartWeaknessWorkout = useCallback(() => {
    const profile = getMasteryProfile();
    const troubleKeys = historicalContext?.chronicTroubleKeys || [];
    const chronicBigrams = (profile.chronicWeakBigrams || [])
      .filter((b) => b.status === 'active')
      .map((b) => b.bigram);

    const troubleTargets = [
      ...troubleKeys.map((k) => k.toLowerCase()),
      ...chronicBigrams.map((b) => b.toLowerCase()),
    ];

    let matchingWords: string[] = [];
    if (troubleTargets.length > 0) {
      matchingWords = COMMON_WORDS.filter((w) => {
        const lower = w.toLowerCase();
        return troubleTargets.some((target) => lower.includes(target));
      });
    }

    if (matchingWords.length === 0) {
      matchingWords = COMMON_WORDS.filter((w) => /[qzxjkvbp]/i.test(w));
      if (matchingWords.length === 0) {
        matchingWords = COMMON_WORDS.slice(0, 30);
      }
    }

    const shuffled = [...matchingWords].sort(() => 0.5 - Math.random());
    const repeated = [...shuffled, ...shuffled, ...shuffled].slice(0, 75);

    setWords(repeated);
    setIsAiDrill(true);
    const targetLabel = troubleTargets.slice(0, 4).join(', ');
    setCuratedTitle(targetLabel ? `Weakness Workout (${targetLabel})` : 'Targeted Weakness Workout');
    setView('test');
    setDiagnostics(null);
    setAiFeedback(null);
  }, [historicalContext]);

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-between">
      {/* 1. Top Utility Row: Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: Branding or Status */}
        <div className="flex items-center space-x-2">
          {view === 'results' && (
            <span className="text-xs font-mono font-bold text-[#1f1610] px-3 py-1 bg-[#ede4d8] rounded-xl border border-[#d8c9b8]">
              Test Complete
            </span>
          )}
        </div>

        {/* Right: Analytics & Settings Shortcut */}
        <div className="flex items-center space-x-2 text-xs font-mono text-[#5e4f45]">
          <button
            onClick={() => setIsProfileOpen(true)}
            title="Open Longitudinal Analytics & Mastery Profile"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#d8c9b8] bg-[#ede4d8] hover:bg-[#e0d3c3] text-[#1f1610] font-semibold transition-all shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#b4692c]" />
            <span className="hidden sm:inline">Analytics & Profile</span>
          </button>

          <button
            onClick={openSettings}
            title="Application Settings"
            className="p-1.5 rounded-xl border border-[#d8c9b8] bg-[#ede4d8] hover:bg-[#e0d3c3] text-[#5e4f45] hover:text-[#1f1610] transition-all shadow-xs cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Focused Time Selector (Dropdown or Interactive Slider) */}
      {view === 'test' && (
        <div
          className={`flex justify-center mb-6 relative z-40 transition-all duration-300 ${
            isTestActive ? 'opacity-0 pointer-events-none -translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          <TimeSelector
            duration={settings.testDuration}
            onChangeDuration={handleChangeDuration}
            disabled={isTestActive}
            soundEnabled={settings.soundEnabled}
          />
        </div>
      )}

      {/* 3. Main Arena or Results */}
      <main className="my-auto py-4">
        {view === 'test' ? (
          <TypingTest
            key={testKey}
            words={words}
            duration={settings.testDuration}
            soundEnabled={settings.soundEnabled}
            showLiveWpm={settings.showLiveWpm}
            isAiDrill={isAiDrill}
            storyTitle={curatedTitle}
            storyModel={isAiDrill ? 'Gemma 4 Edge' : storyModel}
            isLoadingNewText={isGeneratingParagraph}
            isPrefetchingMore={isPrefetchingMore}
            onActiveChange={setIsTestActive}
            onFinish={handleFinishTest}
            onReset={handleResetTest}
            onGenerateCustom={handleGenerateCustomParagraph}
            onGenerateRandom={handleGenerateRandomParagraph}
            onNearEnd={handleNearEnd}
            generationError={generationError}
          />
        ) : diagnostics ? (
          <ResultsView
            diagnostics={diagnostics}
            aiFeedback={aiFeedback}
            isLoadingAi={isLoadingAi}
            historicalContext={historicalContext}
            onRestart={handleResetTest}
            onStartDrill={handleStartDrill}
            onStartWeaknessWorkout={handleStartWeaknessWorkout}
          />
        ) : null}
      </main>

      {/* 3. Three Feature Spotlight Cards */}
      {view === 'test' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 pt-8 border-t border-[#d8c9b8]">
          {/* Card 1: AI Coach */}
          <Link
            href="/coach"
            className="group p-6 bg-white border-2 border-[#d8c9b8] rounded-2xl shadow-xs hover:border-[#b4692c] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#faede0] text-[#b4692c] flex items-center justify-center mb-3">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1f1610] group-hover:text-[#b4692c] transition-colors flex items-center justify-between">
                <span>AI Biomechanics</span>
                <ChevronRight className="w-4 h-4 text-[#786558] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5e4f45] mt-2 leading-relaxed">
                Neuromuscular hand balance, pinky finger strain tracking, and latency heatmaps powered by Google Gemma 4.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#b4692c] mt-4 flex items-center space-x-1">
              <span>Inspect Diagnosis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 2: Curated Drills */}
          <Link
            href="/drills"
            className="group p-6 bg-white border-2 border-[#d8c9b8] rounded-2xl shadow-xs hover:border-[#b4692c] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#ede4d8] text-[#1f1610] flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1f1610] group-hover:text-[#b4692c] transition-colors flex items-center justify-between">
                <span>Curated Drills</span>
                <ChevronRight className="w-4 h-4 text-[#786558] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5e4f45] mt-2 leading-relaxed">
                Home row anchors, syntax patterns for programmers, tricky bigrams, and barista coffee speed runs.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#b4692c] mt-4 flex items-center space-x-1">
              <span>Browse Curriculum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Card 3: Analytics */}
          <Link
            href="/analytics"
            className="group p-6 bg-white border-2 border-[#d8c9b8] rounded-2xl shadow-xs hover:border-[#b4692c] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-[#eaf4ed] text-[#2a6f43] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#1f1610] group-hover:text-[#b4692c] transition-colors flex items-center justify-between">
                <span>Rhythm Analytics</span>
                <ChevronRight className="w-4 h-4 text-[#786558] group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-xs text-[#5e4f45] mt-2 leading-relaxed">
                Historical session progression, consistency stability scores, raw vs net WPM, and typo distributions.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#b4692c] mt-4 flex items-center space-x-1">
              <span>View History Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      )}

      {/* 4. Longitudinal Mastery & Historical Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onStartDrill={handleStartDrill}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-24 text-xs font-mono text-[#786558]">
        Loading TypoLoop Arena...
      </div>
    }>
      <PracticeArenaContent />
    </Suspense>
  );
}
