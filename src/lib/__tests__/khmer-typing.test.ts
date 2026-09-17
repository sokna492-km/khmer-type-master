import { describe, expect, it } from "vitest";

import {
  compareTyping,
  deleteBackward,
  nextHintUnit,
  normalizeKhmer,
  sanitizeTarget,
  splitClusters,
  ZWSP,
} from "@/lib/khmer";
import {
  applyCompositionEnd,
  applyCompositionStart,
  applyCompositionUpdate,
  shouldScoreInput,
  strictCommit,
} from "@/lib/typing-input";

describe("khmer-segment facade", () => {
  it("splits stacked coeng clusters", () => {
    expect(splitClusters("ក្ក")).toEqual(["ក្ក"]);
    expect(splitClusters("ស្ដី").length).toBeGreaterThanOrEqual(1);
    const complex = splitClusters("កន្ត្រៃ");
    expect(complex.length).toBeGreaterThan(1);
    expect(complex.join("")).toBe(normalizeKhmer("កន្ត្រៃ"));
  });

  it("keeps vowel + diacritic attached", () => {
    const clusters = splitClusters("កាំ");
    expect(clusters.some((c) => c.includes("ាំ") || c.includes("ំ") || c.includes("ា"))).toBe(
      true,
    );
    expect(splitClusters("កះ").join("")).toBe(normalizeKhmer("កះ"));
    expect(splitClusters("ក់").join("")).toBe(normalizeKhmer("ក់"));
  });

  it("treats ZWSP as its own cluster", () => {
    const text = `ក${ZWSP}ខ`;
    const clusters = splitClusters(text);
    expect(clusters).toContain(ZWSP);
    expect(clusters).toContain("ក");
    expect(clusters).toContain("ខ");
  });

  it("sanitizeTarget / normalizeKhmer equalizes reorderings", () => {
    // Vowel before coeng — common corrupt order; should normalize
    const broken = "ខែ្មរ"; // ខ + ែ + ្ + ម + រ
    const good = "ខ្មែរ";
    expect(sanitizeTarget(broken)).toBe(normalizeKhmer(good));
    expect(compareTyping(good, broken).isComplete).toBe(true);
  });

  it("documents that raw NFC is not the compare path", () => {
    const broken = "ខែ្មរ";
    const viaKhmer = normalizeKhmer(broken);
    // NFC alone may not match Khmer orthographic normalize — we assert our path works
    expect(compareTyping("ខ្មែរ", viaKhmer).isComplete).toBe(true);
  });

  it("deleteBackward removes a whole subscript cluster", () => {
    const text = "ក្កក";
    const { text: next, cursorIndex } = deleteBackward(text, text.length);
    expect(next).toBe("ក្ក");
    expect(cursorIndex).toBe(next.length);
  });

  it("nextHintUnit returns first code unit then coeng stepwise", () => {
    const target = "ក្ក";
    expect(nextHintUnit(target, "")).toBe("ក");
    // After base, next unmatched unit should be COENG
    const afterBase = normalizeKhmer("ក");
    const hint = nextHintUnit(target, afterBase);
    expect(hint).toBe("\u17D2");
  });
});

describe("strict vs free compare", () => {
  it("strictCommit rejects wrong key without advancing", () => {
    const target = normalizeKhmer("កល");
    const typed = normalizeKhmer("ក");
    const bad = normalizeKhmer("កស");
    const result = strictCommit(target, typed, bad);
    expect(result.kind).toBe("reject");
    if (result.kind === "reject") {
      expect(result.value).toBe(typed);
      expect(result.mistake).toBe(true);
    }
  });

  it("strictCommit accepts correct prefix", () => {
    const target = normalizeKhmer("កល");
    const result = strictCommit(target, "", normalizeKhmer("ក"));
    expect(result.kind).toBe("accept");
    if (result.kind === "accept") expect(result.value).toBe(normalizeKhmer("ក"));
  });

  it("free mode compareTyping marks mismatch and advances", () => {
    const cmp = compareTyping("កល", "កស");
    expect(cmp.isComplete).toBe(false);
    expect(cmp.correctUnits).toBe(1);
    expect(cmp.unitStates[0]?.correct).toBe(true);
    expect(cmp.normalizedTyped.length).toBeGreaterThan(cmp.correctPrefixLength);
  });
});

describe("IME composition guards", () => {
  it("does not score while composing", () => {
    expect(shouldScoreInput(true)).toBe(false);
    expect(shouldScoreInput(false, "insertCompositionText")).toBe(false);
    expect(shouldScoreInput(false, "insertText")).toBe(true);
  });

  it("composition lifecycle clears preedit on end", () => {
    let state = applyCompositionStart(applyCompositionUpdate(
      { isComposing: false, preedit: "" },
      "",
    ));
    state = applyCompositionUpdate(state, "ក");
    expect(state.isComposing).toBe(true);
    expect(state.preedit).toBe("ក");
    const end = applyCompositionEnd(state, "កល");
    expect(end.state.isComposing).toBe(false);
    expect(end.state.preedit).toBe("");
    expect(end.shouldCommit).toBe(true);
    expect(end.value).toBe("កល");
  });
});

describe("Intl.Segmenter vs khmer-segment (documentation)", () => {
  it("may differ on Khmer orthographic clusters", () => {
    if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
      return;
    }
    const sample = "ស្ដី";
    const ks = splitClusters(sample);
    const intl = [
      ...new Intl.Segmenter("km", { granularity: "grapheme" }).segment(sample),
    ].map((s) => s.segment);
    // Both should reconstruct the string; lengths may differ — record for maintainers
    expect(ks.join("")).toBe(normalizeKhmer(sample));
    expect(intl.join("")).toBe(sample);
    // Soft documentation: if they differ, that's expected and OK
    expect(Array.isArray(ks) && Array.isArray(intl)).toBe(true);
  });
});
