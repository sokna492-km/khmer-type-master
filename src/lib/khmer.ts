/**
 * Project facade over khmer-segment — one Unicode pipeline for the trainer.
 * Do not use raw String.normalize('NFC') for Khmer compare; it can harm mark order.
 */

import {
  compareTyping,
  deleteBackward as ksDeleteBackward,
  getClusterBoundaries,
  normalizeKhmer,
  splitClusters as ksSplitClusters,
  type TypingComparison,
  type TypingUnitState,
} from "khmer-segment";

export {
  compareTyping,
  normalizeKhmer,
  type TypingComparison,
  type TypingUnitState,
};

export const COENG = "\u17D2";
export const ZWSP = "\u200B";
export const DOTTED_CIRCLE = "\u25CC";

// eslint-disable-next-line no-misleading-character-class
const COMBINING_RE = /[\u17B4-\u17D3\u17DD\u200C\uFE00-\uFE0F]/;

export function isCombining(ch: string): boolean {
  return COMBINING_RE.test(ch);
}

/** Sanitize a lesson line before it becomes a typing target. */
export function sanitizeTarget(text: string): string {
  return normalizeKhmer(text);
}

export function splitClusters(text: string): string[] {
  return ksSplitClusters(text);
}

/** Character offset of the first code unit of every cluster. */
export function clusterOffsets(text: string): number[] {
  return getClusterBoundaries(text).map((b) => b.start);
}

export function deleteBackward(
  text: string,
  cursorIndex: number,
  options?: { normalize?: boolean },
): { text: string; cursorIndex: number } {
  return ksDeleteBackward(text, cursorIndex, options);
}

/** A cluster that begins with a combining mark needs a carrier to render. */
export function renderableCluster(cluster: string): string {
  if (cluster === ZWSP) return "\u00B7";
  if (cluster.length > 0 && (isCombining(cluster[0]!) || cluster[0] === COENG)) {
    return DOTTED_CIRCLE + cluster;
  }
  return cluster;
}

/**
 * Next code unit the learner should produce for NiDA key hints.
 * Uses normalized code-unit prefix so COENG+consonant sequences hint stepwise
 * (base → ្ → consonant), not only whole clusters.
 */
export function nextHintUnit(target: string, typed: string): string | null {
  const normalizedTarget = normalizeKhmer(target);
  const normalizedTyped = normalizeKhmer(typed);

  if (normalizedTyped.length >= normalizedTarget.length) {
    if (normalizedTyped === normalizedTarget) return null;
    // Free mode: past or mismatched — hint expected unit at first mismatch
    const comparison = compareTyping(target, typed);
    return normalizedTarget[comparison.mismatchOffset] ?? null;
  }

  if (normalizedTarget.startsWith(normalizedTyped)) {
    return normalizedTarget[normalizedTyped.length] ?? null;
  }

  const comparison = compareTyping(target, typed);
  return normalizedTarget[comparison.mismatchOffset] ?? null;
}
