import { FingerName } from '@/types/typing';

export interface KeyCoordinate {
  row: number;
  col: number;
  finger: FingerName;
  hand: 'left' | 'right';
}

// QWERTY physical keyboard mapping
export const KEYBOARD_LAYOUT: Record<string, KeyCoordinate> = {
  // Number row (Row 0)
  '`': { row: 0, col: 0, finger: 'left_pinky', hand: 'left' },
  '1': { row: 0, col: 1, finger: 'left_pinky', hand: 'left' },
  '2': { row: 0, col: 2, finger: 'left_ring', hand: 'left' },
  '3': { row: 0, col: 3, finger: 'left_middle', hand: 'left' },
  '4': { row: 0, col: 4, finger: 'left_index', hand: 'left' },
  '5': { row: 0, col: 5, finger: 'left_index', hand: 'left' },
  '6': { row: 0, col: 6, finger: 'right_index', hand: 'right' },
  '7': { row: 0, col: 7, finger: 'right_index', hand: 'right' },
  '8': { row: 0, col: 8, finger: 'right_middle', hand: 'right' },
  '9': { row: 0, col: 9, finger: 'right_ring', hand: 'right' },
  '0': { row: 0, col: 10, finger: 'right_pinky', hand: 'right' },
  '-': { row: 0, col: 11, finger: 'right_pinky', hand: 'right' },
  '=': { row: 0, col: 12, finger: 'right_pinky', hand: 'right' },

  // Top row (Row 1)
  'q': { row: 1, col: 1.5, finger: 'left_pinky', hand: 'left' },
  'w': { row: 1, col: 2.5, finger: 'left_ring', hand: 'left' },
  'e': { row: 1, col: 3.5, finger: 'left_middle', hand: 'left' },
  'r': { row: 1, col: 4.5, finger: 'left_index', hand: 'left' },
  't': { row: 1, col: 5.5, finger: 'left_index', hand: 'left' },
  'y': { row: 1, col: 6.5, finger: 'right_index', hand: 'right' },
  'u': { row: 1, col: 7.5, finger: 'right_index', hand: 'right' },
  'i': { row: 1, col: 8.5, finger: 'right_middle', hand: 'right' },
  'o': { row: 1, col: 9.5, finger: 'right_ring', hand: 'right' },
  'p': { row: 1, col: 10.5, finger: 'right_pinky', hand: 'right' },
  '[': { row: 1, col: 11.5, finger: 'right_pinky', hand: 'right' },
  ']': { row: 1, col: 12.5, finger: 'right_pinky', hand: 'right' },

  // Home row (Row 2)
  'a': { row: 2, col: 1.8, finger: 'left_pinky', hand: 'left' },
  's': { row: 2, col: 2.8, finger: 'left_ring', hand: 'left' },
  'd': { row: 2, col: 3.8, finger: 'left_middle', hand: 'left' },
  'f': { row: 2, col: 4.8, finger: 'left_index', hand: 'left' },
  'g': { row: 2, col: 5.8, finger: 'left_index', hand: 'left' },
  'h': { row: 2, col: 6.8, finger: 'right_index', hand: 'right' },
  'j': { row: 2, col: 7.8, finger: 'right_index', hand: 'right' },
  'k': { row: 2, col: 8.8, finger: 'right_middle', hand: 'right' },
  'l': { row: 2, col: 9.8, finger: 'right_ring', hand: 'right' },
  ';': { row: 2, col: 10.8, finger: 'right_pinky', hand: 'right' },
  "'": { row: 2, col: 11.8, finger: 'right_pinky', hand: 'right' },

  // Bottom row (Row 3)
  'z': { row: 3, col: 2.2, finger: 'left_pinky', hand: 'left' },
  'x': { row: 3, col: 3.2, finger: 'left_ring', hand: 'left' },
  'c': { row: 3, col: 4.2, finger: 'left_middle', hand: 'left' },
  'v': { row: 3, col: 5.2, finger: 'left_index', hand: 'left' },
  'b': { row: 3, col: 6.2, finger: 'left_index', hand: 'left' },
  'n': { row: 3, col: 7.2, finger: 'right_index', hand: 'right' },
  'm': { row: 3, col: 8.2, finger: 'right_index', hand: 'right' },
  ',': { row: 3, col: 9.2, finger: 'right_middle', hand: 'right' },
  '.': { row: 3, col: 10.2, finger: 'right_ring', hand: 'right' },
  '/': { row: 3, col: 11.2, finger: 'right_pinky', hand: 'right' },

  // Space
  ' ': { row: 4, col: 6.0, finger: 'right_thumb', hand: 'right' },
};

/**
 * Calculates Euclidean physical key distance on standard keyboard.
 * Distance <= 1.5 indicates a physical fat-finger neighbor key.
 */
export function areKeysPhysicallyAdjacent(keyA: string, keyB: string): boolean {
  const normA = keyA.toLowerCase();
  const normB = keyB.toLowerCase();

  const coordA = KEYBOARD_LAYOUT[normA];
  const coordB = KEYBOARD_LAYOUT[normB];

  if (!coordA || !coordB) return false;

  const rowDiff = Math.abs(coordA.row - coordB.row);
  const colDiff = Math.abs(coordA.col - coordB.col);
  const distance = Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);

  return distance <= 1.6;
}

export function getKeyFinger(key: string): FingerName {
  const norm = key.toLowerCase();
  return KEYBOARD_LAYOUT[norm]?.finger || 'right_index';
}

export function getKeyHand(key: string): 'left' | 'right' {
  const norm = key.toLowerCase();
  return KEYBOARD_LAYOUT[norm]?.hand || 'right';
}
