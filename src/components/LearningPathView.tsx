import { CURRICULUM, khmerNumber, type Level, type Lesson } from "@/data/curriculum";
import { type ProgressMap, lessonKey } from "@/lib/progress";
import { KhmerKeyboard } from "@/components/KhmerKeyboard";
import { cn } from "@/lib/utils";
import { CheckCircle2, Play, Trophy, Zap, Award, Keyboard as KeyboardIcon } from "lucide-react";

interface LearningPathViewProps {
  progress: ProgressMap;
  loaded?: boolean;
  onSelectLesson: (level: Level, lesson: Lesson) => void;
}

export function LearningPathView({
  progress,
  loaded = true,
  onSelectLesson,
}: LearningPathViewProps) {
  // Compute stats across all lessons
  let totalLessons = 0;
  let completedLessons = 0;
  let totalWpm = 0;
  let totalAccuracy = 0;
  let nextLessonToLearn: { level: Level; lesson: Lesson } | null = null;

  for (const level of CURRICULUM) {
    for (const lesson of level.lessons) {
      totalLessons += 1;
      const rec = progress[lessonKey(level.id, lesson.id)];
      if (rec?.completed) {
        completedLessons += 1;
        totalWpm += rec.bestWpm;
        totalAccuracy += rec.bestAccuracy;
      } else if (!nextLessonToLearn) {
        nextLessonToLearn = { level, lesson };
      }
    }
  }

  if (!nextLessonToLearn && CURRICULUM[0]?.lessons[0]) {
    nextLessonToLearn = { level: CURRICULUM[0], lesson: CURRICULUM[0].lessons[0] };
  }

  const avgWpm = completedLessons > 0 ? Math.round(totalWpm / completedLessons) : 0;
  const avgAccuracy = completedLessons > 0 ? Math.round(totalAccuracy / completedLessons) : 0;
  const overallPercent = Math.round((completedLessons / (totalLessons || 1)) * 100);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      {/* Clean Hero Header */}
      <section className="shrink-0 border-b border-border bg-card/40 py-5 sm:py-7">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground km">
                Khmer Type Master
              </h1>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground km">
                កម្មវិធីហាត់វាយអក្សរខ្មែរតាមស្ដង់ដារក្ដាចុចយូនីកូដ
              </p>

              {nextLessonToLearn && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() =>
                      onSelectLesson(nextLessonToLearn!.level, nextLessonToLearn!.lesson)
                    }
                    className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-lg font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Play className="size-4.5 fill-current" />
                    <span className="km text-lg sm:text-xl font-bold">
                      {completedLessons === 0 ? "ចាប់ផ្ដើម" : "បន្តការហាត់"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Grid — averages of each completed lesson's best scores */}
            <div
              className={cn(
                "grid w-full min-w-[280px] grid-cols-2 gap-3 transition-opacity md:w-auto",
                !loaded && "opacity-50",
              )}
            >
              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="km text-base font-bold text-muted-foreground">វឌ្ឍនភាព</span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                    <Trophy className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="km text-3xl sm:text-4xl font-extrabold text-primary">
                    {loaded ? `${khmerNumber(overallPercent)}%` : "—"}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${loaded ? overallPercent : 0}%` }}
                  />
                </div>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="km text-base font-bold text-muted-foreground">មធ្យម WPM</span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Zap className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="km text-3xl sm:text-4xl font-extrabold text-foreground">
                    {loaded ? khmerNumber(avgWpm) : "—"}
                  </span>
                  <span className="text-base font-mono font-bold text-muted-foreground">WPM</span>
                </div>
                <p className="km mt-1 text-xs text-muted-foreground">មធ្យមពិន្ទុល្អបំផុត</p>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="km text-base font-bold text-muted-foreground">មធ្យមត្រឹមត្រូវ</span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                    <Award className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="km text-3xl sm:text-4xl font-extrabold text-success">
                    {loaded ? `${khmerNumber(avgAccuracy)}%` : "—"}
                  </span>
                </div>
                <p className="km mt-1 text-xs text-muted-foreground">មធ្យមពិន្ទុល្អបំផុត</p>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="km text-base font-bold text-muted-foreground">បានបញ្ចប់</span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="km text-3xl sm:text-4xl font-extrabold text-foreground">
                    {loaded ? khmerNumber(completedLessons) : "—"}
                  </span>
                  <span className="km text-base font-bold text-muted-foreground">
                    / {khmerNumber(totalLessons)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard fills remaining viewport height */}
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 pb-4 pt-4 sm:px-5 sm:pt-5">
        <div className="mb-2 flex shrink-0 items-center justify-center gap-2">
          <KeyboardIcon className="size-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold text-foreground km">ក្ដារចុចយូនីកូដ</h3>
        </div>
        <div className="min-h-0 flex-1">
          <KhmerKeyboard className="h-full" />
        </div>
      </main>
    </div>
  );
}
