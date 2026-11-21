import assert from 'node:assert';
import test from 'node:test';
import { areKeysPhysicallyAdjacent, getKeyFinger, getKeyHand } from '../src/lib/keyboard-layout';
import { calculateTypingStats, extractDiagnostics } from '../src/lib/analyzer';
import { KeystrokeEvent } from '../src/types/typing';

test('Keyboard physical adjacency correctly detects fat-finger keys', () => {
  // 'a' is adjacent to 's', 'q', 'z', 'w'
  assert.strictEqual(areKeysPhysicallyAdjacent('a', 's'), true);
  assert.strictEqual(areKeysPhysicallyAdjacent('a', 'q'), true);
  assert.strictEqual(areKeysPhysicallyAdjacent('a', 'z'), true);

  // 'a' is far from 'p', 'l', 'm'
  assert.strictEqual(areKeysPhysicallyAdjacent('a', 'p'), false);
  assert.strictEqual(areKeysPhysicallyAdjacent('a', 'l'), false);
  assert.strictEqual(areKeysPhysicallyAdjacent('a', 'm'), false);
});

test('Finger attribution accurately maps keys to fingers and hands', () => {
  assert.strictEqual(getKeyFinger('a'), 'left_pinky');
  assert.strictEqual(getKeyHand('a'), 'left');

  assert.strictEqual(getKeyFinger('f'), 'left_index');
  assert.strictEqual(getKeyHand('f'), 'left');

  assert.strictEqual(getKeyFinger('j'), 'right_index');
  assert.strictEqual(getKeyHand('j'), 'right');

  assert.strictEqual(getKeyFinger('p'), 'right_pinky');
  assert.strictEqual(getKeyHand('p'), 'right');
});

test('calculateTypingStats correctly computes WPM and accuracy', () => {
  const now = Date.now();
  // 50 characters in 30 seconds = 10 words in 0.5 minutes = 20 WPM
  const keystrokes: KeystrokeEvent[] = [];
  for (let i = 0; i < 50; i++) {
    keystrokes.push({
      key: 'a',
      code: 'KeyA',
      expected: 'a',
      timestamp: now + i * 600,
      duration: 80,
      isCorrect: true,
      iki: 600,
      targetWordIndex: 0,
      charIndex: i,
    });
  }

  const stats = calculateTypingStats(keystrokes, 30, 'a'.repeat(50));
  assert.strictEqual(stats.wpm, 20);
  assert.strictEqual(stats.accuracy, 100);
  assert.strictEqual(stats.correctChars, 50);
  assert.strictEqual(stats.incorrectChars, 0);
});

test('extractDiagnostics classifies adjacent fat-finger and transposition errors', () => {
  const now = Date.now();
  const keystrokes: KeystrokeEvent[] = [
    // 1. Correct 't'
    { key: 't', code: 'KeyT', expected: 't', timestamp: now, duration: 80, isCorrect: true, iki: 100, targetWordIndex: 0, charIndex: 0 },
    // 2. Transposition: typed 'e' instead of 'h'
    { key: 'e', code: 'KeyE', expected: 'h', timestamp: now + 150, duration: 80, isCorrect: false, iki: 150, targetWordIndex: 0, charIndex: 1 },
    // 3. Transposition: typed 'h' instead of 'e'
    { key: 'h', code: 'KeyH', expected: 'e', timestamp: now + 300, duration: 80, isCorrect: false, iki: 150, targetWordIndex: 0, charIndex: 2 },
    // 4. Fat-finger: typed 's' instead of 'a'
    { key: 's', code: 'KeyS', expected: 'a', timestamp: now + 450, duration: 80, isCorrect: false, iki: 150, targetWordIndex: 1, charIndex: 0 },
  ];

  const stats = calculateTypingStats(keystrokes, 10, 'the a');
  const diagnostics = extractDiagnostics(keystrokes, stats);

  assert.strictEqual(diagnostics.errorTypeBreakdown.ADJACENT_FAT_FINGER >= 1, true);
  assert.strictEqual(diagnostics.errorTypeBreakdown.TRANSPOSITION >= 1, true);
  assert.strictEqual(diagnostics.fingerErrors.left_pinky >= 1, true); // expected 'a' belongs to left_pinky
});
