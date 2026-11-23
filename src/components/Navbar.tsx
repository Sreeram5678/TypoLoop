'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Coffee,
  Keyboard,
  Brain,
  BookOpen,
  Activity,
  Info,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Menu,
  X,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getMasteryProfile } from '@/lib/storage';

const NAV_LINKS = [
  { href: '/', label: 'Practice', icon: Keyboard },
  { href: '/coach', label: 'AI Coach', icon: Brain, badge: 'Gemma' },
  { href: '/drills', label: 'Drills', icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: Activity },
  { href: '/about', label: 'About', icon: Info },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, toggleSound, openSettings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bestWpm, setBestWpm] = useState<number>(0);

  const handleHomeNavigation = (e: React.MouseEvent) => {
    setMobileMenuOpen(false);
    if (pathname === '/') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('typoloop:reset-to-start'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    try {
      const profile = getMasteryProfile();
      if (profile?.personalBests?.bestWpm) {
        setBestWpm(Math.round(profile.personalBests.bestWpm));
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  const modelLabel =
    settings.modelProvider === 'ollama_gemma4_e2b'
      ? 'Gemma 4 E2B'
      : settings.modelProvider === 'ollama_gemma2_2b'
      ? 'Gemma 2 2B'
      : 'Google AI Studio';

  return (
    <header className="sticky top-2 sm:top-3 z-40 w-full px-3 sm:px-6 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto rounded-2xl sm:rounded-full bg-[#fbf8f3]/85 backdrop-blur-md border border-[#ddd0c2]/80 shadow-[0_4px_24px_rgba(42,30,23,0.06)] px-3.5 sm:px-5 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Coffeehouse Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            onClick={() => {
              if (pathname === '/') {
                window.dispatchEvent(new CustomEvent('reset-typoloop-home'));
              }
            }}
            className="flex items-center gap-2.5 group focus:outline-none transition-transform active:scale-98 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#2a1e17] flex items-center justify-center text-white shadow-[0_2px_6px_rgba(42,30,23,0.2)] group-hover:bg-[#b4692c] transition-colors">
              <Coffee className="w-4 h-4 text-[#faede0] transition-transform group-hover:rotate-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-[#2a1e17] leading-none group-hover:text-[#b4692c] transition-colors">
                Typo<span className="text-[#b4692c]">Loop</span>
              </span>
            </div>
          </Link>
          <span className="hidden xl:inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#efe6dd]/80 text-[#786558] font-mono text-[10px] tracking-wider uppercase border border-[#ddd0c2]/60 font-semibold">
            Light Roast
          </span>
        </div>

        {/* Center Floating Navigation Pill Group */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-[#efe6dd]/70 border border-[#ddd0c2]/60 backdrop-blur-xs">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.href === '/' && pathname === '/') {
                    window.dispatchEvent(new CustomEvent('reset-typoloop-home'));
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs transition-all ${
                  isActive
                    ? 'bg-white text-[#2a1e17] font-semibold shadow-[0_1px_3px_rgba(42,30,23,0.08)] border border-[#ddd0c2]/40'
                    : 'text-[#786558] hover:text-[#2a1e17] hover:bg-white/60 font-medium'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 transition-colors ${
                    isActive ? 'text-[#b4692c]' : 'text-[#786558]'
                  }`}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#faede0] text-[#b4692c] font-mono text-[9px] uppercase tracking-wider font-bold border border-[#b4692c]/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions & Status Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Gemma AI Live Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#efe6dd]/80 border border-[#ddd0c2]/60 text-[#2a1e17] shadow-xs text-xs font-mono font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <span className="truncate max-w-[120px]">{modelLabel}</span>
          </div>

          {/* Mechanical Switch Sound Toggle Pill */}
          <button
            onClick={toggleSound}
            title={
              settings.soundEnabled
                ? 'Mute Mechanical Switch Click'
                : 'Unmute Mechanical Switch Click'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efe6dd]/80 hover:bg-[#efe6dd] border border-[#ddd0c2]/60 text-[#786558] hover:text-[#2a1e17] transition-all shadow-xs active:translate-y-0.5 focus:outline-none"
            type="button"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#b4692c]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#786558]" />
            )}
            <span className="hidden xl:inline font-mono text-xs tracking-wider uppercase font-medium">
              {settings.soundEnabled ? 'Espresso Thock' : 'Muted'}
            </span>
          </button>

          {/* Tactile 3D Keycap Settings Button */}
          <button
            onClick={openSettings}
            title="Application Settings"
            className="w-9 h-9 rounded-xl bg-[#efe6dd] hover:bg-[#f5efeb] border border-[#ddd0c2] text-[#5e4f45] hover:text-[#2a1e17] flex items-center justify-center shadow-[0_2px_0_#d8c9b9] active:translate-y-0.5 active:shadow-none transition-all focus:outline-none"
            type="button"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Profile / Flow Speed Badge */}
          <div className="hidden 2xl:flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-[#efe6dd]/80 border border-[#ddd0c2]/60 shadow-xs">
            <div className="w-7 h-7 rounded-full bg-[#2a1e17] text-[#fbf8f3] flex items-center justify-center font-mono text-[10px] font-bold">
              TL
            </div>
            <span className="font-mono text-xs font-bold text-[#b4692c]">
              {bestWpm > 0 ? `${bestWpm} WPM` : 'Flow'}
            </span>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl border border-[#ddd0c2] bg-[#efe6dd]/80 text-[#2a1e17] flex items-center justify-center active:scale-95 transition-all focus:outline-none"
            type="button"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto rounded-2xl bg-[#fbf8f3]/95 backdrop-blur-md border border-[#ddd0c2] shadow-[0_8px_30px_rgba(42,30,23,0.08)] p-3 space-y-1.5 transition-all">
          {NAV_LINKS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item.href === '/' && pathname === '/') {
                    window.dispatchEvent(new CustomEvent('reset-typoloop-home'));
                  }
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#2a1e17] font-semibold shadow-xs border border-[#ddd0c2]'
                    : 'text-[#786558] hover:bg-[#efe6dd]/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-[#b4692c]' : 'text-[#786558]'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#faede0] text-[#b4692c] font-bold rounded-full border border-[#b4692c]/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-[#ddd0c2]/60 flex items-center justify-between text-xs font-mono text-[#786558] px-1">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>{modelLabel}</span>
            </div>
            <span className="text-[#b4692c] font-semibold">
              {settings.soundEnabled ? 'Espresso Thock' : 'Muted'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
