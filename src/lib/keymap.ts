/**
 * Khmer NiDA Unicode keyboard layout — used for on-screen key guidance only.
 * Typing itself goes through the operating system / browser Khmer IME, so this
 * table never transforms input; it just tells the learner which key to press.
 */

import { COENG, ZWSP } from "./khmer";

export type KeyDef = {
  /** physical key label (US layout) */
  code: string;
  /** Khmer output without Shift */
  normal: string;
  /** Khmer output with Shift */
  shift?: string;
  /** flex growth for wide keys */
  wide?: number;
  /** display label instead of the produced character */
  label?: string;
};

export const KEY_ROWS: KeyDef[][] = [
  [
    { code: "`", normal: "«", shift: "»" },
    { code: "1", normal: "១", shift: "!" },
    { code: "2", normal: "២", shift: "៉" },
    { code: "3", normal: "៣", shift: '"' },
    { code: "4", normal: "៤", shift: "៛" },
    { code: "5", normal: "៥", shift: "%" },
    { code: "6", normal: "៦", shift: "៍" },
    { code: "7", normal: "៧", shift: "៎" },
    { code: "8", normal: "៨", shift: "៏" },
    { code: "9", normal: "៩", shift: "(" },
    { code: "0", normal: "០", shift: ")" },
    { code: "-", normal: "ឥ", shift: "៑" },
    { code: "=", normal: "ឲ", shift: "=" },
  ],
  [
    { code: "q", normal: "ឆ", shift: "ឈ" },
    { code: "w", normal: "ឹ", shift: "ឺ" },
    { code: "e", normal: "េ", shift: "ែ" },
    { code: "r", normal: "រ", shift: "ឬ" },
    { code: "t", normal: "ត", shift: "ទ" },
    { code: "y", normal: "យ", shift: "ួ" },
    { code: "u", normal: "ុ", shift: "ូ" },
    { code: "i", normal: "ិ", shift: "ី" },
    { code: "o", normal: "ោ", shift: "ៅ" },
    { code: "p", normal: "ផ", shift: "ភ" },
    { code: "[", normal: "ៀ", shift: "ឿ" },
    { code: "]", normal: "ឪ", shift: "ឧ" },
    { code: "\\", normal: "ឮ", shift: "ឭ" },
  ],
  [
    { code: "a", normal: "ា", shift: "ឣ" },
    { code: "s", normal: "ស", shift: "៊" },
    { code: "d", normal: "ដ", shift: "ឌ" },
    { code: "f", normal: "ថ", shift: "ធ" },
    { code: "g", normal: "ង", shift: "អ" },
    { code: "h", normal: "ហ", shift: "ះ" },
    { code: "j", normal: COENG, shift: "ញ" },
    { code: "k", normal: "ក", shift: "គ" },
    { code: "l", normal: "ល", shift: "ឡ" },
    { code: ";", normal: "់", shift: "៖" },
    { code: "'", normal: "។", shift: "៕" },
  ],
  [
    { code: "z", normal: "ឋ", shift: "ឍ" },
    { code: "x", normal: "ខ", shift: "ឃ" },
    { code: "c", normal: "ច", shift: "ជ" },
    { code: "v", normal: "វ", shift: "ៗ" },
    { code: "b", normal: "ប", shift: "ព" },
    { code: "n", normal: "ន", shift: "ណ" },
    { code: "m", normal: "ម", shift: "ំ" },
    { code: ",", normal: "៌", shift: "៙" },
    { code: ".", normal: ".", shift: "៚" },
    { code: "/", normal: "៍", shift: "?" },
  ],
  [{ code: "space", normal: " ", shift: ZWSP, wide: 8, label: "Space" }],
];

export type KeyHint = { code: string; shift: boolean; altGr: boolean };

const HINTS = new Map<string, KeyHint>();

for (const row of KEY_ROWS) {
  for (const key of row) {
    if (key.normal && !HINTS.has(key.normal)) {
      HINTS.set(key.normal, { code: key.code, shift: false, altGr: false });
    }
    if (key.shift && !HINTS.has(key.shift)) {
      HINTS.set(key.shift, { code: key.code, shift: true, altGr: false });
    }
  }
}

/** Which physical key produces this character, if we know it. */
export function keyHintFor(ch: string | undefined): KeyHint | null {
  if (!ch) return null;
  return HINTS.get(ch) ?? null;
}

export const KEY_LABELS: Record<string, string> = {
  space: "Space",
};
