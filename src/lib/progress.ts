/**
 * Lesson progress, stored locally per browser. Deliberately tiny and
 * side-effect free so it can be swapped for a server-backed store later.
 */

import { useCallback, useEffect, useState } from "react";

export type LessonRecord = {
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
};

export type ProgressMap = Record<string, LessonRecord>;

const STORAGE_KEY = "krumath-khmer-typing-progress-v1";

export function lessonKey(levelId: number, lessonId: string): string {
  return `${levelId}:${lessonId}`;
}

function read(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — progress is best effort */
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProgress(read());
    setLoaded(true);
  }, []);

  const record = useCallback(
    (levelId: number, lessonId: string, result: { wpm: number; accuracy: number }) => {
      setProgress((prev) => {
        const key = lessonKey(levelId, lessonId);
        const existing = prev[key];
        const next: ProgressMap = {
          ...prev,
          [key]: {
            completed: true,
            bestWpm: Math.max(existing?.bestWpm ?? 0, Math.round(result.wpm)),
            bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, Math.round(result.accuracy)),
          },
        };
        write(next);
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setProgress({});
    write({});
  }, []);

  return { progress, loaded, record, reset };
}

export function levelCompletion(
  progress: ProgressMap,
  levelId: number,
  lessonIds: string[],
): number {
  if (lessonIds.length === 0) return 0;
  const done = lessonIds.filter((id) => progress[lessonKey(levelId, id)]?.completed).length;
  return Math.round((done / lessonIds.length) * 100);
}
