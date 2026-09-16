import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  compareTyping,
  deleteBackward,
  nextHintUnit,
  normalizeKhmer,
  sanitizeTarget,
  splitClusters,
  type TypingComparison,
  type TypingUnitState,
} from "@/lib/khmer";
import { countFreeMistakeDelta, strictCommit } from "@/lib/typing-input";
import { correctCodeUnitCount } from "@/lib/typing-metrics";

export type TypingMode = "strict" | "free";

/** Line-local counters. Lesson HUD must use useLessonStats, not these WPM/accuracy fields. */
export type TypingStats = {
  elapsed: number;
  mistakes: number;
  correct: number;
  progress: number;
};

export type CommitResult =
  | { accepted: true; value: string; mistakesAdded: number }
  | { accepted: false; value: string; mistakesAdded: number };

export type TypingSession = ReturnType<typeof useTypingSession>;

export type UseTypingSessionOptions = {
  target: string;
  mode: TypingMode;
};

/**
 * Dual-mode Khmer typing line engine.
 * - strict: reject wrong input, flash, do not advance (keys/words lessons)
 * - free: accept wrong input, highlight mismatches (text/exam lessons)
 *
 * Reports raw correct/mistake counters. Lesson-scoped WPM/accuracy/time live in useLessonStats.
 * Input is expected already composed by the OS Khmer IME.
 */
