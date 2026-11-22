import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTextForTyping,
  paragraphToWords,
  CURATED_PASSAGES,
  AI_THEMES,
  RANDOM_PROMPT_TOPICS,
  getAllCuratedPassages,
  getRandomCuratedPassage,
  getCuratedPassage,
} from '../src/lib/paragraphs';
import { buildGemmaParagraphPrompt } from '../src/lib/ai/prompts';

test('cleanTextForTyping normalizes smart quotes and em-dashes to standard ASCII', () => {
  const dirty = '“Hello world,” said the astronaut—‘it’s quiet out here…’';
  const cleaned = cleanTextForTyping(dirty);

  assert.equal(cleaned, '"Hello world," said the astronaut - \'it\'s quiet out here...\'');
  assert.ok(!cleaned.includes('“'));
  assert.ok(!cleaned.includes('”'));
  assert.ok(!cleaned.includes('‘'));
  assert.ok(!cleaned.includes('’'));
  assert.ok(!cleaned.includes('—'));
});

test('paragraphToWords creates clean array of words without empty tokens', () => {
  const paragraph = 'The   quantum explorer drifted    beyond Saturn.  ';
  const words = paragraphToWords(paragraph);

  assert.deepEqual(words, ['The', 'quantum', 'explorer', 'drifted', 'beyond', 'Saturn.']);
});

test('buildGemmaParagraphPrompt formats adaptive weak keys and custom prompt correctly', () => {
  const adaptivePrompt = buildGemmaParagraphPrompt({
    theme: 'adaptive',
    weakKeys: ['left_pinky (q, z)', 'right_pinky (p)'],
    weakBigrams: ['qu', 'za'],
    targetWordCount: 65,
  });

  assert.ok(adaptivePrompt.systemPrompt.includes('REQUIRED') || adaptivePrompt.systemPrompt.includes('STRICT'));
  assert.ok(adaptivePrompt.userPrompt.includes('BIOMECHANICAL ADAPTIVE DRILL MODE'));
  assert.ok(adaptivePrompt.userPrompt.includes('qu, za'));

  const customPrompt = buildGemmaParagraphPrompt({
    theme: 'custom',
    customPrompt: 'mechanical keyboard tactile switches',
  });

  assert.ok(customPrompt.userPrompt.includes('mechanical keyboard tactile switches'));

  const continuationPrompt = buildGemmaParagraphPrompt({
    theme: 'custom',
    customPrompt: 'deep space voyage',
    continuationContext: 'stars folded into iridescent streaks',
    targetWordCount: 80,
  });

  assert.ok(continuationPrompt.userPrompt.includes('STORY CONTINUATION MODE'));
  assert.ok(continuationPrompt.userPrompt.includes('stars folded into iridescent streaks'));
  assert.ok(continuationPrompt.userPrompt.includes('80 words'));
});

test('CURATED_PASSAGES covers all predefined themes with non-empty passages', () => {
  for (const theme of AI_THEMES) {
    if (theme.id === 'custom') continue;
    const passages = CURATED_PASSAGES[theme.id];
    assert.ok(passages && passages.length > 0, `Theme ${theme.id} should have passages`);
    for (const p of passages) {
      assert.ok(p.title.length > 0);
      assert.ok(p.text.length > 40);
      assert.ok(!p.text.includes('“'), 'Curated text must not have smart quotes');
    }
  }
});

test('RANDOM_PROMPT_TOPICS contains diverse, non-empty topics for random paragraph generation', () => {
  assert.ok(RANDOM_PROMPT_TOPICS.length >= 10);
  for (const topic of RANDOM_PROMPT_TOPICS) {
    assert.ok(typeof topic === 'string' && topic.trim().length > 10);
  }
});

test('getAllCuratedPassages returns all 22 passages across themes', () => {
  const all = getAllCuratedPassages();
  assert.equal(all.length, 22);
  const titles = new Set(all.map((p) => p.title));
  assert.equal(titles.size, 22, 'All 22 passages should have unique titles');
});

test('getRandomCuratedPassage successfully rotates and respects excludeTitle', () => {
  const all = getAllCuratedPassages();
  const sample = all[0];
  for (let i = 0; i < 20; i++) {
    const picked = getRandomCuratedPassage(sample.title);
    assert.notEqual(picked.title, sample.title, 'Should not return excluded title');
    assert.ok(picked.text.length > 0);
  }
});

test('getCuratedPassage draws across all themes when theme is custom or undefined', () => {
  const pickedTitles = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const p = getCuratedPassage('custom');
    pickedTitles.add(p.title);
  }
  // With 22 available passages, 50 random samples should hit more than 1 title
  assert.ok(pickedTitles.size > 1, `Expected multiple titles, got ${pickedTitles.size}`);
});
