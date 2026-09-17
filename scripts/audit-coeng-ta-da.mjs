/**
 * List every ្ត / ្ដ occurrence under src/.
 * Usage: node scripts/audit-coeng-ta-da.mjs
 * Exit 1 if banned forms remain.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TA, DA, BANNED_TA_FORMS, BANNED_DA_FORMS } from "./coeng-ta-da-map.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcRoot = path.join(root, "src");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", ".output", ".tanstack"].includes(ent.name)) {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/i.test(ent.name)) files.push(p);
  }
  return files;
}

function count(hay, needle) {
  let n = 0;
  let i = 0;
  while ((i = hay.indexOf(needle, i)) !== -1) {
    n++;
    i += needle.length;
  }
  return n;
}

const files = walk(srcRoot);
let totalTa = 0;
let totalDa = 0;
const bannedHits = [];

console.log("file\tta\tda");
for (const f of files) {
  const rel = path.relative(root, f);
  // Definition/test helpers intentionally mention forms via builders — skip ban check
  const skipBan = rel.includes("coeng-ta-da");
  const text = fs.readFileSync(f, "utf8");
  const ta = count(text, TA);
  const da = count(text, DA);
  if (ta || da) {
    totalTa += ta;
    totalDa += da;
    console.log(`${rel}\t${ta}\t${da}`);
  }
  if (skipBan) continue;
  for (const bad of BANNED_TA_FORMS) {
    if (text.includes(bad)) {
      bannedHits.push({ file: rel, bad, kind: "TA" });
    }
  }
  for (const bad of BANNED_DA_FORMS) {
    if (text.includes(bad)) {
      bannedHits.push({ file: rel, bad, kind: "DA" });
    }
  }
}

console.log(`\nTOTAL\t${totalTa}\t${totalDa}`);
if (bannedHits.length) {
  console.log("\nBANNED forms still present:");
  for (const h of bannedHits) console.log(`  ${h.kind}\t${h.bad}\t${h.file}`);
  process.exitCode = 1;
} else {
  console.log("\nNo banned forms found.");
}
