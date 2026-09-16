import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  computeLessonMetrics,
  roundStat,
  type LessonMetrics,
} from "@/lib/typing-metrics";

export type LessonDisplayStats = LessonMetrics & {
  remaining: number | null;
  /** Rounded values for HUD / modal / progress recording */
  wpmRounded: number;
  accuracyRounded: number;
};

export type UseLessonStatsOptions = {
  timeLimit?: number;
};

type SnapshotOpts = {
  /** Include this line's correct count (e.g. timeout mid-line). */
  includeLineCorrect?: number;
  /** Force finished clock to this timestamp. */
  now?: number;
};

/**
 * Lesson-scoped typing totals. Survives line changes; resets only on reset().
 * Single clock for timed remaining and WPM — never per-line.
 */
export function useLessonStats(options: UseLessonStatsOptions = {}) {
  const { timeLimit } = options;

  const [lessonStartedAt, setLessonStartedAt] = useState<number | null>(null);
  const [lessonFinishedAt, setLessonFinishedAt] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [completedCorrect, setCompletedCorrect] = useState(0);
  const [currentLineCorrect, setCurrentLineCorrect] = useState(0);
  const [tick, setTick] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const finishedAtRef = useRef<number | null>(null);
  const mistakesRef = useRef(0);
  const completedCorrectRef = useRef(0);
  const currentLineCorrectRef = useRef(0);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    finishedAtRef.current = null;
    mistakesRef.current = 0;
    completedCorrectRef.current = 0;
    currentLineCorrectRef.current = 0;
    setLessonStartedAt(null);
    setLessonFinishedAt(null);
    setMistakes(0);
    setCompletedCorrect(0);
    setCurrentLineCorrect(0);
    setTick(0);
  }, []);

  const noteActivity = useCallback((now = Date.now()) => {
    if (startedAtRef.current === null) {
      startedAtRef.current = now;
      setLessonStartedAt(now);
    }
  }, []);

  const addMistakes = useCallback((n: number) => {
    if (n <= 0) return;
    mistakesRef.current += n;
    setMistakes(mistakesRef.current);
  }, []);

  /** Sync live correct from the active line (code-unit count). */
  const setLiveLineCorrect = useCallback((correctChars: number) => {
    const next = Math.max(0, correctChars);
    currentLineCorrectRef.current = next;
    setCurrentLineCorrect(next);
  }, []);

  /** Fold the finished line into completedCorrect and clear the live line slot. */
  const commitLine = useCallback((correctChars: number) => {
    const add = Math.max(0, correctChars);
    completedCorrectRef.current += add;
    currentLineCorrectRef.current = 0;
    setCompletedCorrect(completedCorrectRef.current);
    setCurrentLineCorrect(0);
  }, []);

  const finish = useCallback((now = Date.now()) => {
    if (finishedAtRef.current === null) {
      finishedAtRef.current = now;
      setLessonFinishedAt(now);
    }
  }, []);

  /** Synchronous metrics for finalize — immune to React batching lag. */
  const snapshot = useCallback(
    (opts?: SnapshotOpts): LessonDisplayStats => {
      const now = opts?.now ?? Date.now();
      const started = startedAtRef.current;
      const end = finishedAtRef.current ?? now;
      const elapsedSec = started === null ? 0 : Math.max((end - started) / 1000, 0);

      const correct =
        opts?.includeLineCorrect !== undefined
          ? completedCorrectRef.current + Math.max(0, opts.includeLineCorrect)
          : completedCorrectRef.current + currentLineCorrectRef.current;

      const base = computeLessonMetrics({
        correct,
        mistakes: mistakesRef.current,
        elapsedSec,
      });

      const remaining =
        timeLimit != null && started !== null
          ? Math.max(timeLimit - elapsedSec, 0)
          : (timeLimit ?? null);

      return {
        ...base,
        remaining,
        wpmRounded: roundStat(base.wpm),
        accuracyRounded: roundStat(base.accuracy),
      };
    },
    [timeLimit],
  );

  const finished = lessonFinishedAt !== null;

  useEffect(() => {
    if (lessonStartedAt === null || finished) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [lessonStartedAt, finished]);

  const liveCorrect = completedCorrect + currentLineCorrect;

  const stats: LessonDisplayStats = useMemo(() => {
    void tick;
    const end = lessonFinishedAt ?? Date.now();
    const elapsedSec =
      lessonStartedAt === null ? 0 : Math.max((end - lessonStartedAt) / 1000, 0);

    const base = computeLessonMetrics({
      correct: liveCorrect,
      mistakes,
      elapsedSec,
    });

    const remaining =
      timeLimit != null && lessonStartedAt !== null
        ? Math.max(timeLimit - elapsedSec, 0)
        : (timeLimit ?? null);

    return {
      ...base,
      remaining,
      wpmRounded: roundStat(base.wpm),
      accuracyRounded: roundStat(base.accuracy),
    };
  }, [
    tick,
    lessonFinishedAt,
    lessonStartedAt,
    liveCorrect,
    mistakes,
    timeLimit,
  ]);

  return {
    stats,
    finished,
    started: lessonStartedAt !== null,
    completedCorrect,
    liveCorrect,
    noteActivity,
    addMistakes,
    setLiveLineCorrect,
    commitLine,
    finish,
    reset,
    snapshot,
  };
}
