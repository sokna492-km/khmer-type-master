/**
 * Pure helpers for IME composition + typing commit policy.
 * Keep React-free so hard Khmer cases can be unit-tested.
 */

export type CompositionState = {
  isComposing: boolean;
  preedit: string;
};

export function initialCompositionState(): CompositionState {
  return { isComposing: false, preedit: "" };
}

export function applyCompositionStart(state: CompositionState): CompositionState {
  return { ...state, isComposing: true, preedit: "" };
}

export function applyCompositionUpdate(
  state: CompositionState,
  preedit: string,
): CompositionState {
  return { ...state, isComposing: true, preedit };
}

export function applyCompositionEnd(
  state: CompositionState,
  committedValue: string,
): { state: CompositionState; shouldCommit: true; value: string } {
  return {
    state: { isComposing: false, preedit: "" },
    shouldCommit: true,
    value: committedValue,
  };
}

/**
 * Whether an input event should update game scoring.
 * Mid-composition updates must not increment mistakes.
 */
export function shouldScoreInput(
  isComposing: boolean,
  inputType?: string,
): boolean {
  if (isComposing) return false;
  // compositionupdate-style noise
  if (inputType === "insertCompositionText") return false;
  return true;
}

export type StrictCommitResult =
  | { kind: "accept"; value: string }
  | { kind: "reject"; value: string; mistake: true }
  | { kind: "noop"; value: string };

/**
 * Strict mode: only accept when normalized next is a prefix of normalized target.
 */
export function strictCommit(
  targetNormalized: string,
  typedNormalized: string,
  nextNormalized: string,
): StrictCommitResult {
  if (nextNormalized === typedNormalized) {
    return { kind: "noop", value: typedNormalized };
  }
  if (nextNormalized.length < typedNormalized.length) {
    return { kind: "accept", value: nextNormalized };
  }
  if (targetNormalized.startsWith(nextNormalized)) {
    return { kind: "accept", value: nextNormalized };
  }
  return { kind: "reject", value: typedNormalized, mistake: true };
}

/**
 * Free-mode mistake delta when the typed buffer grows past the correct prefix.
 * Counts UTF-16 code units newly added beyond the correct prefix (IME commits
 * may add several units per key). Contract for lesson gross accuracy.
 */
export function countFreeMistakeDelta(
  previousTyped: string,
  nextTyped: string,
  correctPrefixLength: number,
): number {
  if (nextTyped.length <= previousTyped.length) return 0;
  if (correctPrefixLength >= nextTyped.length) return 0;
  return nextTyped.length - Math.max(previousTyped.length, correctPrefixLength);
}
