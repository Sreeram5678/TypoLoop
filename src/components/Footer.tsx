'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, Cpu, Heart, Sparkles, Command } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();

  const handleResetHome = () => {
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('reset-typoloop-home'));
    }
  };

  return (
    <footer className="w-full border-t border-[#ddd0c2] bg-[#f5efeb]/80 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Philosophy */}
          <div className="md:col-span-2 space-y-3">
            <Link
              href="/"
              onClick={handleResetHome}
              className="inline-flex items-center space-x-2.5 group focus:outline-none cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-[#c87d32] text-white flex items-center justify-center group-hover:bg-[#b4692c] transition-colors">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="font-serif text-lg font-bold text-[#2a1e17] group-hover:text-[#b4692c] transition-colors">
                Typo<span className="text-[#c87d32]">Loop</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#efe6dd] border border-[#ddd0c2] text-[#786558]">
                Coffeehouse Edition
              </span>
            </Link>
            <p className="text-xs text-[#786558] leading-relaxed max-w-md">
              A distraction-free, light-roast touch typing environment engineered for cognitive quiet. 
              Powered by Google Gemma 4 on Apple Silicon to track inter-keystroke intervals (IKI), 
              finger fatigue, and biomechanical typing health.
            </p>
            <div className="flex items-center space-x-4 text-xs font-mono text-[#786558] pt-1">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#c87d32]" />
                <span>Google Gemma 4 Edge</span>
              </span>
              <span>•</span>
              <span>Apple Silicon Metal</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#2a1e17] mb-3">
              Explore Suite
            </h4>
            <ul className="space-y-2 text-xs font-mono text-[#786558]">
              <li>
                <Link
                  href="/"
                  onClick={handleResetHome}
                  className="hover:text-[#c87d32] transition-colors"
                >
                  Typing Arena (Practice)
                </Link>
              </li>
              <li>
                <Link href="/coach" className="hover:text-[#c87d32] transition-colors">
                  AI Biomechanics Coach
                </Link>
              </li>
              <li>
                <Link href="/drills" className="hover:text-[#c87d32] transition-colors">
                  Curated Coffee Drills
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-[#c87d32] transition-colors">
                  Speed & Rhythm Analytics
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#c87d32] transition-colors">
                  Architecture & Philosophy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Keyboard Shortcuts */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#2a1e17] mb-3 flex items-center space-x-1.5">
              <Command className="w-3.5 h-3.5 text-[#c87d32]" />
              <span>Key Shortcuts</span>
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[#786558]">
                <span>Restart Test</span>
                <kbd className="px-2 py-0.5 bg-[#efe6dd] border border-[#ddd0c2] text-[#2a1e17] rounded text-[11px] font-semibold">
                  Tab
                </kbd>
              </div>
              <div className="flex items-center justify-between text-[#786558]">
                <span>Reset to Start</span>
                <kbd className="px-2 py-0.5 bg-[#efe6dd] border border-[#ddd0c2] text-[#2a1e17] rounded text-[11px] font-semibold">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between text-[#786558]">
                <span>Advance Word</span>
                <kbd className="px-2 py-0.5 bg-[#efe6dd] border border-[#ddd0c2] text-[#2a1e17] rounded text-[11px] font-semibold">
                  Space
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#ddd0c2] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#786558] gap-3">
          <p>
            &copy; 2026 TypoLoop. Handcrafted for typists, writers, and engineers.
          </p>
          <div className="flex items-center space-x-1">
            <span>Brewed with</span>
            <Coffee className="w-3.5 h-3.5 text-[#c87d32] mx-0.5 inline" />
            <span>and zero latency</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
