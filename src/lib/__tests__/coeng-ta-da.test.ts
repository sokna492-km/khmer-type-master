import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  BANNED_DA_FORMS,
  BANNED_TA_FORMS,
  COENG_DA,
  COENG_TA,
  REQUIRED_CANONICAL,
} from "@/lib/coeng-ta-da";
import { compareTyping, normalizeKhmer } from "@/lib/khmer";
import { keyHintFor } from "@/lib/keymap";

function walkSrcTs(dir: string, files: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", ".output", ".tanstack"].includes(ent.name)) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkSrcTs(p, files);
    else if (/\.(ts|tsx)$/i.test(ent.name)) files.push(p);
  }
  return files;
}

describe("្ត vs ្ដ etymology", () => {
  it("does not fold coeng-da into coeng-ta", () => {
    const daWord = "ក" + COENG_DA + "ារ";
    const taWord = "ក" + COENG_TA + "ារ";
    const da = normalizeKhmer(daWord);
    const ta = normalizeKhmer(taWord);
    expect(da).not.toBe(ta);
    expect(da.includes(COENG_DA)).toBe(true);
    expect(ta.includes(COENG_TA)).toBe(true);
    expect(compareTyping(daWord, taWord).isComplete).toBe(false);
  });

  it("hints t for ត and d for ដ after coeng", () => {
    expect(keyHintFor("ត")).toEqual({ code: "t", shift: false });
    expect(keyHintFor("ដ")).toEqual({ code: "d", shift: false });
    expect(keyHintFor("\u17D2")).toEqual({ code: "j", shift: false });
  });

  it("bans wrong lemma forms across content sources", () => {
    const root = path.join(process.cwd(), "src");
    const files = walkSrcTs(root).filter(
      (f) => !f.includes(`${path.sep}coeng-ta-da.`),
    );
    const corpus = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");

    for (const bad of BANNED_TA_FORMS) {
      expect(corpus.includes(bad), `banned TA form still present: ${bad}`).toBe(false);
    }
    for (const bad of BANNED_DA_FORMS) {
      expect(corpus.includes(bad), `banned DA form still present: ${bad}`).toBe(false);
    }
  });

  it("keeps required canonical spellings in curriculum", () => {
    const curriculum = fs.readFileSync(
      path.join(process.cwd(), "src/data/curriculum.ts"),
      "utf8",
    );
    for (const good of REQUIRED_CANONICAL) {
      expect(curriculum.includes(good), `missing canonical: ${good}`).toBe(true);
    }
  });

  it("includes Level 5 teaching lesson for ្ត vs ្ដ", () => {
    const curriculum = fs.readFileSync(
      path.join(process.cwd(), "src/data/curriculum.ts"),
      "utf8",
    );
    expect(curriculum).toContain('id: "l5-1b"');
    expect(curriculum.includes("ក" + COENG_DA + "ារ")).toBe(true);
    expect(curriculum.includes("មិត" + COENG_TA)).toBe(true);
  });
});
