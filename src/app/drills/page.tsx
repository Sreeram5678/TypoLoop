'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Target,
  ArrowRight,
} from 'lucide-react';

interface DrillPack {
  id: string;
  category: 'coffee' | 'foundations' | 'bigrams' | 'coding' | 'numbers';
  title: string;
  description: string;
  difficulty: 'Gentle' | 'Steady' | 'Brisk' | 'Master';
  wpmTarget: number;
  wordCount: number;
  focusKeys: string[];
  words: string[];
}

const DRILL_PACKS: DrillPack[] = [
  // 1. Coffee Themes
  {
    id: 'coffee_pour_over',
    category: 'coffee',
    title: 'The Pour-Over Ritual',
    description: 'Rhythmic, meditative stream of pour-over terminology, brewing flow, and tasting notes.',
    difficulty: 'Steady',
    wpmTarget: 65,
    wordCount: 38,
    focusKeys: ['p', 'o', 'u', 'r', 'b', 'l', 'm', 'w'],
    words: [
      'water', 'heated', 'precisely', 'ninety', 'two', 'degrees', 'gently', 'blooms',
      'freshly', 'ground', 'beans', 'aromatics', 'rise', 'jasmine', 'candied', 'citrus',
      'warm', 'brown', 'sugar', 'stream', 'draws', 'down', 'smoothly', 'glass',
      'carafe', 'completing', 'deliberate', 'focus', 'morning', 'calm', 'ritual'
    ],
  },
  {
    id: 'coffee_espresso_pull',
    category: 'coffee',
    title: 'The 9-Bar Espresso Pull',
    description: 'High-burst speed passage targeting crisp punctuation, numbers, and dense consonants.',
    difficulty: 'Brisk',
    wpmTarget: 80,
    wordCount: 35,
    focusKeys: ['e', 'x', 't', 'r', 'a', 'c', '9', 'b'],
    words: [
      'nine', 'bars', 'pressure', 'force', 'heated', 'water', 'through', 'finely',
      'compacted', 'puck', 'twenty', 'seven', 'seconds', 'rich', 'hazelnut', 'crema',
      'forms', 'atop', 'velvety', 'extraction', 'balancing', 'brisk', 'fruit', 'acidity',
      'deep', 'bittersweet', 'chocolate', 'flavor'
    ],
  },
  {
    id: 'coffee_highland_terroir',
    category: 'coffee',
    title: 'Highland Terroir Lore',
    description: 'Fluid narrative prose exploring Ethiopian high-altitude volcanic soil and heirloom cultivars.',
    difficulty: 'Steady',
    wpmTarget: 70,
    wordCount: 36,
    focusKeys: ['h', 'i', 'g', 'l', 'a', 'n', 'd', 't'],
    words: [
      'grown', 'beneath', 'dense', 'forest', 'canopies', 'two', 'thousand', 'meters',
      'above', 'sea', 'level', 'heirloom', 'varietals', 'mature', 'slowly', 'under',
      'gentle', 'equatorial', 'mist', 'handpicked', 'cherries', 'develop', 'profound',
      'floral', 'complexity', 'crisp', 'bergamot', 'sweetness'
    ],
  },

  // 2. Foundations & Ergonomics
  {
    id: 'foundations_home_row',
    category: 'foundations',
    title: 'Home Row Anchor (ASDF JKL;)',
    description: 'Pure muscle-memory calibration for tactile home row index finger anchor points (F and J).',
    difficulty: 'Gentle',
    wpmTarget: 40,
    wordCount: 40,
    focusKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
    words: [
      'fall', 'glad', 'flask', 'half', 'salad', 'flash', 'dallas', 'glass',
      'shall', 'dash', 'slash', 'ask', 'had', 'all', 'sad', 'lad',
      'fall', 'flask', 'salad', 'shall', 'glass', 'dash', 'half', 'glad'
    ],
  },
  {
    id: 'foundations_top_row',
    category: 'foundations',
    title: 'Top Row Vowel Reach (QWERTY)',
    description: 'Smooth vertical finger travel from home row keys to upper vowel registers without palm twist.',
    difficulty: 'Steady',
    wpmTarget: 55,
    wordCount: 36,
    focusKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    words: [
      'write', 'quiet', 'tower', 'power', 'poetry', 'proper', 'equity', 'report',
      'route', 'outer', 'water', 'quote', 'prior', 'topic', 'quite', 'troop',
      'writer', 'people', 'output', 'update', 'require', 'purity', 'torque'
    ],
  },
  {
    id: 'foundations_bottom_row',
    category: 'foundations',
    title: 'Bottom Row Acrobatics (ZXCVBNM)',
    description: 'Build agility on lower row reaches that frequently cause lateral adjacent fat-finger clipping.',
    difficulty: 'Brisk',
    wpmTarget: 60,
    wordCount: 32,
    focusKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    words: [
      'brave', 'cabin', 'climb', 'blank', 'breeze', 'vivid', 'matrix', 'carbon',
      'maximum', 'mimic', 'combat', 'victim', 'zenith', 'bronze', 'beacon', 'canvas',
      'bamboo', 'civic', 'bizarre', 'examine', 'venture', 'chronic'
    ],
  },

  // 3. Problem Bigrams
  {
    id: 'bigrams_high_frequency',
    category: 'bigrams',
    title: 'The Top 10 English Bigrams',
    description: 'Trains the most common consecutive keystrokes: th, he, in, er, an, re, ed, on, st, and ou.',
    difficulty: 'Steady',
    wpmTarget: 70,
    wordCount: 36,
    focusKeys: ['th', 'he', 'in', 'er', 'an', 're', 'st'],
    words: [
      'there', 'their', 'other', 'another', 'stand', 'standpoint', 'instead', 'inner',
      'interest', 'remain', 'reinforce', 'stone', 'started', 'station', 'honest', 'header',
      'under', 'render', 'entered', 'hunter', 'thunder', 'instance'
    ],
  },
  {
    id: 'bigrams_pinky_stretch',
    category: 'bigrams',
    title: 'Pinky Reach & Cross-Row Jumps',
    description: 'Drills targeting awkward transitions like qu, pl, op, and za that strain weaker fourth digits.',
    difficulty: 'Master',
    wpmTarget: 75,
    wordCount: 30,
    focusKeys: ['qu', 'pl', 'op', 'za', 'xp'],
    words: [
      'quick', 'quantum', 'explore', 'expert', 'pizza', 'plaza', 'plasma', 'optics',
      'opinion', 'apply', 'quench', 'quarter', 'complex', 'export', 'piazza', 'plenty',
      'puzzle', 'acquire', 'expose', 'equal'
    ],
  },

  // 4. Programming & Developer Syntax
  {
    id: 'coding_typescript_syntax',
    category: 'coding',
    title: 'TypeScript & React Syntax Patterns',
    description: 'Keywords and rhythmic symbol combinations: const, return, async, await, export, type.',
    difficulty: 'Brisk',
    wpmTarget: 65,
    wordCount: 35,
    focusKeys: ['c', 'o', 'n', 's', 't', '=', '>', '{', '}'],
    words: [
      'const', 'interface', 'export', 'default', 'function', 'return', 'async', 'await',
      'Promise', 'string', 'number', 'boolean', 'filter', 'reduce', 'length', 'status',
      'payload', 'handler', 'request', 'response', 'context', 'target'
    ],
  },
];

