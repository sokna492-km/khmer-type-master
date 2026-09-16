import { useState, useEffect, useRef, useCallback } from "react";
import type { Level, Lesson } from "@/data/curriculum";
import { type ProgressMap, lessonKey } from "@/lib/progress";
import { isCombining, renderableCluster, ZWSP, COENG } from "@/lib/khmer";
import { keyHintFor } from "@/lib/keymap";
import { KhmerKeyboard } from "@/components/KhmerKeyboard";
import { playKeySound, isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import { cn } from "@/lib/utils";
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
  ChevronRight,
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
  onToggleSidebar?: () => void;
}

export function TypingPracticeScreen({
  level,
  lesson,
  progress,
  onRecordProgress,
  onSelectLesson,
  onBackToOverview,
  onToggleSidebar,
}: TypingPracticeScreenProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  const roundResults = useRef<Array<{ wpm: number; accuracy: number }>>([]);

  const currentTargetLine = lesson.lines[lineIndex] ?? lesson.lines[0] ?? "";
  const isLastLine = lineIndex >= lesson.lines.length - 1;

  const [typed, setTyped] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<number | null>(null);

  const resetRound = useCallback(() => {
    setTyped("");
    setMistakes(0);
    setStartTime(null);
    setElapsedSeconds(0);
    setIsCompleted(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setLineIndex(0);
    roundResults.current = [];
    setShowResultsModal(false);
    resetRound();
  }, [lesson.id, resetRound]);

  useEffect(() => {
    resetRound();
  }, [lineIndex, resetRound]);

  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const secs = (now - startTime) / 1000;
        setElapsedSeconds(secs);

        if (lesson.timeLimit && secs >= lesson.timeLimit) {
          setIsCompleted(true);
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 200);
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startTime, isCompleted, lesson.timeLimit]);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsInputFocused(true);
    }
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput, lineIndex]);

  const currentTargetChar = currentTargetLine[typed.length] ?? "";

  const handleChange = (nextValue: string) => {
    if (isCompleted) return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    if (nextValue.length < typed.length) {
      setTyped(nextValue);
      return;
    }

    const typedIndex = typed.length;
    const expectedChar = currentTargetLine[typedIndex];
    const incomingChar = nextValue[typedIndex];

    if (!expectedChar) return;

    const isMatch = incomingChar === expectedChar;

    if (isMatch) {
      playKeySound(false);
      setTyped(nextValue);

      if (nextValue.length >= currentTargetLine.length) {
        handleLineComplete(nextValue);
      }
    } else {
      playKeySound(true);
      setMistakes((prev) => prev + 1);
      setTyped(nextValue);
    }
  };

  const calculateStats = useCallback(() => {
    const totalChars = typed.length;
    const effectiveSecs = Math.max(elapsedSeconds, 0.5);
    const minutes = effectiveSecs / 60;
    const cpm = minutes > 0 ? totalChars / minutes : 0;
    const wpm = cpm / 5;

    const totalKeypresses = totalChars + mistakes;
    const accuracy =
      totalKeypresses > 0
        ? Math.max(0, Math.min(100, Math.round((totalChars / totalKeypresses) * 100)))
        : 100;

    const progress =
      currentTargetLine.length > 0
        ? Math.min(100, Math.round((totalChars / currentTargetLine.length) * 100))
        : 0;

    const remaining = lesson.timeLimit ? Math.max(0, lesson.timeLimit - elapsedSeconds) : null;

    return { wpm, cpm, accuracy, mistakes, progress, elapsed: elapsedSeconds, remaining };
  }, [typed.length, mistakes, elapsedSeconds, currentTargetLine.length, lesson.timeLimit]);

  const handleLineComplete = (finalTyped: string) => {
    setIsCompleted(true);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const totalChars = finalTyped.length;
    const effectiveSecs = Math.max(elapsedSeconds, 0.5);
    const minutes = effectiveSecs / 60;
    const wpm = Math.round(totalChars / minutes / 5);
    const totalKeypresses = totalChars + mistakes;
    const accuracy =
      totalKeypresses > 0
        ? Math.max(0, Math.min(100, Math.round((totalChars / totalKeypresses) * 100)))
        : 100;

    roundResults.current.push({ wpm, accuracy });

    if (!isLastLine) {
      window.setTimeout(() => {
        setLineIndex((prev) => prev + 1);
      }, 400);
    } else {
      const allRounds = roundResults.current;
      const finalAvgWpm = Math.round(
        allRounds.reduce((acc, curr) => acc + curr.wpm, 0) / (allRounds.length || 1),
      );
      const finalAvgAccuracy = Math.round(
        allRounds.reduce((acc, curr) => acc + curr.accuracy, 0) / (allRounds.length || 1),
      );

      onRecordProgress(level.id, lesson.id, {
        wpm: finalAvgWpm,
        accuracy: finalAvgAccuracy,
      });

      window.setTimeout(() => {
        setShowResultsModal(true);
      }, 500);
    }
  };

  const handleRestart = () => {
    resetRound();
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
    if (currentLessonIdx >= 0 && currentLessonIdx < level.lessons.length - 1) {
      onSelectLesson(level, level.lessons[currentLessonIdx + 1]);
    } else {
      onBackToOverview();
    }
  };

  const stats = calculateStats();
  const nextChar = currentTargetChar;
  const nextHint = nextChar ? keyHintFor(nextChar) : null;

  const starsEarned =
    stats.accuracy >= 95 && stats.wpm >= 25
      ? 3
      : stats.accuracy >= 85
        ? 2
        : stats.accuracy >= 65
          ? 1
          : 1;

  const previousRecord = progress[lessonKey(level.id, lesson.id)];

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
              <span className="km">ត្រឡប់</span>
            </button>

            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors lg:hidden shrink-0"
              >
                <ChevronRight className="size-4" />
                <span className="km text-sm">កម្រិត</span>
              </button>
            )}

            <div className="min-w-0 flex items-center gap-2">
              <span className="km text-sm font-bold text-primary bg-primary-soft px-2.5 py-1 rounded shrink-0">
                {level.badge}
              </span>
              <h2 className="km text-sm sm:text-base font-bold text-foreground truncate">
                {lesson.title}
              </h2>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="km text-sm bg-secondary px-3 py-1.5 rounded-md text-secondary-foreground font-medium">
              ជុំទី {lineIndex + 1}/{lesson.lines.length}
            </div>

            {/* Font size */}
            <div className="hidden sm:flex items-center border border-border rounded-lg overflow-hidden bg-background">
              {(["normal", "large", "xlarge"] as const).map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFontSize(size);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-sm font-bold transition-colors cursor-pointer",
                    fontSize === size
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  A
                </button>
              ))}
            </div>

            {/* Audio Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSound();
              }}
              className={cn(
                "p-2 rounded-lg border transition-colors cursor-pointer",
                soundOn
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              title={soundOn ? "បិទសំឡេង" : "បើកសំឡេង"}
            >
              {soundOn ? <Volume2 className="size-4.5" /> : <VolumeX className="size-4.5" />}
            </button>

            {/* Keyboard Guide Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowKeyboard(!showKeyboard);
              }}
              className={cn(
                "p-2 rounded-lg border transition-colors cursor-pointer",
                showKeyboard
                  ? "border-primary/40 bg-primary-soft text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              title={showKeyboard ? "លាក់ក្តារចុច" : "បង្ហាញក្តារចុច"}
            >
              <KeyboardIcon className="size-4.5" />
            </button>

            {/* Restart */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRestart();
              }}
              className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="ចាប់ផ្តើមឡើងវិញ"
            >
              <RotateCcw className="size-4.5" />
            </button>
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
              <span className="font-bold text-primary text-base sm:text-lg font-khmer">
                {nextChar === ZWSP ? "Space" : renderableCluster(nextChar)}
              </span>
              {nextHint && (
                <span className="font-mono text-sm font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-md">
                  {nextHint.shift ? `Shift + ${nextHint.code}` : nextHint.code}
                </span>
              )}
            </div>

            <div className="text-sm text-muted-foreground font-mono font-medium">
              {stats.progress}%
            </div>
          </div>
        )}

        {/* Typing Stage Box */}
        <div
          className={cn(
            "relative card-elevated p-6 sm:p-8 min-h-[150px] sm:min-h-[180px] flex flex-col justify-center cursor-text transition-all",
            !isInputFocused && "ring-2 ring-warning/60",
          )}
          onClick={focusInput}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden rounded-t-xl bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: `${stats.progress}%` }}
            />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            className="absolute opacity-0 pointer-events-none -top-1000 left-0"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            aria-label="Khmer typing input"
          />

          {!isInputFocused && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs rounded-xl flex items-center justify-center z-10">
              <div className="inline-flex items-center gap-2.5 rounded-xl bg-card border border-warning/50 px-4 py-2 text-sm font-semibold text-foreground km">
                <span className="size-2.5 rounded-full bg-warning animate-ping" />
                <span>ចុចដើម្បីបន្តការវាយ</span>
              </div>
            </div>
          )}

          {/* Target Text */}
          <div
            className={cn(
              "km font-khmer leading-loose select-none break-words text-left transition-all",
              fontSize === "normal" && "text-lg sm:text-xl",
              fontSize === "large" && "text-2xl sm:text-3xl",
              fontSize === "xlarge" && "text-3xl sm:text-4xl",
            )}
          >
            {Array.from(currentTargetLine).map((char, index) => {
              const isTyped = index < typed.length;
              const isCorrect = isTyped && typed[index] === char;
              const isWrong = isTyped && typed[index] !== char;
              const isCurrent = index === typed.length;

              let displayChar = char;
              if (char === ZWSP) {
                displayChar = "·";
              } else if (isCombining(char) || char === COENG) {
                displayChar = renderableCluster(char);
              }

              return (
                <span
                  key={index}
                  className={cn(
                    "relative inline-block transition-colors rounded px-0.5",
                    isCorrect && "text-success bg-success-soft/30 font-medium",
                    isWrong && "text-destructive bg-destructive-soft line-through font-bold",
                    isCurrent &&
                      "bg-primary text-primary-foreground font-bold animate-pulse ring-2 ring-primary/40",
                    !isTyped && !isCurrent && "text-foreground/80 opacity-90",
                    char === ZWSP && "font-mono font-bold text-muted-foreground",
                  )}
                >
                  {displayChar}
                </span>
              );
            })}
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
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="card-elevated max-w-md w-full p-6 sm:p-7 bg-card border-border shadow-lg text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-3.5">
              <Trophy className="size-7" />
            </div>

            <h3 className="km text-2xl sm:text-3xl font-bold text-foreground">អបអរសាទរ!</h3>
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
                  {Math.round(stats.wpm)} WPM
                </span>
              </div>
              <div>
                <span className="km text-sm text-muted-foreground block font-medium">
                  ភាពត្រឹមត្រូវ
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-success">
                  {Math.round(stats.accuracy)}%
                </span>
              </div>
              <div>
                <span className="km text-sm text-muted-foreground block font-medium">កំហុស</span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-destructive">
                  {stats.mistakes}
                </span>
              </div>
            </div>

            {previousRecord && (
              <p className="km text-sm text-muted-foreground mt-3.5 font-medium">
                កំណត់ត្រាមុន: {previousRecord.bestWpm} WPM · {previousRecord.bestAccuracy}%
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
