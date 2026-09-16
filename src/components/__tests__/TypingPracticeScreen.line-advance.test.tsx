/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { Level, Lesson } from "@/data/curriculum";
import { TooltipProvider } from "@/components/ui/tooltip";

const playRoundCompleteSound = vi.fn();
const playKeySound = vi.fn();
const playLessonCompleteSound = vi.fn();

vi.mock("@/lib/sound", () => ({
  playRoundCompleteSound: () => playRoundCompleteSound(),
  playKeySound: (...args: unknown[]) => playKeySound(...args),
  playLessonCompleteSound: () => playLessonCompleteSound(),
  preloadTypingSounds: vi.fn(),
  isSoundEnabled: () => true,
  setSoundEnabled: vi.fn(),
}));

vi.mock("@/components/KhmerKeyboard", () => ({
  KhmerKeyboard: () => <div data-testid="keyboard-stub" />,
}));

vi.mock("@/components/TypingCaret", () => ({
  TypingCaret: () => null,
}));

import { TypingPracticeScreen } from "@/components/TypingPracticeScreen";

const LINE_A = "កលស";
const LINE_B = "ថងហ";
const LINE_C = "ដតន";

const lesson: Lesson = {
  id: "race-test",
  title: "Race",
  mode: "keys",
  lines: [LINE_A, LINE_B, LINE_C],
};

const level: Level = {
  id: 1,
  slug: "test",
  badge: "តេស្ត",
  title: "Test",
  summary: "test",
  stage: "មូលដ្ឋាន",
  focus: [],
  lessons: [lesson],
};

function renderScreen() {
  return render(
    <TooltipProvider>
      <TypingPracticeScreen
        level={level}
        lesson={lesson}
        progress={{}}
        onRecordProgress={vi.fn()}
        onSelectLesson={vi.fn()}
        onBackToOverview={vi.fn()}
      />
    </TooltipProvider>,
  );
}

function promptText(): string {
  const clusters = document.querySelectorAll("[data-cluster-index]");
  return Array.from(clusters)
    .map((el) => el.textContent ?? "")
    .join("");
}

function commitTyped(value: string) {
  const input = screen.getByLabelText("Khmer typing input") as HTMLInputElement;
  input.focus();
  input.value = value;
  input.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: value,
    }),
  );
}

describe("TypingPracticeScreen line advance", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    playRoundCompleteSound.mockClear();
    playKeySound.mockClear();
    playLessonCompleteSound.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("plays round-complete sound once and advances only one line", async () => {
    renderScreen();

    expect(promptText()).toBe(LINE_A);

    await act(async () => {
      // Grow the typed prefix one code unit at a time (strict mode).
      for (let i = 1; i <= LINE_A.length; i += 1) {
        commitTyped(LINE_A.slice(0, i));
      }
    });

    expect(playRoundCompleteSound).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await waitFor(() => {
      expect(promptText()).toBe(LINE_B);
    });

    // Spurious second advance would land on LINE_C around +800ms.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(playRoundCompleteSound).toHaveBeenCalledTimes(1);
    expect(promptText()).toBe(LINE_B);
  });
});
