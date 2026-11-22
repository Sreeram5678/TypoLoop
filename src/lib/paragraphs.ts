import { AITheme, AIThemeId } from '@/types/typing';

export const AI_THEMES: AITheme[] = [
  {
    id: 'coffee',
    label: 'Artisanal Coffee & Roastery',
    icon: 'Coffee',
    description: 'Pour-overs, espresso extractions, origin lore, and cozy cafe atmosphere.',
  },
  {
    id: 'scifi',
    label: 'Deep Space',
    icon: 'Rocket',
    description: 'Exploration of distant galaxies, Dyson spheres, and stellar phenomena.',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    icon: 'Zap',
    description: 'Neon alleys, quantum encryption, synth neural links, and midnight rain.',
  },
  {
    id: 'tech',
    label: 'Computing & Tech',
    icon: 'Terminal',
    description: 'Operating systems, compilers, distributed protocols, and silicon architecture.',
  },
  {
    id: 'philosophy',
    label: 'Philosophy',
    icon: 'BookOpen',
    description: 'Stoic reflections, epistemological questions, and cosmic wonder.',
  },
  {
    id: 'literature',
    label: 'Classic Literature',
    icon: 'Feather',
    description: 'Rich lyrical prose, timeless narrative cadences, and vivid scenery.',
  },
  {
    id: 'adaptive',
    label: 'Adaptive Drill',
    icon: 'Crosshair',
    description: 'Stories generated to heavily target your weak bigrams and error-prone fingers.',
  },
  {
    id: 'custom',
    label: 'Custom Prompt',
    icon: 'Sparkles',
    description: 'Prompt Gemma to generate a custom passage on whatever topic you desire.',
  },
];

/**
 * Normalizes text from LLMs into standard, clean touch-typable ASCII:
 * - Smart curly quotes/apostrophes become standard ' and "
 * - Em/en dashes become standard hyphens -
 * - Ellipses become standard three periods ...
 * - Collapses multiple spaces and newlines into single spaces
 */
