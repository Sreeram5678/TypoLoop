// High frequency touch-typing word bank (Monkeytype English 200 standard)
export const COMMON_WORDS = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for',
  'they', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you',
  'do', 'but', 'his', 'from', 'say', 'her', 'or', 'an', 'will', 'my', 'one',
  'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
  'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
  'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'great', 'small', 'every', 'found', 'still',
  'between', 'name', 'should', 'home', 'big', 'air', 'line', 'set', 'own', 'under',
  'read', 'last', 'never', 'left', 'end', 'along', 'while', 'might', 'next', 'sound',
  'below', 'saw', 'something', 'thought', 'both', 'few', 'those', 'always', 'show',
  'large', 'often', 'together', 'asked', 'house', 'world', 'going', 'school',
  'important', 'until', 'form', 'food', 'keep', 'children', 'feet', 'land', 'side',
  'without', 'boy', 'once', 'animal', 'life', 'enough', 'took', 'four', 'head',
  'above', 'kind', 'began', 'almost', 'live', 'page', 'got', 'earth', 'need',
  'far', 'hand', 'high', 'mother', 'light', 'country', 'father', 'let', 'night',
  'picture', 'being', 'study', 'second', 'soon', 'story', 'since', 'white', 'ever',
  'paper', 'hard', 'near', 'sentence', 'better', 'best', 'across', 'during', 'today',
  'however', 'sure', 'knew', 'itself', 'several', 'remember', 'step', 'early', 'hold',
  'west', 'ground', 'interest', 'reach', 'fast', 'five', 'sing', 'listen', 'six',
  'table', 'travel', 'less', 'morning', 'ten', 'simple'
];

export const INITIAL_PASSAGE_TITLE = 'The Art of the Pour-Over';
export const INITIAL_PASSAGE_MODEL = 'TypoLoop Reserve';
export const INITIAL_PASSAGE_TEXT =
  'Water heated precisely to ninety-two degrees gently blooms the freshly ground beans. The aromatics rise - notes of jasmine, candied citrus, and warm brown sugar - as the stream draws down smoothly into the glass carafe, completing the ritual of deliberate focus and morning stillness. Nine bars of pressure force heated water through a finely compacted puck of roasted coffee. In twenty-seven seconds, rich hazelnut crema forms atop a velvety extraction, balancing brisk fruit acidity with deep bittersweet chocolate undertones. Inside the warm roastery, the cast iron drum turns steadily as green seeds absorb convective heat, releasing aromas of roasted almond and wildflower honey.';

export const INITIAL_WORDS = INITIAL_PASSAGE_TEXT.split(' ').filter(Boolean);

/**
 * Generates an array of randomized words for a typing session
 */
export function generateWordStream(count: number = 80): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    words.push(COMMON_WORDS[randomIndex]);
  }
  return words;
}
