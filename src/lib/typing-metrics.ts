/**
 * Single source of truth for typing trainer WPM / accuracy / correct-count math.
 * Keep React-free. Live HUD and final results must call the same helpers.
 */

import { normalizeKhmer } from "@/lib/khmer";

/**
 * Code-unit correct count for metrics (not cluster-complete).
 * Mid-cluster `ក` toward `កា` counts as 1 while the normalized target still starts with typed.
 */
export function correctCodeUnitCount(target: string, typed: string): number {
  const normalizedTarget = normalizeKhmer(target);
  const normalizedTyped = normalizeKhmer(typed);

  if (normalizedTyped.length === 0) return 0;
  if (normalizedTarget.startsWith(normalizedTyped)) {
    return normalizedTyped.length;
  }

  let i = 0;
  const limit = Math.min(normalizedTarget.length, normalizedTyped.length);
  while (i < limit && normalizedTarget[i] === normalizedTyped[i]) {
    i += 1;
  }
  return i;
}

/** Gross accuracy: corrected typos still count against the score. */
export function computeAccuracy(correct: number, mistakes: number): number {
  const safeCorrect = Math.max(0, correct);
  const safeMistakes = Math.max(0, mistakes);
  const total = safeCorrect + safeMistakes;
  if (total === 0) return 100;
  return (100 * safeCorrect) / total;
}

/** Net WPM: (correctChars / 5) / minutes. Returns 0 when elapsed is not positive. */
export function computeWpm(correct: number, elapsedSec: number): number {
  if (elapsedSec <= 0 || correct <= 0) return 0;
  const minutes = elapsedSec / 60;
  return correct / 5 / minutes;
}

/** Correct characters per minute. */
export function computeCpm(correct: number, elapsedSec: number): number {
  if (elapsedSec <= 0 || correct <= 0) return 0;
  const minutes = elapsedSec / 60;
  return correct / minutes;
}

export function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function roundStat(value: number): number {
  return Math.round(value);
}

export type LessonMetricsInput = {
  correct: number;
  mistakes: number;
  elapsedSec: number;
};

export type LessonMetrics = {
  correct: number;
  mistakes: number;
  elapsed: number;
  wpm: number;
  cpm: number;
  accuracy: number;
};

/** Build the canonical lesson metrics object used by HUD and final results. */
export function computeLessonMetrics(input: LessonMetricsInput): LessonMetrics {
  const correct = Math.max(0, input.correct);
  const mistakes = Math.max(0, input.mistakes);
  const elapsed = Math.max(0, input.elapsedSec);

  return {
    correct,
    mistakes,
    elapsed,
    wpm: computeWpm(correct, elapsed),
    cpm: computeCpm(correct, elapsed),
    accuracy: clampPct(computeAccuracy(correct, mistakes)),
  };
}