export function useTypingSession({ target: rawTarget, mode }: UseTypingSessionOptions) {
  const target = useMemo(() => sanitizeTarget(rawTarget), [rawTarget]);

  const [typed, setTyped] = useState("");
  const [composition, setComposition] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [tick, setTick] = useState(0);
  const errorIndexes = useRef<Set<number>>(new Set());
  const wrongFlashTimer = useRef<number | null>(null);

  const reset = useCallback(() => {
    setTyped("");
    setComposition("");
    setStartedAt(null);
    setFinishedAt(null);
    setMistakes(0);
    setWrongFlash(false);
    setTick(0);
    errorIndexes.current = new Set();
    if (wrongFlashTimer.current) {
      window.clearTimeout(wrongFlashTimer.current);
      wrongFlashTimer.current = null;
    }
  }, []);

  useEffect(() => {
    reset();
  }, [target, mode, reset]);

  const completed = finishedAt !== null;

  useEffect(() => {
    if (startedAt === null || completed) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [startedAt, completed]);

  const flashWrong = useCallback(() => {
    setWrongFlash(true);
    if (wrongFlashTimer.current) window.clearTimeout(wrongFlashTimer.current);
    wrongFlashTimer.current = window.setTimeout(() => {
      setWrongFlash(false);
      wrongFlashTimer.current = null;
    }, 160);
  }, []);

  const ensureStarted = useCallback(
    (now = Date.now()) => {
      if (startedAt === null) setStartedAt(now);
    },
    [startedAt],
  );

  const comparison: TypingComparison = useMemo(
    () => compareTyping(target, typed),
    [target, typed],
  );

  const correct = useMemo(() => correctCodeUnitCount(target, typed), [target, typed]);

  const handleCommit = useCallback(
    (nextValue: string): CommitResult => {
      if (completed) return { accepted: false, value: typed, mistakesAdded: 0 };

      const now = Date.now();
      const normalizedNext = normalizeKhmer(nextValue);

      // Backspace / shorter value
      if (normalizedNext.length < typed.length || nextValue.length < typed.length) {
        ensureStarted(now);
        const value = normalizeKhmer(nextValue);
        setTyped(value);
        return { accepted: true, value, mistakesAdded: 0 };
      }

      if (normalizedNext === typed) {
        return { accepted: true, value: typed, mistakesAdded: 0 };
      }

      ensureStarted(now);

      if (mode === "strict") {
        const targetNorm = normalizeKhmer(target);
        const decision = strictCommit(targetNorm, typed, normalizedNext);
        if (decision.kind === "accept") {
          setTyped(decision.value);
          if (decision.value === targetNorm) setFinishedAt(now);
          return { accepted: true, value: decision.value, mistakesAdded: 0 };
        }
        if (decision.kind === "noop") {
          return { accepted: true, value: decision.value, mistakesAdded: 0 };
        }
        // Strict: +1 per rejected commit (lesson gross-accuracy contract)
        setMistakes((m) => m + 1);
        flashWrong();
        return { accepted: false, value: typed, mistakesAdded: 1 };
      }

      // Free mode: accept everything; mistakes = UTF-16 units added past correct prefix
      const correctNext = correctCodeUnitCount(target, normalizedNext);
      let mistakesAdded = 0;
      if (correctNext < normalizedNext.length) {
        for (let i = correctNext; i < normalizedNext.length; i += 1) {
          errorIndexes.current.add(i);
        }
        mistakesAdded = countFreeMistakeDelta(typed, normalizedNext, correctNext);
        if (mistakesAdded > 0) {
          setMistakes((m) => m + mistakesAdded);
        }
      }

      setTyped(normalizedNext);
      const targetNorm = normalizeKhmer(target);
      if (normalizedNext === targetNorm) {
        setFinishedAt(now);
      }
      return { accepted: true, value: normalizedNext, mistakesAdded };
    },
    [completed, typed, target, mode, ensureStarted, flashWrong],
  );

  const handleBackspace = useCallback(() => {
    if (completed || typed.length === 0) return typed;
    ensureStarted();
    const { text } = deleteBackward(typed, typed.length, { normalize: false });
    setTyped(text);
    return text;
  }, [completed, typed, ensureStarted]);

  const setCompositionText = useCallback((preedit: string) => {
    setComposition(preedit);
  }, []);

  const clearComposition = useCallback(() => {
    setComposition("");
  }, []);

  const finish = useCallback(() => {
    setFinishedAt((prev) => prev ?? Date.now());
  }, []);

  const stats: TypingStats = useMemo(() => {
    void tick;
    const end = finishedAt ?? Date.now();
    const elapsed = startedAt === null ? 0 : Math.max((end - startedAt) / 1000, 0);
    const targetLen = Math.max(normalizeKhmer(target).length, 1);
    const progress = target.length > 0 ? Math.min(correct / targetLen, 1) * 100 : 0;

    return {
      elapsed,
      mistakes,
      correct,
      progress,
    };
  }, [tick, finishedAt, startedAt, mistakes, correct, target]);

  const targetClusters = useMemo(() => splitClusters(target), [target]);
  const hintUnit = useMemo(() => nextHintUnit(target, typed), [target, typed]);

  const caretClusterIndex = useMemo(() => {
    const targetNorm = normalizeKhmer(target);
    // Prefer code-unit caret while typed is still a prefix (mid-cluster typing)
    const offset = targetNorm.startsWith(typed)
      ? typed.length
      : mode === "free"
        ? Math.min(
            Math.max(comparison.mismatchOffset, typed.length > 0 ? comparison.mismatchOffset : 0),
            targetNorm.length,
          )
        : correct;

    let at = 0;
    for (let i = 0; i < targetClusters.length; i += 1) {
      const len = targetClusters[i]!.length;
      if (offset < at + len) return i;
      at += len;
    }
    return targetClusters.length;
  }, [comparison, typed, targetClusters, mode, target, correct]);

  return {
    typed,
    target,
    composition,
    mode,
    completed,
    started: startedAt !== null,
    stats,
    comparison,
    unitStates: comparison.unitStates as TypingUnitState[],
    targetClusters,
    caretClusterIndex,
    nextHintUnit: hintUnit,
    nextCluster: targetClusters[caretClusterIndex] ?? null,
    errorIndexes: errorIndexes.current,
    wrongFlash,
    handleCommit,
    handleBackspace,
    setCompositionText,
    clearComposition,
    reset,
    finish,
  };
}
