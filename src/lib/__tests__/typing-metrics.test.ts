import { describe, expect, it } from "vitest";

import { countFreeMistakeDelta } from "@/lib/typing-input";
import {
  computeAccuracy,
  computeCpm,
  computeLessonMetrics,
  computeWpm,
  correctCodeUnitCount,
  roundStat,
} from "@/lib/typing-metrics";

describe("correctCodeUnitCount", () => {
  it("counts mid-cluster progress toward a vowel cluster", () => {
    expect(correctCodeUnitCount("កា", "ក")).toBe(1);
    expect(correctCodeUnitCount("កា", "កា")).toBe(2);
  });

  it("stops at first mismatch", () => {
    expect(correctCodeUnitCount("កល", "កស")).toBe(1);
    expect(correctCodeUnitCount("កល", "ស")).toBe(0);
  });

  it("returns 0 for empty typed", () => {
    expect(correctCodeUnitCount("កល", "")).toBe(0);
  });
});

describe("computeAccuracy (gross)", () => {
  it("is 100 when nothing typed yet", () => {
    expect(computeAccuracy(0, 0)).toBe(100);
  });

  it("keeps corrected typos in the denominator", () => {
    expect(roundStat(computeAccuracy(10, 2))).toBe(83);
  });
});

describe("computeWpm / computeCpm", () => {
  it("uses standard 5 chars per word", () => {
    expect(computeWpm(100, 60)).toBe(20);
    expect(computeCpm(100, 60)).toBe(100);
  });

  it("returns 0 when elapsed is not positive (no spike)", () => {
    expect(computeWpm(100, 0)).toBe(0);
    expect(computeWpm(100, -1)).toBe(0);
    expect(computeCpm(50, 0)).toBe(0);
  });
});

describe("countFreeMistakeDelta", () => {
  it("counts UTF-16 units added past the correct prefix", () => {
    expect(countFreeMistakeDelta("ក", "កសល", 1)).toBe(2);
    expect(countFreeMistakeDelta("", "ស", 0)).toBe(1);
  });

  it("ignores backspace / shorter buffers", () => {
    expect(countFreeMistakeDelta("កស", "ក", 1)).toBe(0);
  });

  it("ignores growth that stays within the correct prefix", () => {
    expect(countFreeMistakeDelta("ក", "កល", 2)).toBe(0);
  });
});

describe("computeLessonMetrics golden path", () => {
  it("matches live and final totals for a 3-line simulation", () => {
    // Three finished lines: correct 40/40/40, mistakes 2/1/0, total elapsed 90s
    const completedCorrect = 40 + 40 + 40;
    const mistakes = 2 + 1 + 0;
    const elapsedSec = 90;

    const live = computeLessonMetrics({
      correct: completedCorrect,
      mistakes,
      elapsedSec,
    });
    const final = computeLessonMetrics({
      correct: completedCorrect,
      mistakes,
      elapsedSec,
    });

    expect(live).toEqual(final);
    expect(roundStat(live.wpm)).toBe(roundStat(computeWpm(120, 90)));
    expect(roundStat(live.accuracy)).toBe(roundStat(computeAccuracy(120, 3)));
    expect(live.mistakes).toBe(3);
  });

  it("includes current-line correct without double-counting finished lines", () => {
    const completedCorrect = 40;
    const currentLineCorrect = 10;
    const metrics = computeLessonMetrics({
      correct: completedCorrect + currentLineCorrect,
      mistakes: 1,
      elapsedSec: 30,
    });
    expect(metrics.correct).toBe(50);
    expect(roundStat(metrics.accuracy)).toBe(roundStat(computeAccuracy(50, 1)));
  });
});
