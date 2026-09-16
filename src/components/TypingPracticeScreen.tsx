import { useState, useEffect, useRef, useCallback } from "react";
import type { Level, Lesson } from "@/data/curriculum";
import { type ProgressMap, lessonKey } from "@/lib/progress";
import { renderableCluster, ZWSP, splitClusters, clusterOffsets } from "@/lib/khmer";
import { keyHintFor, KEY_LABELS } from "@/lib/keymap";
import { KhmerKeyboard } from "@/components/KhmerKeyboard";
import { playKeySound, isSoundEnabled, setSoundEnabled } from "@/lib/sound";
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
  const [wrongFlash, setWrongFlash] = useState(false);
  const [lessonResult, setLessonResult] = useState<{
    wpm: number;
    accuracy: number;
    mistakes: number;
    previousBest: { bestWpm: number; bestAccuracy: number } | null;
    timedOut: boolean;
  } | null>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const roundResults = useRef<Array<{ correctChars: number; mistakes: number; elapsed: number }>>(
    [],
  );
  const recordedRef = useRef(false);
  const typedRef = useRef("");
  const mistakesRef = useRef(0);
  const elapsedRef = useRef(0);
  const linePushedRef = useRef(false);
  const lineStartedElapsedRef = useRef(0);
  const lessonCorrectRef = useRef(0);
  const wrongFlashTimerRef = useRef<number | null>(null);

  const currentTargetLine = lesson.lines[lineIndex] ?? lesson.lines[0] ?? "";
  const isLastLine = lineIndex >= lesson.lines.length - 1;
  const isTimedLesson = Boolean(lesson.timeLimit);

  const [typed, setTyped] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);

  const timerRef = useRef<number | null>(null);

  typedRef.current = typed;
  mistakesRef.current = mistakes;
  elapsedRef.current = elapsedSeconds;

  const clearRoundTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetLineState = useCallback(() => {
    setTyped("");
    setMistakes(0);
    setIsCompleted(false);
    setWrongFlash(false);
    linePushedRef.current = false;
  }, []);

  const resetTimer = useCallback(() => {
    setStartTime(null);
    setElapsedSeconds(0);
    clearRoundTimer();
  }, [clearRoundTimer]);

  useEffect(() => {
    setLineIndex(0);
    roundResults.current = [];
    recordedRef.current = false;
    lessonCorrectRef.current = 0;
    lineStartedElapsedRef.current = 0;
    setShowResultsModal(false);
    setLessonResult(null);
    setLessonFinished(false);
    resetLineState();
    resetTimer();
  }, [lesson.id, resetLineState, resetTimer]);

  useEffect(() => {
    resetLineState();
    lineStartedElapsedRef.current = isTimedLesson ? elapsedRef.current : 0;
    // Untimed lessons: each line has its own timer. Timed exams keep one clock.
    if (!isTimedLesson) {
      resetTimer();
    }
  }, [lineIndex, isTimedLesson, resetLineState, resetTimer]);

  const computeFromTotals = useCallback(
    (correctChars: number, mistakeCount: number, elapsed: number) => {
      const effectiveSecs = Math.max(elapsed, 0.5);
      const minutes = effectiveSecs / 60;
      const wpm = Math.round(correctChars / minutes / 5);
      const totalKeypresses = correctChars + mistakeCount;
      const accuracy =
        totalKeypresses > 0
          ? Math.max(0, Math.min(100, Math.round((correctChars / totalKeypresses) * 100)))
          : 100;
      return { wpm, accuracy, mistakes: mistakeCount };
    },
    [],
  );

  const finalizeLesson = useCallback(
    (opts?: { timedOut?: boolean; includeCurrentLine?: boolean }) => {
      if (recordedRef.current) return;
      recordedRef.current = true;

      clearRoundTimer();
      setIsCompleted(true);
      setLessonFinished(true);

      if (opts?.includeCurrentLine && !linePushedRef.current) {
        const lineElapsed = Math.max(
          elapsedRef.current - lineStartedElapsedRef.current,
          typedRef.current.length > 0 || mistakesRef.current > 0 ? 0.5 : 0,
        );
        roundResults.current.push({
          correctChars: typedRef.current.length,
          mistakes: mistakesRef.current,
          elapsed: lineElapsed,
        });
        linePushedRef.current = true;
      }

      const allRounds = roundResults.current;
      const totalCorrect = allRounds.reduce((acc, r) => acc + r.correctChars, 0);
      const totalMistakes = allRounds.reduce((acc, r) => acc + r.mistakes, 0);
      const totalElapsed = isTimedLesson
        ? Math.max(elapsedRef.current, 0.5)
        : Math.max(
            allRounds.reduce((acc, r) => acc + r.elapsed, 0),
            0.5,
          );

      const { wpm: finalWpm, accuracy: finalAccuracy } = computeFromTotals(
        totalCorrect,
        totalMistakes,
        totalElapsed,
      );

      const key = lessonKey(level.id, lesson.id);
      const previousBest = progress[key]
        ? { bestWpm: progress[key]!.bestWpm, bestAccuracy: progress[key]!.bestAccuracy }
        : null;

      setLessonResult({
        wpm: finalWpm,
        accuracy: finalAccuracy,
        mistakes: totalMistakes,
        previousBest,
        timedOut: Boolean(opts?.timedOut),
      });

      onRecordProgress(level.id, lesson.id, {
        wpm: finalWpm,
        accuracy: finalAccuracy,
      });

      window.setTimeout(() => {
        setShowResultsModal(true);
      }, 400);
    },
    [
      clearRoundTimer,
      computeFromTotals,
      isTimedLesson,
      level.id,
      lesson.id,
      onRecordProgress,
      progress,
    ],
  );

  useEffect(() => {
    if (!startTime || lessonFinished) return;
    if (!isTimedLesson && isCompleted) return;

    timerRef.current = window.setInterval(() => {
      const now = Date.now();
      const secs = (now - startTime) / 1000;
      setElapsedSeconds(secs);

      if (lesson.timeLimit && secs >= lesson.timeLimit) {
        clearRoundTimer();
        finalizeLesson({ timedOut: true, includeCurrentLine: true });
      }
    }, 200);

    return () => {
      clearRoundTimer();
    };
  }, [
    startTime,
    isCompleted,
    lessonFinished,
    isTimedLesson,
    lesson.timeLimit,
    clearRoundTimer,
    finalizeLesson,
  ]);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput, lineIndex]);

  const flashWrong = useCallback(() => {
    setWrongFlash(true);
    if (wrongFlashTimerRef.current) {
      window.clearTimeout(wrongFlashTimerRef.current);
    }
    wrongFlashTimerRef.current = window.setTimeout(() => {
      setWrongFlash(false);
      wrongFlashTimerRef.current = null;
    }, 160);
  }, []);

  const handleLineComplete = useCallback(
    (finalTyped: string, lineMistakes: number) => {
      if (linePushedRef.current) return;
      linePushedRef.current = true;
      setIsCompleted(true);

      if (!isTimedLesson) {
        clearRoundTimer();
      }

      const lineElapsed = isTimedLesson
        ? Math.max(elapsedRef.current - lineStartedElapsedRef.current, 0.5)
        : Math.max(elapsedRef.current, 0.5);

      roundResults.current.push({
        correctChars: finalTyped.length,
        mistakes: lineMistakes,
        elapsed: lineElapsed,
      });
      lessonCorrectRef.current += finalTyped.length;

      if (!isLastLine) {
        window.setTimeout(() => {
          setLineIndex((prev) => prev + 1);
        }, 400);
      } else {
        finalizeLesson({ timedOut: false, includeCurrentLine: false });
      }
    },
    [clearRoundTimer, finalizeLesson, isLastLine, isTimedLesson],
  );

  const currentTargetChar = currentTargetLine[typed.length] ?? "";

  const handleChange = (nextValue: string) => {
    if (isCompleted || lessonFinished) return;

    if (!startTime && nextValue.length > 0) {
      setStartTime(Date.now());
    }

    // Backspace — allow deleting correct progress
    if (nextValue.length < typed.length) {
      setTyped(nextValue);
      return;
    }

    if (nextValue.length === typed.length) return;

    // Accept only when the new value is still an exact prefix of the target
    if (currentTargetLine.startsWith(nextValue)) {
      playKeySound(false);
      setTyped(nextValue);

      if (nextValue.length >= currentTargetLine.length) {
        handleLineComplete(nextValue, mistakesRef.current);
      }
      return;
    }

    // Wrong key — count mistake, do not advance
    playKeySound(true);
    setMistakes((prev) => prev + 1);
    flashWrong();
    if (inputRef.current) {
      inputRef.current.value = typed;
    }
  };

  const calculateStats = useCallback(() => {
    const finishedMistakes = roundResults.current.reduce((acc, r) => acc + r.mistakes, 0);
    const correctChars = isTimedLesson ? lessonCorrectRef.current + typed.length : typed.length;
    const mistakeCount = isTimedLesson ? finishedMistakes + mistakes : mistakes;
    const effectiveSecs = Math.max(elapsedSeconds, 0.5);
    const minutes = effectiveSecs / 60;
    const cpm = minutes > 0 ? correctChars / minutes : 0;
    const wpm = cpm / 5;

    const totalKeypresses = correctChars + mistakeCount;
    const accuracy =
      totalKeypresses > 0
        ? Math.max(0, Math.min(100, Math.round((correctChars / totalKeypresses) * 100)))
        : 100;

    const progress =
      currentTargetLine.length > 0
        ? Math.min(100, Math.round((typed.length / currentTargetLine.length) * 100))
        : 0;

    const remaining = lesson.timeLimit ? Math.max(0, lesson.timeLimit - elapsedSeconds) : null;

    return {
      wpm,
      cpm,
      accuracy,
      mistakes: mistakeCount,
      progress,
      elapsed: elapsedSeconds,
      remaining,
    };
  }, [
    typed.length,
    mistakes,
    elapsedSeconds,
    currentTargetLine.length,
    lesson.timeLimit,
    isTimedLesson,
  ]);

  const handleRestart = () => {
    recordedRef.current = false;
    roundResults.current = [];
    lessonCorrectRef.current = 0;
    lineStartedElapsedRef.current = 0;
    setShowResultsModal(false);
    setLessonResult(null);
    setLessonFinished(false);
    setLineIndex(0);
    resetLineState();
    resetTimer();
    focusInput();
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

  const stats = calculateStats();
  const nextChar = currentTargetChar;
  const nextHint = nextChar ? keyHintFor(nextChar) : null;

  const resultWpm = lessonResult?.wpm ?? Math.round(stats.wpm);
  const resultAccuracy = lessonResult?.accuracy ?? Math.round(stats.accuracy);
  const resultMistakes = lessonResult?.mistakes ?? stats.mistakes;

  const starsEarned =
    resultAccuracy >= 95 && resultWpm >= 25
      ? 3
      : resultAccuracy >= 85
        ? 2
        : resultAccuracy >= 65
          ? 1
          : 0;

  const targetClusters = splitClusters(currentTargetLine);
  const targetOffsets = clusterOffsets(currentTargetLine);

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col justify-between"
      onClick={focusInput}
    >
      {/* Clean Top Bar */}
      <header className="border-b border-border bg-card/80 px-4 sm:px-6 py-3">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          {/* Left: Back & Title */}
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

            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="km text-sm font-bold text-primary bg-primary-soft px-2.5 py-1 rounded shrink-0">
                  {level.badge}
                </span>
                <h2 className="km text-sm sm:text-base font-bold text-foreground truncate">
                  {lesson.title}
                </h2>
              </div>
              {lesson.hint && (
                <p className="km text-xs sm:text-sm text-muted-foreground truncate pl-0.5">
                  {lesson.hint}
                </p>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Font size */}
            <div
              className="hidden sm:flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-0.5"
              role="group"
              aria-label="ទំហំអក្សរ"
            >
              {(
                [
                  { value: "normal", label: "តូច", preview: "text-[10px]" },
                  { value: "large", label: "កណ្តាល", preview: "text-xs" },
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

            {/* Audio Toggle */}
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

            {/* Keyboard Guide Toggle */}
            <Tip label={showKeyboard ? "លាក់ក្តារចុច" : "បង្ហាញក្តារចុច"}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowKeyboard(!showKeyboard);
                }}
                aria-label={showKeyboard ? "លាក់ក្តារចុច" : "បង្ហាញក្តារចុច"}
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

      {/* Main Practice Area */}
      <main className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-5 flex-1 flex flex-col justify-start">
        {/* HUD Stats */}
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium">ល្បឿន WPM</span>
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">
              {Math.round(stats.wpm)}
            </span>
          </div>

          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium">
              ភាពត្រឹមត្រូវ
            </span>
            <span
              className={cn(
                "font-mono text-2xl sm:text-3xl font-extrabold",
                stats.accuracy >= 90
                  ? "text-success"
                  : stats.accuracy >= 75
                    ? "text-warning"
                    : "text-destructive",
              )}
            >
              {Math.round(stats.accuracy)}%
            </span>
          </div>

          <div className="card-elevated p-3 text-center">
            <span className="km text-sm text-muted-foreground block font-medium">កំហុស</span>
            <span
              className={cn(
                "font-mono text-2xl sm:text-3xl font-extrabold",
                stats.mistakes === 0 ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {stats.mistakes}
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
                lesson.timeLimit && stats.remaining !== null && stats.remaining <= 10
                  ? "text-destructive animate-pulse"
                  : "text-foreground",
              )}
            >
              {lesson.timeLimit && stats.remaining !== null
                ? `${Math.round(stats.remaining)}s`
                : `${Math.round(stats.elapsed)}s`}
            </span>
          </div>
        </div>

        {/* Next Key Indicator Pill (clean & compact) */}
        {nextChar && (
          <div className="flex items-center justify-between px-1 mb-2.5">
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-muted-foreground km font-medium">គ្រាប់ចុច:</span>
              {nextChar === ZWSP ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                  <span className="km text-sm sm:text-base font-semibold">Space</span>
                  <span className="km text-xs font-medium text-muted-foreground">(ZWSP)</span>
                </span>
              ) : nextChar === " " ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                  <span className="km text-sm sm:text-base font-semibold">Shift + Space</span>
                  <span className="km text-xs font-medium text-muted-foreground">(ដកឃ្លា)</span>
                </span>
              ) : (
                <span className="font-bold text-primary text-base sm:text-lg font-khmer">
                  {renderableCluster(nextChar)}
                </span>
              )}
              {nextHint && nextChar !== ZWSP && nextChar !== " " && (
                <span className="font-mono text-sm font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md">
                  {nextHint.shift
                    ? `Shift + ${KEY_LABELS[nextHint.code] ?? nextHint.code}`
                    : (KEY_LABELS[nextHint.code] ?? nextHint.code)}
                </span>
              )}
              {nextChar === ZWSP && (
                <span className="font-mono text-sm font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md">
                  Space
                </span>
              )}
              {nextChar === " " && (
                <span className="font-mono text-sm font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md">
                  Shift + Space
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground font-mono font-medium">
              {stats.progress}%
            </div>
          </div>
        )}

        {/* Typing Stage Box */}
        <div className="flex flex-col gap-2">
          {/* Progress bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-150"
              style={{ width: `${stats.progress}%` }}
            />
          </div>

          <div
            className="relative card-elevated p-6 sm:p-8 min-h-[150px] sm:min-h-[180px] flex flex-col justify-center cursor-text transition-all"
            onClick={focusInput}
          >
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => handleChange(e.target.value)}
              className="absolute opacity-0 pointer-events-none -top-1000 left-0"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
              aria-label="Khmer typing input"
            />

            {/* Target Text — render by typographic cluster so vowels stay attached */}
            <div
              className={cn(
                "km font-khmer leading-loose select-none break-words whitespace-pre-wrap text-left transition-all",
                fontSize === "normal" && "text-lg sm:text-xl",
                fontSize === "large" && "text-2xl sm:text-3xl",
                fontSize === "xlarge" && "text-3xl sm:text-4xl",
              )}
            >
              {targetClusters.map((cluster, index) => {
                const start = targetOffsets[index] ?? 0;
                const end = start + cluster.length;
                const typedInCluster = typed.slice(start, Math.min(typed.length, end));
                const expectedSoFar = cluster.slice(0, typedInCluster.length);
                const fullyTyped = typed.length >= end;
                const isCurrent = typed.length >= start && typed.length < end;
                const isCorrect = fullyTyped && typed.slice(start, end) === cluster;
                const isWrong = typedInCluster.length > 0 && typedInCluster !== expectedSoFar;
                const isZwsp = cluster === ZWSP;
                const isSpace = cluster === " " || isZwsp;
                // Render ZWSP as a blank gap (same as normal space) — type with Space on Khmer IME
                const displayChar = isSpace ? "\u00A0" : cluster;

                const glyphClassName = cn(
                  "relative inline transition-colors",
                  // Keep a narrow natural gap — close to default word spacing
                  isSpace && "inline-block min-w-[0.28em] text-center",
                  isCorrect && "text-primary",
                  isWrong && "text-destructive line-through",
                  isCurrent &&
                    wrongFlash &&
                    "text-destructive after:absolute after:left-0 after:top-[0.15em] after:bottom-[0.1em] after:w-[2px] after:rounded-full after:bg-destructive",
                  isCurrent &&
                    !isWrong &&
                    !wrongFlash &&
                    "text-foreground after:absolute after:left-0 after:top-[0.15em] after:bottom-[0.1em] after:w-[2px] after:rounded-full after:bg-primary after:animate-pulse",
                  !fullyTyped && !isCurrent && !isWrong && "text-foreground/70",
                  isSpace && !isCorrect && !isWrong && "text-muted-foreground/50",
                );

                if (isZwsp) {
                  return (
                    <Tip key={`${start}-${index}`} label="Space (ZWSP)">
                      <span className={glyphClassName}>{displayChar}</span>
                    </Tip>
                  );
                }

                return (
                  <span key={`${start}-${index}`} className={glyphClassName}>
                    {displayChar}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Keyboard Guide */}
        {showKeyboard && (
          <div className="mt-5">
            <KhmerKeyboard nextChar={nextChar} />
          </div>
        )}
      </main>

      {/* Completion Modal */}
      {showResultsModal && lessonResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-elevated max-w-md w-full p-6 sm:p-7 bg-card border-border shadow-lg text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3.5">
              <Trophy className="size-7" />
            </div>

            <h3 className="km text-2xl sm:text-3xl font-bold text-foreground">
              {lessonResult.timedOut ? "អស់ពេល!" : "អបអរសាទរ!"}
            </h3>
            <p className="km text-sm sm:text-base text-muted-foreground mt-1.5">
              {level.badge} › {lesson.title}
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "size-6",
                    star <= starsEarned ? "fill-warning text-warning" : "text-muted-foreground/30",
                  )}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5 rounded-xl bg-secondary/50 p-3.5 text-center">
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
              <p className="km text-sm text-muted-foreground mt-3.5 font-medium">
                កំណត់ត្រាមុន: {lessonResult.previousBest.bestWpm} WPM ·{" "}
                {lessonResult.previousBest.bestAccuracy}%
              </p>
            )}

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={handleGoToNextLesson}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer km"
              >
                <Sparkles className="size-4.5" />
                <span>បន្តទៅមេរៀនបន្ទាប់</span>
              </button>

              <button
                onClick={handleRestart}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all cursor-pointer km"
              >
                <RotateCcw className="size-4" />
                <span>ហាត់ជុំនេះឡើងវិញ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