export function cleanTextForTyping(rawText: string): string {
  if (!rawText) return '';

  return (
    rawText
      // Replace smart single quotes
      .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
      // Replace smart double quotes
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
      // Replace em-dash and en-dash with standard hyphens
      .replace(/[\u2013\u2014\u2015]/g, ' - ')
      // Replace ellipsis character with three dots
      .replace(/\u2026/g, '...')
      // Replace non-breaking spaces and other weird whitespaces
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      // Strip markdown code fences or backticks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`/g, '')
      // Replace newlines and multiple spaces with a single space
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Converts a cleaned paragraph into a stream of words suitable for touch typing.
 */
export function paragraphToWords(paragraph: string): string[] {
  const cleaned = cleanTextForTyping(paragraph);
  if (!cleaned) return [];
  return cleaned.split(' ').filter((w) => w.length > 0);
}

export interface CuratedPassage {
  title: string;
  theme: AIThemeId;
  text: string;
}

export const CURATED_PASSAGES: Record<AIThemeId, CuratedPassage[]> = {
  coffee: [
    {
      title: 'The Art of the Pour-Over',
      theme: 'coffee',
      text: 'Water heated precisely to ninety-two degrees gently blooms the freshly ground beans. The aromatics rise - notes of jasmine, candied citrus, and warm brown sugar - as the stream draws down smoothly into the glass carafe, completing the ritual of deliberate focus and morning stillness.',
    },
    {
      title: 'Espresso Extraction Dynamics',
      theme: 'coffee',
      text: 'Nine bars of pressure force heated water through a finely compacted puck of roasted coffee. In twenty-seven seconds, rich hazelnut crema forms atop a velvety extraction, balancing brisk fruit acidity with deep bittersweet chocolate undertones.',
    },
    {
      title: 'Highland Terroir of Yirgacheffe',
      theme: 'coffee',
      text: 'Grown beneath dense forest canopies at two thousand meters above sea level, heirloom coffee varietals mature slowly under gentle equatorial mist. Handpicked cherries dry under the highland sun, developing profound floral complexity and crisp bergamot sweetness.',
    },
    {
      title: 'Third-Wave Roastery Rhythms',
      theme: 'coffee',
      text: 'Inside the warm roastery, the cast iron drum turns steadily as green seeds absorb convective heat. When the first crack echoes, delicate sugars caramelize, releasing aromas of roasted almond, warm brioche, and wildflower honey.',
    },
  ],
  scifi: [
    {
      title: 'Voyage Beyond The Rings',
      theme: 'scifi',
      text: 'The automated explorer drifted beyond the crystalline rings of Saturn, where silence stretched across billions of kilometers. Solar sails shimmered faintly against the deep cosmic canvas as ion thrusters propelled the vessel toward interstellar darkness.',
    },
    {
      title: 'Dyson Swarm In Orbit',
      theme: 'scifi',
      text: 'Trillions of mirror arrays encircled the young pulsar, harvesting its relentless thermonuclear radiation. Autonomous drones maintained the orbital lattice with quiet mathematical precision, transmitting boundless energy across distant interstellar relays.',
    },
    {
      title: 'Quantum Jump Protocol',
      theme: 'scifi',
      text: 'Subspace distortion stabilized around the heavy cruiser as navigational algorithms plotted coordinates through a gravitational anomaly. The stars folded into iridescent streaks, snapping the starship across forty light years in a single heartbeat.',
    },
  ],
  cyberpunk: [
    {
      title: 'Neon Circuit Alley',
      theme: 'cyberpunk',
      text: 'Rain drummed against the rusted copper eaves of the high-rise district, washing iridescent oil streaks into the storm drains. Holographic advertisements flickered above the crowded walkways while anonymous couriers traded encrypted memory chips in the shadows.',
    },
    {
      title: 'Neural Link Synchrony',
      theme: 'cyberpunk',
      text: 'The cybernetic interface buzzed along synthetic nerve clusters, flooding his vision with cascading hexadecimal telemetry. Firewalls crumbled under automated decryption routines as the decentralized mainframe yielded its secret archives.',
    },
    {
      title: 'Midnight Subnet',
      theme: 'cyberpunk',
      text: 'Beneath the chrome towers, silent cooling fans hummed inside overclocked server racks. Rogue scripts executed in millisecond bursts, routing synthetic currency through offshore quantum exchanges before security protocols could intervene.',
    },
  ],
  tech: [
    {
      title: 'The Unix Philosophy',
      theme: 'tech',
      text: 'Write programs that do one thing and do it well. Write programs to work together. Write programs to handle text streams, because that is a universal interface. Clarity and simplicity in modular design always outlive clever complexity.',
    },
    {
      title: 'Compiler Optimization Loops',
      theme: 'tech',
      text: 'The optimizing compiler transforms nested loops through vectorization and register allocation, converting high-level abstractions into blazing machine instructions. Memory access patterns and cache alignment dictate true runtime efficiency.',
    },
    {
      title: 'Distributed Consensus',
      theme: 'tech',
      text: 'In distributed systems, achieving fault-tolerant consensus across asynchronous networks requires elegant state replication. Raft and Paxos protocols ensure cluster consistency even when network partitions and hardware failures strike unpredictably.',
    },
  ],
  philosophy: [
    {
      title: 'The Stoic Citadel',
      theme: 'philosophy',
      text: 'You have power over your mind, not outside events. Realize this, and you will find profound strength. When dawn breaks, remind yourself that the tranquility of your soul depends entirely on the virtues you choose to embody today.',
    },
    {
      title: 'Cosmic Perspective',
      theme: 'philosophy',
      text: 'Look again at that dot. That is here. That is home. That is us. On it everyone you love, everyone you know, everyone you ever heard of lived out their lives. In our obscurity, in all this vastness, there is no hint that help will come from elsewhere.',
    },
    {
      title: 'The Flux of Nature',
      theme: 'philosophy',
      text: 'No man ever steps in the same river twice, for it is not the same river and he is not the same man. Time flows like a river of fleeting events, where every creation swiftly yields to perpetual transformation.',
    },
  ],
  literature: [
    {
      title: 'The Great Sea Lantern',
      theme: 'literature',
      text: 'The solitary lighthouse stood steadfast upon the jagged granite bluff, casting its amber beam into the tempestuous fog. Waves crashed against ancient stones with rhythmic fury, yet within the lantern room, all was quiet and serene.',
    },
    {
      title: 'Autumn in the Valley',
      theme: 'literature',
      text: 'Golden leaves spiraled through the crisp morning breeze, carpeted across the cobblestone roads of the sleeping hamlet. Smoke curled gently from stone chimneys into an endless azure autumn sky, welcoming the harvest sun.',
    },
    {
      title: 'The Old Clockmaker',
      theme: 'literature',
      text: 'In his dusty workshop beneath the clock tower, brass gears and balance wheels clicked in harmony. Each delicate timepiece carried the measured heartbeat of human invention, carving quiet order from the relentless march of time.',
    },
  ],
  adaptive: [
    {
      title: 'The Azure Quartz Quarry',
      theme: 'adaptive',
      text: 'The quiet zoologist quickly analyzed the exquisite azure quartz crystals along the quarry path. Zebras paced with zealous curiosity through the twilight zone, while tranquil sparrows fluttered across antique bronze arches.',
    },
    {
      title: 'The Quantum Paradox',
      theme: 'adaptive',
      text: 'Equipped with quiet precision, the perplexed physicist examined quirky quantum trajectories. Zero discrepancies appeared across the complex equations, proving that puzzle parameters frequently confound orthodox expectations.',
    },
  ],
  custom: [
    {
      title: 'Gemma Thought Stream',
      theme: 'custom',
      text: 'Artificial intelligence thrives on the seamless synthesis of human curiosity and algorithmic harmony. Every stroke of the keyboard bridges raw thought into tangible digital creation with astonishing speed and grace.',
    },
  ],
};

export const RANDOM_PROMPT_TOPICS: string[] = [
  'Deep ocean hydrothermal vents and luminous marine biology',
  'Ancient astronomical observatories and celestial star maps',
  'A stormy cyberpunk evening in a neon-lit alleyway',
  'Single-origin Ethiopian coffee roasting and morning cafe aromas',
  'Navigating an asteroid belt near the crystalline rings of Saturn',
  'The philosophical nature of time, memory, and human consciousness',
  'Architecture of forgotten stone libraries carved inside high cliffs',
  'The invisible dance of quantum particles and entanglement',
  'Morning mist rising over towering redwood forest canopies',
  'The craft of compilers turning human thoughts into silicon machine code',
  'Traditional Japanese sword forging in glowing charcoal flames',
  'Cosmic silence on the moon looking back at planet Earth',
  'Ancient Roman aqueducts and durable volcanic ash concrete',
  'Bioluminescent fungi lighting up a hidden subterranean cave',
  'A jazz pianist improvising complex syncopated chords at midnight',
  'High-altitude alpine weather stations weathering a blizzard',
  'The mathematical harmony of Fibonacci spirals in nature',
  'Vintage mechanical watch movements and oscillating balance wheels',
];

/**
 * Returns all curated passages across all available themes.
 */
export function getAllCuratedPassages(): CuratedPassage[] {
  const all: CuratedPassage[] = [];
  for (const passages of Object.values(CURATED_PASSAGES)) {
    all.push(...passages);
  }
  return all;
}

/**
 * Returns a randomized curated passage from across all themes, optionally excluding the current title.
 */
export function getRandomCuratedPassage(excludeTitle?: string): CuratedPassage {
  const all = getAllCuratedPassages();
  const pool = excludeTitle ? all.filter((p) => p.title !== excludeTitle) : all;
  const targetPool = pool.length > 0 ? pool : all;
  const randomIndex = Math.floor(Math.random() * targetPool.length);
  return targetPool[randomIndex];
}

/**
 * Returns a random curated passage for a theme (used as fast instant baseline or fallback).
 * If theme is 'custom' or not specified, draws randomly from all available passages.
 */
export function getCuratedPassage(theme?: AIThemeId, excludeTitle?: string): CuratedPassage {
  if (!theme || theme === 'custom') {
    return getRandomCuratedPassage(excludeTitle);
  }
  const passages = CURATED_PASSAGES[theme] || CURATED_PASSAGES.scifi;
  const pool = excludeTitle ? passages.filter((p) => p.title !== excludeTitle) : passages;
  const targetPool = pool.length > 0 ? pool : passages;
  const randomIndex = Math.floor(Math.random() * targetPool.length);
  return targetPool[randomIndex];
}
