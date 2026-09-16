/**
 * Lesson progress, stored locally per browser.
 *
 * ---------------------------------------------------------------------------
 * FUTURE (KruMath Supabase sync) — not implemented yet
 * ---------------------------------------------------------------------------
 * When a playable (non-anonymous) Supabase user is signed in via shared
 * `.krumath.com` cookies, persist progress to the same Supabase project as
 * KruMath so progress follows the account across devices.
 *
 * Suggested shape (table name TBD, e.g. `khmer_typing_progress`):
 *   - user_id (uuid, PK / FK to auth.users)
 *   - progress jsonb  — same ProgressMap shape as below
 *   - updated_at timestamptz
 *
 * Merge strategy when loading:
 *   - completed: union (true if either side completed)
 *   - bestWpm / bestAccuracy: max of local vs remote per lesson key
 *
 * Wire-up sketch:
 *   1. On mount (client): if playable user → fetch remote → merge into local → write both
 *   2. On `record()`: write localStorage, then call syncProgressToSupabase (debounced)
 *   3. Gate cloud sync with `requireSignedInForAction` only if you add an explicit
 *      "Save to account" control; silent sync can use getBrowserUser() without redirect
 *
 * Do not implement the table/RLS here until product is ready.
 * ---------------------------------------------------------------------------
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

/**
 * Placeholder for future cloud sync. No-op today.
 * When ready: upsert ProgressMap for the signed-in KruMath Supabase user.
 */
export async function syncProgressToSupabase(
  _userId: string,
  _progress: ProgressMap,
): Promise<void> {
  // TODO(krumath-sync): implement Supabase upsert when cloud progress ships.
  void _userId;
  void _progress;
}

/**
 * Placeholder for future cloud load. Returns null today (use localStorage only).
 */
export async function loadProgressFromSupabase(_userId: string): Promise<ProgressMap | null> {
  // TODO(krumath-sync): fetch remote progress when cloud progress ships.
  void _userId;
  return null;
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProgress(read());
    setLoaded(true);

    // TODO(krumath-sync): if playable KruMath user is signed in, load remote
    // progress, merge with local (max WPM/accuracy, union completed), write both.
    // Example:
    //   const user = await getBrowserUser();
    //   if (isPlayableUser(user)) {
    //     const remote = await loadProgressFromSupabase(user.id);
    //     const merged = mergeProgress(read(), remote ?? {});
    //     write(merged);
    //     setProgress(merged);
    //     await syncProgressToSupabase(user.id, merged);
    //   }
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
        // TODO(krumath-sync): if playable user signed in, debounce
        // syncProgressToSupabase(user.id, next) so cloud stays up to date.
        return next;
      });
    },
    [],
  );

  return { progress, loaded, record };
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