export default function DrillsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Curricula' },
    { id: 'coffee', label: '☕ Coffee Break' },
    { id: 'foundations', label: '⌨ Foundations' },
    { id: 'bigrams', label: '⚡ Bigram Flow' },
    { id: 'coding', label: '💻 Code Syntax' },
  ];

  const filteredPacks =
    selectedCategory === 'all'
      ? DRILL_PACKS
      : DRILL_PACKS.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#ddd0c2]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#c87d32] uppercase tracking-wider font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Targeted Neuromuscular Curriculum</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2a1e17] mt-1">
            Curated Touch Typing Drills
          </h1>
          <p className="text-xs text-[#786558] mt-1 max-w-xl">
            Choose from purposeful practice decks designed to calibrate specific finger movements,
            eliminate lateral key collisions, and build rhythmic typing velocity.
          </p>
        </div>

        {/* Quick stat banner */}
        <div className="flex items-center space-x-3 bg-white border border-[#ddd0c2] p-3 rounded-2xl shadow-xs">
          <div className="p-2 rounded-xl bg-[#faede0] text-[#c87d32]">
            <Target className="w-4 h-4" />
          </div>
          <div className="text-xs font-mono">
            <span className="text-[#2a1e17] font-bold block">{DRILL_PACKS.length} Specialized Packs</span>
            <span className="text-[#786558]">Structured for muscle memory</span>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#c87d32] text-white shadow-xs font-semibold'
                : 'bg-white text-[#786558] border border-[#ddd0c2] hover:text-[#2a1e17] hover:bg-[#efe6dd]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Grid of Drill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPacks.map((pack) => {
          const drillQuery = encodeURIComponent(pack.words.join(','));

          return (
            <div
              key={pack.id}
              className="bg-white border border-[#ddd0c2] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#c87d32]/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row: badge + difficulty */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#faede0] text-[#c87d32] font-semibold border border-[#ddd0c2]">
                    {pack.category.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      pack.difficulty === 'Gentle'
                        ? 'bg-[#eaf4ed] text-[#4a7c59]'
                        : pack.difficulty === 'Steady'
                        ? 'bg-[#faede0] text-[#c87d32]'
                        : 'bg-[#fdf0ee] text-[#a34338]'
                    }`}
                  >
                    {pack.difficulty} · {pack.wpmTarget} WPM
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-serif font-bold text-lg text-[#2a1e17] leading-tight">
                  {pack.title}
                </h3>
                <p className="text-xs text-[#786558] mt-2 leading-relaxed">
                  {pack.description}
                </p>

                {/* Focus Key Tags */}
                <div className="mt-4 pt-3 border-t border-[#ddd0c2]/60">
                  <span className="text-[10px] font-mono text-[#786558] block mb-1.5 uppercase tracking-wider font-semibold">
                    Targeted Keycaps
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {pack.focusKeys.map((k, kIdx) => (
                      <kbd
                        key={`${pack.id}-key-${k}-${kIdx}`}
                        className="px-2 py-0.5 bg-[#efe6dd] border border-[#ddd0c2] text-[#2a1e17] rounded text-[11px] font-mono font-semibold"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Drill Action */}
              <div className="mt-6 pt-4 border-t border-[#ddd0c2]/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#786558]">
                  {pack.words.length} vocabulary words
                </span>
                <Link
                  href={`/?drill=${drillQuery}`}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-[#efe6dd] hover:bg-[#c87d32] text-[#2a1e17] hover:text-white rounded-xl text-xs font-mono font-semibold transition-all shadow-xs"
                >
                  <span>Start Drill</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
