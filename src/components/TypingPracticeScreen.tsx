import { useState, useEffect, useRef, useCallback } from "react";
import type { Level, Lesson } from "@/data/curriculum";
import { type ProgressMap, lessonKey } from "@/lib/progress";
import { renderableCluster, ZWSP, clusterOffsets } from "@/lib/khmer";
import { keyHintFor, KEY_LABELS } from "@/lib/keymap";
import { KhmerKeyboard } from "@/components/KhmerKeyboard";
import { TypingCaret } from "@/components/TypingCaret";
import {
  playKeySound,
  playRoundCompleteSound,
  playLessonCompleteSound,
  preloadTypingSounds,
  isSoundEnabled,
  setSoundEnabled,
} from "@/lib/sound";
import { useTypingSession } from "@/hooks/useTypingSession";
import { useLessonStats } from "@/hooks/useLessonStats";
import { useCompositionInput } from "@/hooks/useCompositionInput";
import { cn } from "@/lib/utils";
import { Tip } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Clock,
  Keyboard as KeyboardIcon,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Timer,
  Star,
} from "lucide-react";

interface TypingPracticeScreenProps {
  level: Level;
  lesson: Lesson;
  progress: ProgressMap;
  onRecordProgress: (
    levelId: number,
    lessonId: string,
    result: { wpm: number; accuracy: number },
  ) => void;
  onSelectLesson: (level: Level, lesson: Lesson) => void;
  onBackToOverview: () => void;
}

