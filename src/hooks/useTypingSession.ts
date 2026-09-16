import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { countWords } from "@/lib/khmer";

export type TypingStats = {
  elapsed: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  mistakes: number;
  correct: number;
  progress: number;
  remaining: number | null;
};

export type TypingSession = ReturnType<typeof useTypingSession>;

/**
 * Comparison-only typing engine: input arrives already composed by the
 * platform Khmer IME, so the session compares Unicode code units against the
 * target and derives stats. No key remapping happens here, which keeps
 * subscripts, stacked coeng, ZWSP and AltGr sequences correct by construction.
 */
export function useTypingSession(target: string, timeLimit?: number) {
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [tick, setTick] = useState(0);
  const errorIndexes = useRef<Set<number>>(new Set());

  const reset = useCallback(() => {
    setTyped("");
    setStartedAt(null);
    setFinishedAt(null);
    setMistakes(0);
    setTick(0);
    errorIndexes.current = new Set();
  }, []);

  // restart when the target changes
  useEffect(() => {
    reset();
  }, [target, reset]);

  const completed = finishedAt !== null;

  useEffect(() => {
    if (startedAt === null || completed) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [startedAt, completed]);

  const handleChange = useCallback(
    (value: string) => {
      if (completed) return;

      const now = Date.now();
      if (startedAt === null && value.length > 0) setStartedAt(now);

      if (value.length > typed.length) {
        for (let i = typed.length; i < value.length; i += 1) {
          if (value[i] !== target[i]) {
            errorIndexes.current.add(i);
            setMistakes((m) => m + 1);
          }
        }
      }

      setTyped(value);

      if (value === target) setFinishedAt(now);
    },
    [completed, startedAt, target, typed.length],
  );

  const finish = useCallback(() => {
    setFinishedAt((prev) => prev ?? Date.now());
  }, []);

  const stats: TypingStats = useMemo(() => {
    void tick;
    const end = finishedAt ?? Date.now();
    const elapsed = startedAt === null ? 0 : Math.max((end - startedAt) / 1000, 0);

    let correct = 0;
    for (let i = 0; i < typed.length; i += 1) {
      if (typed[i] === target[i]) correct += 1;
    }

    const minutes = elapsed / 60;
    const cpm = minutes > 0 ? correct / minutes : 0;
    const typedWords = countWords(target.slice(0, correct));
    const wpm = minutes > 0 ? typedWords / minutes : 0;
    const accuracy = typed.length > 0 ? (correct / typed.length) * 100 : 100;
    const progress = target.length > 0 ? Math.min(correct / target.length, 1) * 100 : 0;
    const remaining =
      timeLimit && startedAt !== null ? Math.max(timeLimit - elapsed, 0) : timeLimit ?? null;

    return { elapsed, wpm, cpm, accuracy, mistakes, correct, progress, remaining };
  }, [tick, finishedAt, startedAt, typed, target, mistakes, timeLimit]);

  // auto-finish on time limit
  useEffect(() => {
    if (!timeLimit || completed || startedAt === null) return;
    if (stats.remaining !== null && stats.remaining <= 0) finish();
  }, [timeLimit, completed, startedAt, stats.remaining, finish]);

  return {
    typed,
    target,
    completed,
    started: startedAt !== null,
    stats,
    errorIndexes: errorIndexes.current,
    handleChange,
    reset,
    finish,
  };
}
