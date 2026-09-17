import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CURRICULUM, type Level, type Lesson, findLevel } from "@/data/curriculum";
import { useProgress } from "@/lib/progress";
import { NavigationSidebar } from "@/components/NavigationSidebar";
import { LearningPathView } from "@/components/LearningPathView";
import { TypingPracticeScreen } from "@/components/TypingPracticeScreen";
import { Keyboard, Menu, Github, Heart } from "lucide-react";
import { GITHUB_REPO_URL, krumathPricingUrl } from "@/lib/krumathUrls";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { progress, loaded, record } = useProgress();

  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

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
          // Deep link into a lesson → start with sidebar collapsed
          setIsDesktopSidebarOpen(false);
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
    setIsDesktopSidebarOpen(false);
    updateUrl(lvl, lsn);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoHome = () => {
    setActiveLevel(null);
    setActiveLesson(null);
    setIsDesktopSidebarOpen(true);
    setIsMobileNavOpen(false);
    updateUrl(null, null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* Persistent Left Navigation Sidebar (Desktop + Mobile Drawer) */}
      <NavigationSidebar
        currentLevelId={activeLevel?.id ?? null}
        currentLessonId={activeLesson?.id ?? null}
        progress={progress}
        onSelectLesson={handleSelectLesson}
        onGoHome={handleGoHome}
        isCollapsed={!isDesktopSidebarOpen}
        onToggleCollapse={handleToggleDesktopSidebar}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area — soft overflow so short/landscape windows can scroll */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Top Navigation Bar */}
        <div className="lg:hidden sticky top-0 z-30 flex shrink-0 items-center gap-2 border-b border-border bg-card/90 backdrop-blur-md px-3 py-3 sm:px-4">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors sm:px-3.5"
          >
            <Menu className="size-4.5 text-primary" />
            <span className="km">កម្រិតសិក្សា</span>
          </button>

          <button
            onClick={handleGoHome}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-sm font-bold text-foreground sm:gap-2 sm:text-base"
          >
            <Keyboard className="size-5 shrink-0 text-primary" />
            <span className="truncate">Khmer Type Master</span>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={krumathPricingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="បរិច្ចាគ"
              title="បរិច្ចាគ"
            >
              <Heart className="size-4" />
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="GitHub"
              title="GitHub"
            >
              <Github className="size-4" />
            </a>
          </div>
        </div>

        {/* View Switcher: Practice Screen or Learning Path Overview */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {activeLevel && activeLesson ? (
            <TypingPracticeScreen
              level={activeLevel}
              lesson={activeLesson}
              progress={progress}
              onRecordProgress={record}
              onSelectLesson={handleSelectLesson}
              onBackToOverview={handleGoHome}
            />
          ) : (
            <LearningPathView
              progress={progress}
              loaded={loaded}
              onSelectLesson={handleSelectLesson}
            />
          )}
        </div>
      </div>
    </div>
  );
}