export function TypingPracticeScreen({
  level,
  lesson,
  progress,
  onRecordProgress,
  onSelectLesson,
  onBackToOverview,
}: TypingPracticeScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [lessonResult, setLessonResult] = useState<{
    wpm: number;
    accuracy: number;
    mistakes: number;
    previousBest: { bestWpm: number; bestAccuracy: number } | null;
    timedOut: boolean;
  } | null>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    preloadTypingSounds();
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const recordedRef = useRef(false);
  const linePushedRef = useRef(false);

  const syncInputFocus = useCallback(() => {
    setInputFocused(document.activeElement === inputRef.current);
  }, []);

  useEffect(() => {
    const onFocusIn = () => syncInputFocus();
    const onFocusOut = () => {
      // Wait for the next focused element so we don't flicker during re-focus.
      requestAnimationFrame(syncInputFocus);
    };
    const onWindowBlur = () => setInputFocused(false);

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("blur", onWindowBlur);
    syncInputFocus();

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [syncInputFocus]);

  const currentTargetLine = lesson.lines[lineIndex] ?? lesson.lines[0] ?? "";
  const isLastLine = lineIndex >= lesson.lines.length - 1;
  const isTimedLesson = Boolean(lesson.timeLimit);

  const lessonStats = useLessonStats({
    ...(isTimedLesson && lesson.timeLimit ? { timeLimit: lesson.timeLimit } : {}),
  });

  const session = useTypingSession({
    target: currentTargetLine,
    mode: "strict",
  });

  const {
    typed,
    completed: lineCompleted,
    stats: lineStats,
    targetClusters,
    caretClusterIndex,
    nextHintUnit: hintUnit,
    wrongFlash,
    handleCommit,
    handleBackspace,
    setCompositionText,
    clearComposition,
    reset: resetSession,
    finish: finishSession,
    target: sanitizedTarget,
  } = session;

  const {
    stats: displayStats,
    noteActivity,
    addMistakes,
    setLiveLineCorrect,
    commitLine,
    finish: finishLessonStats,
    reset: resetLessonStats,
    started: lessonStarted,
    snapshot,
  } = lessonStats;

  // Keep lesson live correct in sync with the active line
  useEffect(() => {
    if (linePushedRef.current) return;
    setLiveLineCorrect(lineStats.correct);
  }, [lineStats.correct, setLiveLineCorrect]);

  const clearRoundFlags = useCallback(() => {
    linePushedRef.current = false;
  }, []);

  useEffect(() => {
    setLineIndex(0);
    recordedRef.current = false;
    setShowResultsModal(false);
    setLessonResult(null);
    clearRoundFlags();
    resetLessonStats();
    resetSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset lesson shell only
  }, [lesson.id]);

  // Clear the push guard only after the session has actually reset.
  // Clearing on lineIndex alone races: completed stays true for one render while
  // the guard is false, so handleLineComplete (and round sound) fire twice.
  useEffect(() => {
    if (!lineCompleted) {
      linePushedRef.current = false;
    }
  }, [lineCompleted]);

  const finalizeLesson = useCallback(
    (opts?: { timedOut?: boolean; includeCurrentLine?: boolean }) => {
      if (recordedRef.current) return;
      recordedRef.current = true;

      const now = Date.now();
      finishSession();

      if (opts?.includeCurrentLine && !linePushedRef.current) {
        commitLine(lineStats.correct);
        linePushedRef.current = true;
      }

      finishLessonStats(now);
      const final = snapshot({ now });

      const key = lessonKey(level.id, lesson.id);
      const previousBest = progress[key]
        ? { bestWpm: progress[key]!.bestWpm, bestAccuracy: progress[key]!.bestAccuracy }
        : null;

      setLessonResult({
        wpm: final.wpmRounded,
        accuracy: final.accuracyRounded,
        mistakes: final.mistakes,
        previousBest,
        timedOut: Boolean(opts?.timedOut),
      });

      playLessonCompleteSound();

      onRecordProgress(level.id, lesson.id, {
        wpm: final.wpmRounded,
        accuracy: final.accuracyRounded,
      });

      window.setTimeout(() => {
        setShowResultsModal(true);
      }, 400);
    },
    [
      commitLine,
      finishLessonStats,
      finishSession,
      level.id,
      lesson.id,
      lineStats.correct,
      onRecordProgress,
      progress,
      snapshot,
    ],
  );

  // Timed exam auto-finish from lesson-scoped clock
  useEffect(() => {
    if (!isTimedLesson || !lesson.timeLimit || recordedRef.current) return;
    if (lessonStarted && displayStats.remaining !== null && displayStats.remaining <= 0) {
      finalizeLesson({ timedOut: true, includeCurrentLine: true });
    }
  }, [
    isTimedLesson,
    lesson.timeLimit,
    lessonStarted,
    displayStats.remaining,
    finalizeLesson,
  ]);

  const handleLineComplete = useCallback(() => {
    if (linePushedRef.current) return;
    linePushedRef.current = true;

    commitLine(lineStats.correct);

    if (!isLastLine) {
      playRoundCompleteSound();
      window.setTimeout(() => {
        setLineIndex((prev) => prev + 1);
      }, 400);
    } else {
      finalizeLesson({ timedOut: false, includeCurrentLine: false });
    }
  }, [commitLine, finalizeLesson, isLastLine, lineStats.correct]);

  useEffect(() => {
    if (lineCompleted && !recordedRef.current && !linePushedRef.current) {
      handleLineComplete();
    }
  }, [lineCompleted, handleLineComplete]);

  const onCommit = useCallback(
    (nextValue: string) => {
      const prevLen = typed.length;
      const result = handleCommit(nextValue);
      noteActivity();
      if (result.mistakesAdded > 0) {
        addMistakes(result.mistakesAdded);
      }
      if (!result.accepted) {
        playKeySound(true);
      } else if (result.value.length > prevLen) {
        playKeySound(false);
      }
      return result;
    },
    [addMistakes, handleCommit, noteActivity, typed.length],
  );

  const onBackspace = useCallback(() => {
    noteActivity();
    return handleBackspace();
  }, [handleBackspace, noteActivity]);

  const composition = useCompositionInput({
    inputRef,
    committed: typed,
    completed: lineCompleted || Boolean(lessonResult),
    onCommit,
    onBackspace,
    onCompositionChange: setCompositionText,
    onClearComposition: clearComposition,
  });

  useEffect(() => {
    composition.focus();
  }, [composition, lineIndex]);

  const handleRestart = () => {
    recordedRef.current = false;
    setShowResultsModal(false);
    setLessonResult(null);
    setLineIndex(0);
    clearRoundFlags();
    resetLessonStats();
    resetSession();
    composition.focus();
  };

  const toggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  };

  const handleGoToNextLesson = () => {
    setShowResultsModal(false);
    const currentLessonIdx = level.lessons.findIndex((l) => l.id === lesson.id);
    const nextLesson = currentLessonIdx >= 0 ? level.lessons[currentLessonIdx + 1] : undefined;
    if (nextLesson) {
      onSelectLesson(level, nextLesson);
    } else {
      onBackToOverview();
    }
  };

  const nextChar = hintUnit;
  const nextHint = nextChar ? keyHintFor(nextChar) : null;

  const hudWpm = displayStats.wpmRounded;
  const hudAccuracy = displayStats.accuracyRounded;
  const hudMistakes = displayStats.mistakes;
  const lineProgress = lineStats.progress;

  const resultWpm = lessonResult?.wpm ?? hudWpm;
  const resultAccuracy = lessonResult?.accuracy ?? hudAccuracy;
  const resultMistakes = lessonResult?.mistakes ?? hudMistakes;

  const starsEarned =
    resultAccuracy >= 95 && resultWpm >= 25
      ? 3
      : resultAccuracy >= 85
        ? 2
        : resultAccuracy >= 65
          ? 1
          : 0;

  const targetOffsets = clusterOffsets(sanitizedTarget);
  const typingReady =
    inputFocused && !showResultsModal && !lessonResult && !lineCompleted;
  const needsFocusHint =
    !inputFocused && !showResultsModal && !lessonResult && !lineCompleted;

  return (
    <div
      className="flex min-h-full flex-col bg-background text-foreground"
      onClick={() => {
        if (!showResultsModal) composition.focus();
      }}
    >
      <header className="shrink-0 border-b border-border bg-card/80 px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackToOverview();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="size-4" />
              <span className="km">ត្រលប់</span>
            </button>

            <div className="min-w-0 flex items-center gap-2">
              <span className="km text-sm font-bold text-primary bg-primary-soft px-2.5 py-1 rounded shrink-0">
                {level.badge}
              </span>
              <h2 className="km text-sm sm:text-base font-bold text-foreground truncate">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="hidden sm:flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5"
              role="group"
              aria-label="ទំហំអក្សរ"
            >
              {(
                [
                  { value: "normal", label: "តូច", preview: "text-[10px]" },
                  { value: "large", label: "កណ្ដាល", preview: "text-xs" },
                  { value: "xlarge", label: "ធំ", preview: "text-sm" },
                ] as const
              ).map(({ value, label, preview }) => (
                <Tip key={value} label={`អក្សរ${label}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFontSize(value);
                    }}
                    aria-label={`ទំហំអក្សរ${label}`}
                    aria-pressed={fontSize === value}
                    className={cn(
                      "inline-flex h-7 min-w-8 items-center justify-center rounded-md font-bold leading-none transition-all cursor-pointer",
                      preview,
                      fontSize === value
                        ? "bg-background text-primary shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                    )}
                  >
                    A
                  </button>
                </Tip>
              ))}
            </div>

            <Tip label={soundOn ? "បិទសំឡេង" : "បើកសំឡេង"}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSound();
                }}
                aria-label={soundOn ? "បិទសំឡេង" : "បើកសំឡេង"}
                className={cn(
                  "p-2 rounded-lg border transition-colors cursor-pointer",
                  soundOn
                    ? "border-primary/40 bg-primary-soft text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {soundOn ? <Volume2 className="size-4.5" /> : <VolumeX className="size-4.5" />}
              </button>
            </Tip>

            <Tip label={showKeyboard ? "លាក់ក្ដារចុច" : "បង្ហាញក្ដារចុច"}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowKeyboard(!showKeyboard);
                }}
                aria-label={showKeyboard ? "លាក់ក្ដារចុច" : "បង្ហាញក្ដារចុច"}
                className={cn(
                  "p-2 rounded-lg border transition-colors cursor-pointer",
                  showKeyboard
                    ? "border-primary/40 bg-primary-soft text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                <KeyboardIcon className="size-4.5" />
              </button>
            </Tip>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col justify-start overflow-y-auto px-4 py-[clamp(0.75rem,2dvh,1.25rem)] sm:px-6">
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium">ល្បឿន WPM</span>
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">
              {hudWpm}
            </span>
          </div>

          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium">
              ភាពត្រឹមត្រូវ
            </span>
            <span
              className={cn(
                "font-mono text-2xl sm:text-3xl font-extrabold",
                hudAccuracy >= 90
                  ? "text-success"
                  : hudAccuracy >= 75
                    ? "text-warning"
                    : "text-destructive",
              )}
            >
              {hudAccuracy}%
            </span>
          </div>

          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium">កំហុស</span>
            <span
              className={cn(
                "font-mono text-2xl sm:text-3xl font-extrabold",
                hudMistakes === 0 ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {hudMistakes}
            </span>
          </div>

          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium flex items-center justify-center gap-1.5">
              {lesson.timeLimit ? (
                <Timer className="size-3.5 text-destructive" />
              ) : (
                <Clock className="size-3.5 text-primary" />
              )}
              {lesson.timeLimit ? "ពេលនៅសល់" : "រយៈពេល"}
            </span>
            <span
              className={cn(
                "font-mono text-2xl sm:text-3xl font-extrabold",
                lesson.timeLimit && displayStats.remaining !== null && displayStats.remaining <= 10
                  ? "text-destructive animate-pulse"
                  : "text-foreground",
              )}
            >
              {lesson.timeLimit && displayStats.remaining !== null
                ? `${Math.round(displayStats.remaining)}s`
                : `${Math.round(displayStats.elapsed)}s`}
            </span>
          </div>
        </div>

        {/* Fixed-height slot: live key hints must not reflow content below */}
        <div className="flex h-8 items-center justify-between gap-3 px-1 mb-2.5 overflow-hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 whitespace-nowrap">
            <span className="shrink-0 text-sm text-muted-foreground km font-medium">គ្រាប់ចុច៖</span>
            {nextChar ? (
              <>
                <span className="inline-flex h-7 w-[11.5rem] shrink-0 items-center gap-1.5 overflow-hidden font-bold text-primary">
                  {nextChar === ZWSP ? (
                    <>
                      <span className="km text-sm sm:text-base font-semibold">Space</span>
                      <span className="km text-xs font-medium text-muted-foreground">(ZWSP)</span>
                    </>
                  ) : nextChar === " " ? (
                    <>
                      <span className="km text-sm sm:text-base font-semibold">Shift + Space</span>
                      <span className="km text-xs font-medium text-muted-foreground">(ដកឃ្លា)</span>
                    </>
                  ) : (
                    <span className="font-khmer text-base sm:text-lg leading-none">
                      {renderableCluster(nextChar)}
                    </span>
                  )}
                </span>
                <span className="inline-flex h-7 w-[8.75rem] shrink-0 items-center justify-center overflow-hidden font-mono text-sm font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 rounded-md">
                  {nextChar === ZWSP
                    ? "Space"
                    : nextChar === " "
                      ? "Shift + Space"
                      : nextHint
                        ? nextHint.shift
                          ? `Shift + ${KEY_LABELS[nextHint.code] ?? nextHint.code}`
                          : (KEY_LABELS[nextHint.code] ?? nextHint.code)
                        : "\u00A0"}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground/50" aria-hidden>
                —
              </span>
            )}
          </div>

          <div className="shrink-0 text-sm text-muted-foreground font-mono font-medium tabular-nums">
            {Math.round(lineProgress)}%
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${lineProgress}%` }}
            />
          </div>

          <div
            className={cn(
              "relative card-elevated p-6 sm:p-8 min-h-[150px] sm:min-h-[180px] flex flex-col justify-center cursor-text transition-all",
              needsFocusHint && "ring-1 ring-primary/25",
            )}
            onClick={(e) => {
              e.stopPropagation();
              composition.focus();
            }}
          >
            {/* Near-prompt input so OS Khmer IME UI positions correctly */}
            <input
              ref={inputRef}
              type="text"
              defaultValue={typed}
              className="absolute inset-x-6 bottom-3 h-px w-[calc(100%-3rem)] opacity-0 caret-transparent"
              autoFocus
              aria-label="Khmer typing input"
              {...composition.inputProps}
              onFocus={() => setInputFocused(true)}
              onBlur={() => {
                requestAnimationFrame(() => {
                  setInputFocused(document.activeElement === inputRef.current);
                });
              }}
            />

            <div
              ref={promptRef}
              className={cn(
                "relative km font-khmer leading-loose select-none break-words whitespace-pre-wrap text-left transition-all",
                fontSize === "normal" && "text-lg sm:text-xl",
                fontSize === "large" && "text-2xl sm:text-3xl",
                fontSize === "xlarge" && "text-3xl sm:text-4xl",
                needsFocusHint && "opacity-70",
              )}
            >
              <TypingCaret
                containerRef={promptRef}
                clusterIndex={caretClusterIndex}
                active={typingReady}
                wrong={wrongFlash}
              />

              {targetClusters.map((cluster, index) => {
                const start = targetOffsets[index] ?? 0;
                const end = start + cluster.length;
                const isCurrent = index === caretClusterIndex;
                const isZwsp = cluster === ZWSP;
                const isSpace = cluster === " " || isZwsp;
                const displayChar = isSpace ? "\u00A0" : cluster;

                // Code-unit progress (matches metrics + mid-cluster caret)
                const progressOffset = lineStats.correct;
                const fullyCorrect = end <= progressOffset;

                const glyphClassName = cn(
                  "relative inline transition-colors",
                  isSpace && "inline-block min-w-[0.28em] text-center",
                  fullyCorrect && "text-primary",
                  isCurrent && wrongFlash && "text-destructive",
                  !fullyCorrect && !isCurrent && "text-foreground/70",
                  isSpace && !fullyCorrect && "text-muted-foreground/50",
                );

                if (isZwsp) {
                  return (
                    <Tip key={`${start}-${index}`} label="Space (ZWSP)">
                      <span data-cluster-index={index} className={glyphClassName}>
                        {displayChar}
                      </span>
                    </Tip>
                  );
                }

                return (
                  <span key={`${start}-${index}`} data-cluster-index={index} className={glyphClassName}>
                    {displayChar}
                  </span>
                );
              })}
            </div>

            {needsFocusHint && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/70 backdrop-blur-[2px]">
                <p className="km rounded-xl border border-primary/30 bg-card px-4 py-2 text-base font-bold text-foreground shadow-md">
                  ចុចទីនេះដើម្បីវាយ
                </p>
              </div>
            )}
          </div>
        </div>

        {showKeyboard && (
          <div className="mt-3 flex w-full min-h-0 flex-1 items-center justify-center sm:mt-4">
            <KhmerKeyboard
              className="w-full"
              {...(nextChar ? { nextChar } : {})}
            />
          </div>
        )}
      </main>

      {showResultsModal && lessonResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-elevated max-w-sm w-full p-4 sm:p-5 bg-card border-border shadow-lg text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2.5">
              <Trophy className="size-5" />
            </div>

            <h3 className="km text-2xl sm:text-3xl font-bold text-foreground">
              {lessonResult.timedOut ? "អស់ពេល!" : "អបអរសាទរ!"}
            </h3>
            <p className="km text-sm sm:text-base text-muted-foreground mt-1">
              {level.badge} › {lesson.title}
            </p>

            <div className="mt-2.5 flex items-center justify-center gap-1">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "size-4.5",
                    star <= starsEarned ? "fill-warning text-warning" : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-lg bg-secondary/50 p-2.5 text-center">
              <div>
                <span className="km text-sm text-muted-foreground block font-medium">ល្បឿន</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-primary">
                  {resultWpm} WPM
                </span>
              </div>
              <div>
                <span className="km text-sm text-muted-foreground block font-medium">
                  ភាពត្រឹមត្រូវ
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-success">
                  {resultAccuracy}%
                </span>
              </div>
              <div>
                <span className="km text-sm text-muted-foreground block font-medium">កំហុស</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-destructive">
                  {resultMistakes}
                </span>
              </div>
            </div>

            {lessonResult.previousBest && (
              <p className="km text-sm text-muted-foreground mt-2.5 font-medium">
                កំណត់ត្រាលើកមុន៖ {lessonResult.previousBest.bestWpm} WPM ·{" "}
                {lessonResult.previousBest.bestAccuracy}%
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleGoToNextLesson}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer km"
              >
                <Sparkles className="size-4" />
                <span>បន្តទៅមេរៀនបន្ទាប់</span>
              </button>

              <button
                onClick={handleRestart}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer km"
              >
                <RotateCcw className="size-3.5" />
                <span>ហាត់មេរៀននេះឡើងវិញ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
