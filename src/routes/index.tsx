import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CURRICULUM, type Level, type Lesson, findLevel } from "@/data/curriculum";
import { useProgress } from "@/lib/progress";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { LearningPathView } from "@/components/LearningPathView";
import { TypingPracticeScreen } from "@/components/TypingPracticeScreen";
import { Keyboard, Menu } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { progress, record } = useProgress();

  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Sync with URL query parameters on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const levelParam = params.get("level");
      const lessonParam = params.get("lesson");

      if (levelParam) {
        // Find level by ID or slug
        const lvl =
          CURRICULUM.find((l) => String(l.id) === levelParam || l.slug === levelParam) ??
          findLevel(levelParam);

        if (lvl) {
          setActiveLevel(lvl);
          if (lessonParam) {
            const lsn = lvl.lessons.find((l) => l.id === lessonParam);
            if (lsn) setActiveLesson(lsn);
            else setActiveLesson(lvl.lessons[0] ?? null);
          } else {
            setActiveLesson(lvl.lessons[0] ?? null);
          }
        }
      }
    } catch {
      // Best-effort URL sync
    }
  }, []);

  // Update URL search query without reloading page
  const updateUrl = (lvl: Level | null, lsn: Lesson | null) => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      if (lvl && lsn) {
        url.searchParams.set("level", String(lvl.id));
        url.searchParams.set("lesson", lsn.id);
      } else {
        url.searchParams.delete("level");
        url.searchParams.delete("lesson");
      }
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Best-effort
    }
  };

  const handleSelectLesson = (lvl: Level, lsn: Lesson) => {
    setActiveLevel(lvl);
    setActiveLesson(lsn);
    updateUrl(lvl, lsn);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoHome = () => {
    setActiveLevel(null);
    setActiveLesson(null);
    updateUrl(null, null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Persistent Left Navigation Sidebar (Desktop + Mobile Drawer) */}
      <NavigationSidebar
        currentLevelId={activeLevel?.id ?? null}
        currentLessonId={activeLesson?.id ?? null}
        progress={progress}
        onSelectLesson={handleSelectLesson}
        onGoHome={handleGoHome}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Navigation Bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-4 py-3">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <Menu className="size-4.5 text-primary" />
            <span className="km">កម្រិតសិក្សា</span>
          </button>

          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground"
          >
            <Keyboard className="size-5 text-primary" />
            <span>Khmer Type Master</span>
          </button>
        </div>

        {/* View Switcher: Practice Screen or Learning Path Overview */}
        {activeLevel && activeLesson ? (
          <TypingPracticeScreen
            level={activeLevel}
            lesson={activeLesson}
            progress={progress}
            onRecordProgress={record}
            onSelectLesson={handleSelectLesson}
            onBackToOverview={handleGoHome}
            onToggleSidebar={() => setIsMobileNavOpen(true)}
          />
        ) : (
          <LearningPathView progress={progress} onSelectLesson={handleSelectLesson} />
        )}
      </div>
    </div>
  );
}
