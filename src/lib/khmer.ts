/**
 * Khmer Unicode text utilities.
 *
 * Rather than re-implementing an input method, the trainer relies on the
 * platform's own Khmer Unicode IME / keyboard (NiDA layout) for input and only
 * handles *analysis* of the resulting Unicode text here:
 *
 *  - cluster segmentation (base + COENG subscripts + vowels + diacritics)
 *  - ZWSP (U+200B) awareness, since Khmer word breaks are invisible
 *  - safe rendering of orphan combining marks via dotted circle (U+25CC)
 *
 * This keeps Unicode handling in one small, testable module.
 */

export const COENG = "\u17D2"; // ្  subscript marker
export const ZWSP = "\u200B"; // invisible word break
export const ZWNJ = "\u200C";
export const DOTTED_CIRCLE = "\u25CC";

const COMBINING_RE = /[\u17B4-\u17D3\u17DD\u200C\uFE00-\uFE0F]/;

export function isCombining(ch: string): boolean {
  return COMBINING_RE.test(ch);
}

export function isKhmer(ch: string): boolean {
  return /[\u1780-\u17FF\u19E0-\u19FF]/.test(ch);
}

/**
 * Split text into typographic clusters: a base character plus every
 * subscript (COENG + consonant), vowel sign and diacritic attached to it.
 * ZWSP is kept as its own cluster so it can be shown to the learner.
 */
export function splitClusters(text: string): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    if (ch === ZWSP) {
      out.push(ch);
      i += 1;
      continue;
    }

    let cluster = ch;
    i += 1;

    while (i < text.length) {
      const c = text[i]!;
      if (c === COENG) {
        const next = text[i + 1];
        cluster += next ? c + next : c;
        i += next ? 2 : 1;
        continue;
      }
      if (isCombining(c)) {
        cluster += c;
        i += 1;
        continue;
      }
      break;
    }

    out.push(cluster);
  }

  return out;
}

/** Character offset of the first code unit of every cluster. */
export function clusterOffsets(text: string): number[] {
  const offsets: number[] = [];
  let at = 0;
  for (const cluster of splitClusters(text)) {
    offsets.push(at);
    at += cluster.length;
  }
  return offsets;
}

/** A cluster that begins with a combining mark needs a carrier to render. */
export function renderableCluster(cluster: string): string {
  if (cluster === ZWSP) return "\u00B7";
  if (cluster.length > 0 && (isCombining(cluster[0]!) || cluster[0] === COENG)) {
    return DOTTED_CIRCLE + cluster;
  }
  return cluster;
}

/** Human label used when explaining an invisible character. */
export function describeChar(ch: string | undefined): string | null {
  if (!ch) return null;
  if (ch === ZWSP) return "ដកឃ្លាមើលមិនឃើញ (ZWSP)";
  if (ch === " ") return "ដកឃ្លា (Space)";
  if (ch === COENG) return "ជើងអក្សរ (j)";
  if (ch === "\n") return "បន្ទាត់ថ្មី (Enter)";
  return null;
}

/** Count Khmer clusters, used as the "word" unit proxy for CPM/WPM. */
export function countClusters(text: string): number {
  return splitClusters(text).length;
}

export function countWords(text: string): number {
  return text
    .split(/[\s\u200B]+/)
    .filter((w) => w.length > 0).length;
}
