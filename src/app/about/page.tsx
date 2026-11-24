'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Coffee,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  Activity,
  Sliders,
  CheckCircle2,
  Keyboard,
  Play,
  Pause,
  RotateCcw,
  Fingerprint,
  Flame,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';
import { KEYBOARD_LAYOUT } from '@/lib/keyboard-layout';

// Switch acoustic configurations
interface SwitchProfile {
  id: 'light' | 'medium' | 'dark';
  roastName: string;
  pairingTitle: string;
  switchName: string;
  origin: string;
  tactileDesc: string;
  actuation: string;
  sound: string;
  pitch: string;
  tempo: string;
  freqHz: number;
  synthType: 'click' | 'thock' | 'thud';
  frequencyBars: number[];
}

const SWITCH_PROFILES: Record<'light' | 'medium' | 'dark', SwitchProfile> = {
  light: {
    id: 'light',
    roastName: 'Light Roast Pairing',
    pairingTitle: 'Washed Yirgacheffe',
    switchName: 'Crisp Click · 50g',
    origin: 'High Elevation (2,100m) · Washed Heirloom',
    tactileDesc:
      'Bright, crisp, and tactile. Instantaneous snap at actuation with an invigorating high-frequency click.',
    actuation: '50g Actuation',
    sound: 'Crisp Clack',
    pitch: '1,400 Hz',
    tempo: '90 – 110 WPM',
    freqHz: 1400,
    synthType: 'click',
    frequencyBars: [25, 40, 60, 95, 80, 50, 30, 15],
  },
  medium: {
    id: 'medium',
    roastName: 'Medium Roast Pairing',
    pairingTitle: 'Honey Geisha',
    switchName: 'Holy Panda Thock · 67g',
    origin: 'Boquete Panama (1,750m) · Honey Process',
    tactileDesc:
      'Substantial, rounded tactile bump followed by a warm, wooden-hollow thock. Calming and rhythmic.',
    actuation: '67g Actuation',
    sound: 'Deep Thock',
    pitch: '520 Hz',
    tempo: '70 – 90 WPM',
    freqHz: 520,
    synthType: 'thock',
    frequencyBars: [45, 90, 85, 55, 30, 20, 10, 5],
  },
  dark: {
    id: 'dark',
    roastName: 'Dark Roast Pairing',
    pairingTitle: 'Monsooned Malabar',
    switchName: 'Topre Capacitive Thud · 45g',
    origin: 'Malabar Coast, India · Monsoon Cured',
    tactileDesc:
      'Pillow-soft electro-capacitive dome collapse. Zero metallic friction, purely a muted baritone whisper.',
    actuation: '45g Actuation',
    sound: 'Muted Thud',
    pitch: '310 Hz',
    tempo: '55 – 75 WPM',
    freqHz: 310,
    synthType: 'thud',
    frequencyBars: [95, 75, 45, 25, 15, 8, 5, 2],
  },
};

// Key event record for the hesitation X-ray
interface KeyStrokeRecord {
  char: string;
  finger: string;
  hand: 'left' | 'right';
  intervalMs: number;
}

