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
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Clean Hero Header */}
      <section className="border-b border-border bg-card/40 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground km">
                Khmer Type Master
              </h1>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground km">
                កម្មវិធីហាត់វាយអក្សរខ្មែរតាមស្ដង់ដារក្ដាចុចយូនីកូដ
              </p>

              {nextLessonToLearn && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() =>
                      onSelectLesson(nextLessonToLearn!.level, nextLessonToLearn!.lesson)
                    }
                    className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-lg font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Play className="size-4.5 fill-current" />
                    <span className="km text-lg sm:text-xl font-bold">
                      {completedLessons === 0 ? "ចាប់ផ្ដើម" : "បន្តការរៀន"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Grid — averages of each completed lesson's best scores */}
            <div
              className={cn(
                "grid grid-cols-2 gap-3 w-full md:w-auto min-w-[280px] transition-opacity",
                !loaded && "opacity-50",
              )}
            >
              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-base">
                  <span className="km font-bold">វឌ្ឍនភាព</span>
                  <Trophy className="size-4.5 text-warning" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-primary">
                    {loaded ? `${khmerNumber(overallPercent)}%` : "—"}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${loaded ? overallPercent : 0}%` }}
                  />
                </div>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-base">
                  <span className="km font-bold">មធ្យម WPM</span>
                  <Zap className="size-4.5 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground">
                    {loaded ? khmerNumber(avgWpm) : "—"}
                  </span>
                  <span className="text-base text-muted-foreground font-mono font-bold">WPM</span>
                </div>
                <p className="km mt-1 text-xs text-muted-foreground">មធ្យមពិន្ទុល្អបំផុត</p>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-base">
                  <span className="km font-bold">មធ្យមត្រឹមត្រូវ</span>
                  <Award className="size-4.5 text-success" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-success">
                    {loaded ? `${khmerNumber(avgAccuracy)}%` : "—"}
                  </span>
                </div>
                <p className="km mt-1 text-xs text-muted-foreground">មធ្យមពិន្ទុល្អបំផុត</p>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-base">
                  <span className="km font-bold">បានបញ្ចប់</span>
                  <CheckCircle2 className="size-4.5 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground">
                    {loaded ? khmerNumber(completedLessons) : "—"}
                  </span>
                  <span className="text-base text-muted-foreground font-bold">
                    / {khmerNumber(totalLessons)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard sits directly on the page background */}
      <main className="mx-auto w-full max-w-6xl px-3 sm:px-5 pt-6 sm:pt-8 pb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <KeyboardIcon className="size-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold text-foreground km">ក្ដារចុចយូនីកូដ</h3>
        </div>
        <KhmerKeyboard />
      </main>
    </div>
  );
}
