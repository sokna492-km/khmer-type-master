import { CURRICULUM, khmerNumber, type Level, type Lesson } from "@/data/curriculum";
import { type ProgressMap, lessonKey } from "@/lib/progress";
import { KhmerKeyboard } from "@/components/KhmerKeyboard";
import { CheckCircle2, Play, Trophy, Zap, Award, Keyboard as KeyboardIcon } from "lucide-react";

interface LearningPathViewProps {
  progress: ProgressMap;
  onSelectLesson: (level: Level, lesson: Lesson) => void;
}

export function LearningPathView({ progress, onSelectLesson }: LearningPathViewProps) {
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
                    className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Play className="size-4 fill-current" />
                    <span className="km">
                      {completedLessons === 0 ? "ចាប់ផ្តើមរៀន" : "បន្តការរៀន"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 w-full md:w-auto min-w-[280px]">
              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-sm">
                  <span className="km font-medium">វឌ្ឍនភាព</span>
                  <Trophy className="size-4 text-warning" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-primary">
                    {khmerNumber(overallPercent)}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-sm">
                  <span className="km font-medium">ល្បឿន</span>
                  <Zap className="size-4 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                    {khmerNumber(avgWpm)}
                  </span>
                  <span className="text-sm text-muted-foreground font-mono font-medium">WPM</span>
                </div>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-sm">
                  <span className="km font-medium">ភាពត្រឹមត្រូវ</span>
                  <Award className="size-4 text-success" />
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-success">
                    {khmerNumber(avgAccuracy)}%
                  </span>
                </div>
              </div>

              <div className="card-elevated p-3.5">
                <div className="flex items-center justify-between text-muted-foreground text-sm">
                  <span className="km font-medium">បានបញ្ចប់</span>
                  <CheckCircle2 className="size-4 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">
                    {khmerNumber(completedLessons)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    / {khmerNumber(totalLessons)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Home Page Content (Clean, educational, zero button clutter) */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-8">
        {/* Keyboard Overview Section */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <KeyboardIcon className="size-5.5 text-primary" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground km">ក្ដារចុចយូនីកូដ</h3>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[650px]">
              <KhmerKeyboard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
