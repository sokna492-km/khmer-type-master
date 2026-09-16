import { useState, useRef, useEffect, useCallback } from "react";
import { CURRICULUM, khmerNumber, type Level, type Lesson } from "@/data/curriculum";
import { levelCompletion, type ProgressMap, lessonKey } from "@/lib/progress";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Timer,
  X,
  Keyboard,
  GripVertical,
} from "lucide-react";

interface NavigationSidebarProps {
  currentLevelId: number | null;
  currentLessonId: string | null;
  progress: ProgressMap;
  onSelectLesson: (level: Level, lesson: Lesson) => void;
  onGoHome: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 300;

export function NavigationSidebar({
  currentLevelId,
  currentLessonId,
  progress,
  onSelectLesson,
  onGoHome,
  isMobileOpen = false,
  onCloseMobile,
}: NavigationSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_SIDEBAR_WIDTH);

  // Sync saved width after client hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
          setSidebarWidth(parsed);
        }
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const [isResizing, setIsResizing] = useState(false);
  const isDraggingRef = useRef(false);

  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>(() => {
    return currentLevelId ? { [currentLevelId]: true } : { 1: true };
  });

  const toggleLevel = (id: number) => {
    setExpandedLevels((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        setSidebarWidth((curr) => {
          localStorage.setItem("sidebar_width", curr.toString());
          return curr;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card border-r border-border text-foreground select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-border/80 bg-card/70 flex items-center justify-between gap-2">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left group transition-all duration-150 rounded-lg p-1 -m-1 hover:bg-secondary/60 cursor-pointer min-w-0"
          title="ទៅកាន់ទំព័រដើម"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105">
            <Keyboard className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base tracking-tight text-foreground truncate">
              Khmer Type Master
            </div>
            <p className="km text-xs sm:text-sm text-muted-foreground truncate">រៀនវាយអក្សរខ្មែរ</p>
          </div>
        </button>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary lg:hidden cursor-pointer"
            aria-label="បិទម៉ឺនុយ"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Levels list with refined minimalist buttons */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-slim">
        {CURRICULUM.map((level) => {
          const lessonIds = level.lessons.map((l) => l.id);
          const comp = levelCompletion(progress, level.id, lessonIds);
          const isExpanded = Boolean(expandedLevels[level.id]);
          const isCurrentLevel = currentLevelId === level.id;

          return (
            <div
              key={level.id}
              className={cn(
                "rounded-xl border transition-all duration-200 overflow-hidden",
                isCurrentLevel
                  ? "border-primary/40 bg-primary-soft/20"
                  : isExpanded
                    ? "border-border bg-card"
                    : "border-transparent bg-transparent hover:bg-secondary/40 hover:border-border/50",
              )}
            >
              {/* Level Header / Dropdown Toggle Button */}
              <button
                onClick={() => toggleLevel(level.id)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 text-left transition-colors duration-150 rounded-lg group cursor-pointer",
                  isExpanded ? "bg-secondary/30" : "hover:bg-secondary/50",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                  <span
                    className={cn(
                      "km shrink-0 flex items-center justify-center size-8 rounded-lg text-sm font-bold transition-transform duration-200 group-hover:scale-105",
                      comp === 100
                        ? "bg-success/15 text-success border border-success/30"
                        : isCurrentLevel
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground/80 border border-border/60",
                    )}
                  >
                    {comp === 100 ? <CheckCircle2 className="size-4.5" /> : khmerNumber(level.id)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="km text-sm font-semibold text-foreground truncate">
                        {level.badge}
                      </span>
                      {comp > 0 && (
                        <span
                          className={cn(
                            "text-xs rounded px-1.5 py-0.5 font-mono font-semibold transition-colors",
                            comp === 100
                              ? "bg-success/15 text-success"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {khmerNumber(comp)}%
                        </span>
                      )}
                    </div>
                    <p className="km text-xs sm:text-sm text-muted-foreground truncate leading-normal mt-0.5">
                      {level.title}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 p-1 text-muted-foreground transition-transform duration-200">
                  <ChevronDown
                    className={cn(
                      "size-4.5 transition-transform duration-200 text-muted-foreground/70 group-hover:text-foreground",
                      isExpanded ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </div>
              </button>

              {/* Sub-lessons list with clean animated accordion transition */}
              <div
                className={cn(
                  "grid transition-all duration-200 ease-in-out overflow-hidden",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="min-h-0">
                  <div className="border-t border-border/40 px-1.5 py-1.5 space-y-1 bg-background/50">
                    {level.lessons.map((lesson, idx) => {
                      const rec = progress[lessonKey(level.id, lesson.id)];
                      const isCompleted = rec?.completed ?? false;
                      const isCurrentLesson = isCurrentLevel && currentLessonId === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            onSelectLesson(level, lesson);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={cn(
                            "w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors duration-150 cursor-pointer group",
                            isCurrentLesson
                              ? "bg-primary text-primary-foreground font-medium"
                              : isCompleted
                                ? "text-foreground hover:bg-secondary/70"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-1.5">
                            <span
                              className={cn(
                                "size-2 rounded-full shrink-0 transition-transform duration-150",
                                isCurrentLesson
                                  ? "bg-primary-foreground scale-125"
                                  : isCompleted
                                    ? "bg-success"
                                    : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60",
                              )}
                            />
                            <span className="km truncate text-sm">
                              {khmerNumber(idx + 1)}. {lesson.title}
                            </span>
                          </div>

                          {/* Stat indicators */}
                          <div className="shrink-0 flex items-center gap-1.5 text-xs">
                            {lesson.mode === "exam" && (
                              <span
                                className={cn(
                                  "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono",
                                  isCurrentLesson
                                    ? "bg-white/20 text-white"
                                    : "bg-destructive/10 text-destructive",
                                )}
                              >
                                <Timer className="size-3" />
                                {lesson.timeLimit}s
                              </span>
                            )}
                            {isCompleted && rec && (
                              <span
                                className={cn(
                                  "font-mono font-medium text-xs sm:text-sm",
                                  isCurrentLesson ? "text-primary-foreground/90" : "text-success",
                                )}
                              >
                                {rec.bestWpm} WPM
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link to home */}
      <div className="p-3 border-t border-border/80 bg-card/60">
        <button
          onClick={onGoHome}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border/80 bg-background/80 py-2.5 text-sm font-medium km text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 cursor-pointer"
        >
          <BookOpen className="size-4" />
          <span>ទំព័រដើម</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Resizable Sidebar */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="hidden lg:flex shrink-0 h-screen sticky top-0 z-20 flex-col relative group/sidebar"
      >
        {sidebarContent}

        {/* Vertical Resize Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-30 transition-colors duration-150 group/handle flex items-center justify-center",
            isResizing ? "bg-primary w-2" : "hover:bg-primary/50 bg-transparent",
          )}
          title="អូសដើម្បីពង្រីក/បង្រួមក្ដារម៉ឺនុយ (Drag to resize)"
        >
          <div
            className={cn(
              "absolute right-[-3px] top-1/2 -translate-y-1/2 rounded-full py-2 px-0.5 bg-border text-muted-foreground transition-opacity duration-150 shadow-xs pointer-events-none opacity-0 group-hover/handle:opacity-100",
              isResizing && "opacity-100 bg-primary text-primary-foreground",
            )}
          >
            <GripVertical className="size-3" />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