export default function AboutPage() {
  // --- 1. Sound & Switch Tester State ---
  const [activeProfile, setActiveProfile] = useState<'light' | 'medium' | 'dark'>('medium');
  const [audioMuted, setAudioMuted] = useState(false);
  const [testerInput, setTesterInput] = useState('');
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);
  const [keyPressCount, setKeyPressCount] = useState(0);
  const [liveIki, setLiveIki] = useState<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- 2. Interactive Keystroke Physics Scrubber ---
  const [keystrokeTravel, setKeystrokeTravel] = useState<number>(2.0); // 0.0 to 4.0mm

  // --- 3. Cadence Flow Metronome State ---
  const [metronomeBpm, setMetronomeBpm] = useState<number>(85);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [beatPulse, setBeatPulse] = useState(false);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [rhythmStreak, setRhythmStreak] = useState(0);
  const [rhythmAccuracy, setRhythmAccuracy] = useState<number | null>(null);
  const metronomeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBeatTimeRef = useRef<number>(0);

  // --- 4. Biomechanical Hesitation X-Ray State ---
  const [xrayWord, setXrayWord] = useState('coffee');
  const [xrayTimeline, setXrayTimeline] = useState<KeyStrokeRecord[]>([]);

  // --- 5. Typing Roast Persona Quiz State ---
  const [quizRitual, setQuizRitual] = useState<'morning' | 'focus' | 'night'>('morning');
  const [quizFeel, setQuizFeel] = useState<'thock' | 'click' | 'mute'>('thock');
  const [quizSubstrate, setQuizSubstrate] = useState<'mechanical' | 'laptop' | 'split'>('mechanical');

  // Helper: Play synthesized mechanical sound via Web Audio API
  const playSwitchAudio = useCallback(
    (profileKey: 'light' | 'medium' | 'dark' = activeProfile) => {
      if (audioMuted) return;
      try {
        if (!audioCtxRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioCtx) {
            audioCtxRef.current = new AudioCtx();
          }
        }

        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const profile = SWITCH_PROFILES[profileKey];
        // Slight organic frequency jitter (±25Hz)
        const jitter = (Math.random() - 0.5) * 50;
        const baseFreq = Math.max(120, profile.freqHz + jitter);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        if (profile.synthType === 'click') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

          filter.type = 'highpass';
          filter.frequency.setValueAtTime(750, now);

          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.06);
        } else if (profile.synthType === 'thock') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(85, now + 0.09);

          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(460, now);
          filter.Q.setValueAtTime(2.2, now);

          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.09);
        } else {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.11);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(310, now);

          gain.gain.setValueAtTime(0.17, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.11);
        }
      } catch {
        // Audio policy fallback
      }
    },
    [activeProfile, audioMuted]
  );

  // Handle virtual key click or physical keypress
  const handleKeyInteraction = (char: string) => {
    const now = performance.now();
    if (lastKeyTimeRef.current) {
      const delta = Math.round(now - lastKeyTimeRef.current);
      if (delta < 2000) setLiveIki(delta);
    }
    lastKeyTimeRef.current = now;

    setLastKeyPressed(char.toUpperCase());
    setKeyPressCount((prev) => prev + 1);
    playSwitchAudio(activeProfile);

    setTimeout(() => {
      setLastKeyPressed((cur) => (cur === char.toUpperCase() ? null : cur));
    }, 150);
  };

  // Generate Hesitation X-Ray timeline whenever xrayWord changes
  useEffect(() => {
    const chars = xrayWord.toLowerCase().split('');
    const records: KeyStrokeRecord[] = [];

    // Pre-calculate realistic intervals (80-140ms with slight variations)
    chars.forEach((c, index) => {
      const coord = KEYBOARD_LAYOUT[c];
      const finger = coord ? coord.finger.replace('_', ' ') : 'index';
      const hand = coord ? coord.hand : (index % 2 === 0 ? 'left' : 'right');
      // Consecutive keys on same finger add natural 40ms hesitation
      const prevCoord = index > 0 ? KEYBOARD_LAYOUT[chars[index - 1]] : null;
      const isSameFinger = prevCoord && coord && prevCoord.finger === coord.finger;
      const baseMs = isSameFinger ? 135 : 75 + ((c.charCodeAt(0) * 7) % 45);

      records.push({
        char: c,
        finger,
        hand,
        intervalMs: index === 0 ? 0 : baseMs,
      });
    });

    setXrayTimeline(records);
  }, [xrayWord]);

  // Metronome timer loop
  useEffect(() => {
    if (!isMetronomeRunning) {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      return;
    }

    const intervalMs = (60 / metronomeBpm) * 1000;
    lastBeatTimeRef.current = performance.now();

    metronomeTimerRef.current = setInterval(() => {
      lastBeatTimeRef.current = performance.now();
      setBeatPulse(true);
      setTimeout(() => setBeatPulse(false), 120);
    }, intervalMs);

    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
    };
  }, [isMetronomeRunning, metronomeBpm]);

  // Handle user tap on the metronome beat
  const handleMetronomeTap = () => {
    const now = performance.now();
    playSwitchAudio(activeProfile);

    if (!isMetronomeRunning) {
      setIsMetronomeRunning(true);
      setRhythmStreak(1);
      return;
    }

    const beatInterval = (60 / metronomeBpm) * 1000;
    const timeSinceLastBeat = now - lastBeatTimeRef.current;
    // Check how close to the beat (mod interval)
    const offset = Math.min(timeSinceLastBeat, Math.abs(beatInterval - timeSinceLastBeat));
    const accuracyPct = Math.max(0, Math.round(100 - (offset / (beatInterval / 2)) * 100));

    setUserTaps((prev) => [...prev.slice(-8), offset]);

    if (offset < 75) {
      setRhythmStreak((prev) => prev + 1);
      setRhythmAccuracy(accuracyPct);
    } else {
      setRhythmStreak(1);
      setRhythmAccuracy(accuracyPct);
    }
  };

  // Keystroke Physics Calculations
  const calculateForce = (travel: number) => {
    if (travel <= 1.0) return Math.round(35 + travel * 10);
    if (travel <= 2.0) return Math.round(45 + (travel - 1.0) * 17);
    if (travel <= 2.2) return Math.round(62 - (travel - 2.0) * 85);
    return Math.round(45 + (travel - 2.2) * 18);
  };

  const getKeystrokePhase = (travel: number) => {
    if (travel < 1.8) return { name: 'Phase I: Pre-Travel Drift', desc: 'Smooth downward descent before the tactile bump' };
    if (travel >= 1.8 && travel <= 2.2) return { name: 'Phase II: Actuation Cliff (Peak Tactile Bump)', desc: 'Contact leaf snaps shut at 2.0mm; keypress registered' };
    if (travel > 2.2 && travel < 3.8) return { name: 'Phase III: Post-Actuation Cushion', desc: 'Smooth travel into base housing' };
    return { name: 'Phase IV: Bottom-Out Thock', desc: 'Stem strikes base plate; acoustic resonance reverberates' };
  };

  // Compute Typing Roast Persona based on quiz answers
  const getPersonaResult = () => {
    if (quizRitual === 'morning' && quizFeel === 'thock') {
      return {
        title: 'The Kissaten Craftsman',
        subtitle: 'Pour-over & Medium Holy Panda Tactiles',
        tempo: '80–90 WPM (Rhythmic Cadence)',
        desc: 'You treat typing as an intentional morning meditation. You value deep, hollow switch thock and steady paragraph composition over frantic speed bursts.',
        presetParam: 'thock',
      };
    }
    if (quizFeel === 'click' || quizRitual === 'focus') {
      return {
        title: 'The High-Elevation Sprinter',
        subtitle: 'Washed Yirgacheffe & Crisp Snappy Snap',
        tempo: '95–115 WPM (Crisp Precision)',
        desc: 'You love immediate tactile feedback with needle-sharp auditory certainty. Perfect for fast terminal commands and brisk code composition.',
        presetParam: 'click',
      };
    }
    return {
      title: 'The Midnight Reverie Monk',
      subtitle: 'Monsooned Malabar & Topre Capacitive Dome',
      tempo: '65–80 WPM (Quiet Reflection)',
      desc: 'You prefer pure focus without distracting chatter. Soft collapsing rubber domes and smoky dark roasts anchor your nighttime writing rituals.',
      presetParam: 'thud',
    };
  };

  const currentProfile = SWITCH_PROFILES[activeProfile];
  const currentForce = calculateForce(keystrokeTravel);
  const currentPhase = getKeystrokePhase(keystrokeTravel);
  const persona = getPersonaResult();

  // Calculate hand balance for Hesitation X-Ray
  const leftCount = xrayTimeline.filter((r) => r.hand === 'left').length;
  const rightCount = xrayTimeline.filter((r) => r.hand === 'right').length;
  const totalCount = xrayTimeline.length || 1;
  const leftPct = Math.round((leftCount / totalCount) * 100);
  const rightPct = 100 - leftPct;

  return (
    <div className="w-full laid-paper-texture py-8 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-12">
        {/* ========================================================
            1. HERO: Clear, Warm, Inviting
           ======================================================== */}
        <section className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#faede0] text-[#b4692c] font-mono text-xs uppercase tracking-wider border border-[#b4692c]/20">
            <Coffee className="w-3.5 h-3.5" />
            <span>Interactive Laboratory</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl text-[#2a1e17] font-bold tracking-tight">
            Typing as a Mindful Ritual, Not a Frantic Reflex.
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#5e4f45] leading-relaxed">
            TypoLoop replaces frantic arcade timers and red buzzers with the contemplative quiet of a specialty coffeehouse. Explore the live interactive modules below to feel and hear the difference.
          </p>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-[#ddd0c2] shadow-xs">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#b4692c] block">40–60%</span>
              <span className="font-sans text-[11px] text-[#786558]">Reduced Hand Strain</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#ddd0c2] shadow-xs">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#2a6f43] block">100%</span>
              <span className="font-sans text-[11px] text-[#786558]">Local On-Device AI</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#ddd0c2] shadow-xs">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#2a1e17] block">96 kHz</span>
              <span className="font-sans text-[11px] text-[#786558]">Acoustic Synthesizer</span>
            </div>
          </div>
        </section>

        {/* ========================================================
            2. INTERACTIVE MODULE 1: LIVE VIRTUAL SWITCH SOUNDBOARD
           ======================================================== */}
        <section className="p-6 sm:p-8 bg-white rounded-3xl border border-[#ddd0c2] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#b4692c] uppercase tracking-wider font-semibold">
                <Keyboard className="w-4 h-4" />
                <span>Interactive Playground 01</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2a1e17] mt-0.5">
                Live Mechanical Switch Soundboard
              </h2>
            </div>

            {/* Mute toggle */}
            <button
              type="button"
              onClick={() => setAudioMuted(!audioMuted)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ddd0c2] text-xs font-mono text-[#786558] hover:text-[#2a1e17] hover:bg-[#f5efeb] transition-all cursor-pointer self-start sm:self-auto"
            >
              {audioMuted ? <VolumeX className="w-3.5 h-3.5 text-[#b9382b]" /> : <Volume2 className="w-3.5 h-3.5 text-[#b4692c]" />}
              <span>{audioMuted ? 'Acoustics Muted' : 'Acoustics Active'}</span>
            </button>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#5e4f45] leading-relaxed">
            Click the keycaps below or type directly on your physical keyboard to test the synthesized acoustics in real time. Notice how each roast profile shifts pitch and resonance.
          </p>

          {/* Switch Profile Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-[#f5efeb] rounded-2xl">
            {(['light', 'medium', 'dark'] as const).map((key) => {
              const p = SWITCH_PROFILES[key];
              const isSelected = activeProfile === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveProfile(key);
                    playSwitchAudio(key);
                  }}
                  className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#2a1e17] shadow-xs border border-[#ddd0c2]'
                      : 'text-[#786558] hover:text-[#2a1e17] hover:bg-[#efe6dd]/60'
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#b4692c] font-semibold block">
                    {p.roastName}
                  </span>
                  <span className="font-serif text-sm font-bold text-[#2a1e17] block">
                    {p.switchName}
                  </span>
                  <span className="font-mono text-[11px] text-[#786558] block mt-0.5">
                    {p.pitch} · {p.sound}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Keyboard Keypad Matrix */}
          <div className="p-5 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60 space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((letter) => {
                const isPressed = lastKeyPressed === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleKeyInteraction(letter)}
                    className={`w-10 sm:w-12 h-11 sm:h-12 rounded-xl font-mono text-sm sm:text-base font-bold transition-all cursor-pointer flex items-center justify-center select-none ${
                      isPressed
                        ? 'bg-[#b4692c] text-white translate-y-1 shadow-inner border-b-0'
                        : 'bg-[#efe6dd] hover:bg-[#ece2d5] text-[#2a1e17] border border-[#ddd0c2] border-b-[3px] border-b-[#d8c9b9] active:translate-y-1 active:border-b-0'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* Spacebar Keycap */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => handleKeyInteraction('SPACE')}
                className={`w-48 sm:w-64 h-10 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center select-none ${
                  lastKeyPressed === 'SPACE'
                    ? 'bg-[#b4692c] text-white translate-y-1 shadow-inner border-b-0'
                    : 'bg-[#efe6dd] hover:bg-[#ece2d5] text-[#786558] border border-[#ddd0c2] border-b-[3px] border-b-[#d8c9b9] active:translate-y-1 active:border-b-0'
                }`}
              >
                Spacebar
              </button>
            </div>

            {/* Type-anywhere input field */}
            <div className="pt-2">
              <input
                type="text"
                placeholder="Or click here and type anything on your keyboard to hear live switches..."
                value={testerInput}
                onChange={(e) => setTesterInput(e.target.value)}
                onKeyDown={(e) => handleKeyInteraction(e.key)}
                className="w-full px-4 py-2.5 bg-white border border-[#ddd0c2] rounded-xl font-mono text-xs text-[#2a1e17] placeholder:text-[#786558]/70 focus:outline-none focus:ring-1 focus:ring-[#b4692c]"
              />
            </div>

            {/* Live Telemetry Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono text-[#786558] border-t border-[#ddd0c2]/40">
              <div className="flex items-center gap-4">
                <span>Strokes: <strong className="text-[#2a1e17]">{keyPressCount}</strong></span>
                <span>Active Profile: <strong className="text-[#b4692c]">{currentProfile.switchName}</strong></span>
              </div>
              <div>
                <span>Latest Interval: <strong className="text-[#2a6f43]">{liveIki ? `${liveIki} ms` : '—'}</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            3. INTERACTIVE MODULE 2: CADENCE FLOW METRONOME & ESPRESSO
           ======================================================== */}
        <section className="p-6 sm:p-8 bg-white rounded-3xl border border-[#ddd0c2] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#b4692c] uppercase tracking-wider font-semibold">
                <Activity className="w-4 h-4" />
                <span>Interactive Playground 02</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2a1e17] mt-0.5">
                Cadence Flow Metronome
              </h2>
            </div>

            {/* Tempo Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-[#f5efeb] rounded-xl self-start sm:self-auto border border-[#ddd0c2]/50 text-xs font-mono">
              {[
                { bpm: 60, label: '60 BPM (Adagio)' },
                { bpm: 85, label: '85 BPM (Moderato)' },
                { bpm: 110, label: '110 BPM (Allegro)' },
              ].map(({ bpm, label }) => (
                <button
                  key={bpm}
                  type="button"
                  onClick={() => {
                    setMetronomeBpm(bpm);
                    setRhythmStreak(0);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    metronomeBpm === bpm
                      ? 'bg-white text-[#2a1e17] shadow-xs font-bold'
                      : 'text-[#786558] hover:text-[#2a1e17]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#5e4f45] leading-relaxed">
            Typing at a steady tempo prevents subconscious hand tension. Click <strong>&ldquo;Start Metronome&rdquo;</strong>, then tap the button or press Spacebar on the beat to fill the espresso cup with steaming crema!
          </p>

          {/* Metronome Arena & Cup Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center p-6 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60">
            {/* Left: Metronome Pulse Controller */}
            <div className="sm:col-span-7 flex flex-col items-center sm:items-start space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMetronomeRunning(!isMetronomeRunning);
                    if (!isMetronomeRunning) setRhythmStreak(0);
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isMetronomeRunning
                      ? 'bg-[#2a1e17] text-white hover:bg-[#b4692c]'
                      : 'bg-[#b4692c] text-white hover:bg-[#9c551e]'
                  }`}
                >
                  {isMetronomeRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isMetronomeRunning ? 'Pause Metronome' : 'Start Metronome'}</span>
                </button>

                {/* Pulsing Tempo Orb */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full transition-all duration-100 ${
                      beatPulse
                        ? 'bg-[#b4692c] scale-125 shadow-md shadow-[#b4692c]/50'
                        : 'bg-[#ddd0c2] scale-100'
                    }`}
                  />
                  <span className="font-mono text-xs text-[#786558]">{metronomeBpm} BPM</span>
                </div>
              </div>

              {/* Big Tap Tempo Button */}
              <button
                type="button"
                onClick={handleMetronomeTap}
                className="w-full sm:w-64 py-4 px-6 rounded-2xl bg-[#faede0] hover:bg-[#faede0]/80 active:scale-98 border-2 border-[#b4692c] font-mono text-sm font-bold text-[#b4692c] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 select-none"
              >
                <Zap className="w-4 h-4" />
                <span>TAP ON THE BEAT</span>
              </button>

              <div className="flex items-center gap-4 text-xs font-mono text-[#786558]">
                <span>Rhythm Streak: <strong className="text-[#b4692c] text-sm">{rhythmStreak}</strong></span>
                <span>Accuracy: <strong className="text-[#2a6f43] text-sm">{rhythmAccuracy ? `${rhythmAccuracy}%` : '—'}</strong></span>
              </div>
            </div>

            {/* Right: Steaming Ceramic Cup Fill Graphic */}
            <div className="sm:col-span-5 bg-white p-5 rounded-2xl border border-[#ddd0c2]/60 text-center space-y-2">
              <span className="font-mono text-[11px] text-[#786558] uppercase tracking-wider block">
                Crema Flow State
              </span>

              <div className="relative w-28 h-24 mx-auto flex items-end justify-center">
                {/* Ceramic Coffee Mug SVG */}
                <svg className="w-24 h-24" viewBox="0 0 100 100">
                  {/* Mug Body */}
                  <rect x="20" y="30" width="55" height="55" rx="8" fill="#f5efeb" stroke="#2a1e17" strokeWidth="2.5" />
                  {/* Handle */}
                  <path d="M 75,40 C 92,40 92,75 75,75" fill="none" stroke="#2a1e17" strokeWidth="2.5" />

                  {/* Dynamic Coffee Fill Level (based on rhythm streak, up to 10) */}
                  {(() => {
                    const fillLevel = Math.min(10, rhythmStreak);
                    const fillHeight = (fillLevel / 10) * 45;
                    const fillY = 82 - fillHeight;
                    return (
                      fillHeight > 0 && (
                        <rect
                          x="23"
                          y={fillY}
                          width="49"
                          height={fillHeight}
                          rx="4"
                          fill="#b4692c"
                          className="transition-all duration-300"
                        />
                      )
                    );
                  })()}

                  {/* Steam trails when streak >= 5 */}
                  {rhythmStreak >= 5 && (
                    <g className="animate-pulse">
                      <path d="M 38,22 Q 42,12 38,5" stroke="#b4692c" strokeWidth="1.5" fill="none" opacity="0.6" />
                      <path d="M 52,22 Q 48,12 52,5" stroke="#b4692c" strokeWidth="1.5" fill="none" opacity="0.8" />
                    </g>
                  )}
                </svg>
              </div>

              <div className="text-xs font-mono">
                {rhythmStreak >= 10 ? (
                  <span className="text-[#2a6f43] font-bold block">
                    ✨ Perfect Harmonic Flow!
                  </span>
                ) : (
                  <span className="text-[#786558] block">
                    {rhythmStreak === 0 ? 'Tap to start brewing' : `Brewing: ${rhythmStreak}/10 on-beat`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            4. INTERACTIVE MODULE 3: BIOMECHANICAL HESITATION X-RAY
           ======================================================== */}
        <section className="p-6 sm:p-8 bg-white rounded-3xl border border-[#ddd0c2] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#b4692c] uppercase tracking-wider font-semibold">
                <Fingerprint className="w-4 h-4" />
                <span>Interactive Playground 03</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2a1e17] mt-0.5">
                Biomechanical Hesitation X-Ray
              </h2>
            </div>

            {/* Quick Word Selectors */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-[#786558] mr-1">Presets:</span>
              {['coffee', 'cadence', 'mechanical', 'flow'].map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => setXrayWord(word)}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    xrayWord === word
                      ? 'bg-[#b4692c] text-white border-[#b4692c]'
                      : 'bg-[#f5efeb] text-[#786558] border-[#ddd0c2] hover:text-[#2a1e17]'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#5e4f45] leading-relaxed">
            TypoLoop measures the millisecond gaps between physical keystrokes (IKI) to spot finger overwork and hesitation. Type any custom word below to see your finger and bilateral hand load map out.
          </p>

          {/* Word Input */}
          <div className="max-w-xs">
            <input
              type="text"
              value={xrayWord}
              maxLength={12}
              onChange={(e) => setXrayWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
              placeholder="Type a word..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#fbf8f3] border border-[#ddd0c2] font-mono text-sm text-[#2a1e17] focus:outline-none focus:ring-1 focus:ring-[#b4692c]"
            />
          </div>

          {/* Connected Keystroke Timeline */}
          <div className="p-5 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60 space-y-5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-start">
              {xrayTimeline.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-3">
                  {/* Keystroke node */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-base shadow-xs border ${
                        item.hand === 'left'
                          ? 'bg-[#faede0] text-[#b4692c] border-[#b4692c]/40'
                          : 'bg-[#eaf4ed] text-[#2a6f43] border-[#2a6f43]/40'
                      }`}
                    >
                      {item.char.toUpperCase()}
                    </div>
                    <span className="font-mono text-[9px] text-[#786558] mt-1 capitalize text-center w-14 truncate">
                      {item.finger}
                    </span>
                  </div>

                  {/* Delay arrow to next key */}
                  {idx < xrayTimeline.length - 1 && (
                    <div className="flex flex-col items-center justify-center text-[10px] font-mono text-[#786558]">
                      <span className="text-[#b4692c] font-bold">{xrayTimeline[idx + 1].intervalMs}ms</span>
                      <span className="text-[#ddd0c2]">──►</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bilateral Hand Load Symmetry Bar */}
            <div className="space-y-1.5 pt-3 border-t border-[#ddd0c2]/50">
              <div className="flex justify-between text-xs font-mono text-[#786558]">
                <span className="text-[#b4692c] font-semibold">Left Hand: {leftPct}%</span>
                <span>Bilateral Balance</span>
                <span className="text-[#2a6f43] font-semibold">Right Hand: {rightPct}%</span>
              </div>
              <div className="w-full h-3 bg-[#eaf4ed] rounded-full overflow-hidden flex">
                <div className="bg-[#b4692c] h-full transition-all duration-300" style={{ width: `${leftPct}%` }} />
                <div className="bg-[#2a6f43] h-full transition-all duration-300" style={{ width: `${rightPct}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. INTERACTIVE MODULE 4: FORCE CURVE SCRUBBER & SWITCH CUTAWAY
           ======================================================== */}
        <section className="p-6 sm:p-8 bg-white rounded-3xl border border-[#ddd0c2] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#b4692c] uppercase tracking-wider font-semibold">
                <Sliders className="w-4 h-4" />
                <span>Interactive Playground 04</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2a1e17] mt-0.5">
                Mechanical Switch Travel &amp; Force Curve
              </h2>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs text-[#786558] block">Live Travel Scrubber</span>
              <span className="font-mono text-sm font-bold text-[#b4692c]">
                {keystrokeTravel.toFixed(1)} mm · {currentForce} cN
              </span>
            </div>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#5e4f45] leading-relaxed">
            Drag the slider below to simulate pushing a mechanical switch down from rest to bottom-out. Observe the contact leaf close and trigger keypress registration at exactly 2.0mm.
          </p>

          {/* Interactive Travel Slider */}
          <div className="space-y-2 p-4 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60">
            <div className="flex justify-between items-center text-xs font-mono text-[#786558]">
              <span>Rest (0.0mm)</span>
              <span className="text-[#b4692c] font-bold">Actuation Peak (2.0mm)</span>
              <span>Bottom-Out (4.0mm)</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="0.1"
              value={keystrokeTravel}
              onChange={(e) => setKeystrokeTravel(parseFloat(e.target.value))}
              className="w-full accent-[#b4692c] cursor-pointer"
            />
          </div>

          {/* Dual Panel: Force Curve SVG + Animated Cutaway */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Force Curve Graph */}
            <div className="md:col-span-8 bg-[#fbf8f3] p-4 rounded-2xl border border-[#ddd0c2]/60 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                <span className="text-[#786558]">Force-Displacement (cN vs. mm)</span>
                <span className="font-semibold text-[#b4692c] bg-[#faede0] px-2 py-0.5 rounded-md border border-[#b4692c]/20 self-start sm:self-auto">
                  {currentPhase.name}
                </span>
              </div>

              <div className="w-full h-44 relative bg-white rounded-xl p-3 border border-[#ddd0c2]/50 shadow-inner">
                <svg className="w-full h-full" viewBox="0 0 280 130">
                  <line stroke="#ddd0c2" strokeDasharray="2 2" strokeWidth="0.5" x1="30" x2="260" y1="20" y2="20" />
                  <line stroke="#ddd0c2" strokeDasharray="2 2" strokeWidth="0.5" x1="30" x2="260" y1="55" y2="55" />
                  <line stroke="#ddd0c2" strokeDasharray="2 2" strokeWidth="0.5" x1="30" x2="260" y1="90" y2="90" />
                  <line stroke="#ddd0c2" strokeWidth="1" x1="30" x2="260" y1="110" y2="110" />
                  <line stroke="#ddd0c2" strokeWidth="1" x1="30" x2="30" y1="15" y2="110" />

                  <text fill="#786558" fontFamily="monospace" fontSize="8" x="25" y="122">0mm</text>
                  <text fill="#786558" fontFamily="monospace" fontSize="8" x="140" y="122">2.0mm</text>
                  <text fill="#786558" fontFamily="monospace" fontSize="8" x="245" y="122">4.0mm</text>
                  <text fill="#786558" fontFamily="monospace" fontSize="8" x="5" y="23">80cN</text>
                  <text fill="#786558" fontFamily="monospace" fontSize="8" x="5" y="58">50cN</text>
                  <text fill="#786558" fontFamily="monospace" fontSize="8" x="5" y="93">30cN</text>

                  {/* Tactile Switch Curve */}
                  <path
                    d="M 30,100 C 65,95 110,90 145,35 C 155,75 165,75 190,65 C 220,55 240,40 260,20"
                    fill="none"
                    stroke="#2a1e17"
                    strokeWidth="2.5"
                  />

                  {/* Scrubber indicator */}
                  {(() => {
                    const scrubberX = 30 + (keystrokeTravel / 4.0) * 230;
                    const scrubberY = 110 - (currentForce / 80.0) * 90;
                    return (
                      <>
                        <line
                          x1={scrubberX}
                          x2={scrubberX}
                          y1="15"
                          y2="110"
                          stroke="#b4692c"
                          strokeDasharray="2 2"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={scrubberX}
                          cy={scrubberY}
                          r="5"
                          fill="#b4692c"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>

              <p className="font-sans text-xs text-[#5e4f45] italic">
                {currentPhase.desc}
              </p>
            </div>

            {/* Switch Cutaway Visual */}
            <div className="md:col-span-4 bg-[#fbf8f3] p-4 rounded-2xl border border-[#ddd0c2]/60 text-center space-y-2">
              <span className="font-mono text-[11px] text-[#786558] uppercase tracking-wider block">
                Switch Cutaway
              </span>

              <div className="w-full h-36 flex items-center justify-center">
                <svg className="w-28 h-28" viewBox="0 0 100 100">
                  <rect fill="#ffffff" stroke="#2a1e17" strokeWidth="2" x="18" y="40" width="64" height="48" rx="4" />
                  <rect fill="#efe6dd" x="22" y="44" width="56" height="40" rx="2" />
                  <rect fill="#2a1e17" x="10" y="88" width="80" height="6" rx="2" />

                  {/* Moving Stem */}
                  {(() => {
                    const stemY = 15 + (keystrokeTravel / 4.0) * 24;
                    const isActuated = keystrokeTravel >= 2.0;
                    return (
                      <g transform={`translate(0, ${stemY})`}>
                        <path
                          d="M 22,0 L 78,0 L 72,20 L 28,20 Z"
                          fill="#fff8f5"
                          stroke="#2a1e17"
                          strokeWidth="2"
                        />
                        <rect fill="#b4692c" x="44" y="20" width="12" height="24" rx="2" stroke="#2a1e17" strokeWidth="1.5" />
                        {isActuated && (
                          <circle cx="50" cy="10" r="3" fill="#2a6f43" />
                        )}
                      </g>
                    );
                  })()}

                  <path
                    d={`M 44,70 Q 56,73 44,76 Q 56,79 44,82`}
                    fill="none"
                    stroke="#b4692c"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div className="pt-2 border-t border-[#ddd0c2]/60 text-xs font-mono">
                {keystrokeTravel >= 2.0 ? (
                  <span className="text-[#2a6f43] font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Keypress Registered
                  </span>
                ) : (
                  <span className="text-[#786558]">Awaiting Actuation</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            6. INTERACTIVE MODULE 5: TYPING ROAST PERSONA FINDER
           ======================================================== */}
        <section className="p-6 sm:p-8 bg-white rounded-3xl border border-[#ddd0c2] shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#b4692c] uppercase tracking-wider font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Playground 05</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#2a1e17]">
            Discover Your Typing Roast Persona
          </h2>

          <p className="font-sans text-xs sm:text-sm text-[#5e4f45] leading-relaxed">
            Answer 3 quick preferences to unveil your custom ergonomic typing persona and recommended acoustic preset.
          </p>

          {/* 3 Step Interactive Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Question 1: Ritual */}
            <div className="p-4 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60 space-y-2.5">
              <span className="font-mono text-[11px] font-bold text-[#2a1e17] uppercase tracking-wider block">
                1. Writing Ritual
              </span>
              {[
                { id: 'morning', label: '🌅 Morning Stillness', desc: 'Essays & Coffee' },
                { id: 'focus', label: '⚡ Deep Focus Sprints', desc: 'Coding & Terminal' },
                { id: 'night', label: '🌙 Midnight Reverie', desc: 'Journal & Notes' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQuizRitual(opt.id as any)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    quizRitual === opt.id
                      ? 'bg-white border-[#b4692c] shadow-xs text-[#2a1e17]'
                      : 'bg-transparent border-[#ddd0c2]/60 text-[#786558] hover:bg-white/60'
                  }`}
                >
                  <span className="font-serif text-xs font-bold block">{opt.label}</span>
                  <span className="font-mono text-[10px] text-[#786558]">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Question 2: Haptic Feel */}
            <div className="p-4 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60 space-y-2.5">
              <span className="font-mono text-[11px] font-bold text-[#2a1e17] uppercase tracking-wider block">
                2. Soundscape
              </span>
              {[
                { id: 'thock', label: '🪵 Deep Thock', desc: 'Warm & Hollow' },
                { id: 'click', label: '🔔 Crisp Clack', desc: 'Sharp & Precise' },
                { id: 'mute', label: '☁️ Muted Whisper', desc: 'Pillow-soft Dome' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setQuizFeel(opt.id as any);
                    playSwitchAudio(opt.id === 'click' ? 'light' : opt.id === 'mute' ? 'dark' : 'medium');
                  }}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    quizFeel === opt.id
                      ? 'bg-white border-[#b4692c] shadow-xs text-[#2a1e17]'
                      : 'bg-transparent border-[#ddd0c2]/60 text-[#786558] hover:bg-white/60'
                  }`}
                >
                  <span className="font-serif text-xs font-bold block">{opt.label}</span>
                  <span className="font-mono text-[10px] text-[#786558]">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Question 3: Substrate */}
            <div className="p-4 bg-[#fbf8f3] rounded-2xl border border-[#ddd0c2]/60 space-y-2.5">
              <span className="font-mono text-[11px] font-bold text-[#2a1e17] uppercase tracking-wider block">
                3. Primary Keyboard
              </span>
              {[
                { id: 'mechanical', label: '⌨️ Mechanical Board', desc: 'Custom PBT & Brass' },
                { id: 'laptop', label: '💻 Laptop Chiclet', desc: 'MacBook scissor-switch' },
                { id: 'split', label: '🪓 Ergonomic Split', desc: 'Ortholinear / Alice' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQuizSubstrate(opt.id as any)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    quizSubstrate === opt.id
                      ? 'bg-white border-[#b4692c] shadow-xs text-[#2a1e17]'
                      : 'bg-transparent border-[#ddd0c2]/60 text-[#786558] hover:bg-white/60'
                  }`}
                >
                  <span className="font-serif text-xs font-bold block">{opt.label}</span>
                  <span className="font-mono text-[10px] text-[#786558]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Persona Reveal Card */}
          <div className="p-6 bg-[#faede0]/60 rounded-2xl border border-[#b4692c]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#b4692c] font-bold">
                Your Calibrated Persona
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2a1e17]">
                {persona.title}
              </h3>
              <p className="font-mono text-xs text-[#b4692c] font-semibold">
                {persona.subtitle} · Recommended Cadence: {persona.tempo}
              </p>
              <p className="font-sans text-xs text-[#5e4f45] max-w-lg pt-1">
                {persona.desc}
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#2a1e17] text-white font-mono text-xs font-semibold hover:bg-[#b4692c] transition-colors shadow-sm shrink-0"
            >
              <span>Practice This Preset</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ========================================================
            7. LOCAL PRIVACY ARCHITECTURE & FOOTER CALLOUT
           ======================================================== */}
        <section className="p-6 bg-[#fbf8f3] rounded-3xl border border-[#ddd0c2] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eaf4ed] text-[#2a6f43] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#2a1e17]">
                Local Edge Privacy: Google Gemma 4 on Apple Silicon
              </h4>
              <p className="font-sans text-xs text-[#786558]">
                Every millisecond interval and hesitation metric stays strictly in your machine’s memory. Zero cloud data harvesting.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b4692c] text-white font-mono text-xs font-semibold hover:bg-[#9c551e] transition-colors shadow-xs shrink-0"
          >
            <span>Enter Typing Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
