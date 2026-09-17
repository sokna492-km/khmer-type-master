/**
 * Apply approved ្ត/្ដ lemma map under src/.
 * Usage: node scripts/apply-coeng-ta-da.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPLACEMENTS, TA, DA } from "./coeng-ta-da-map.mjs";

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

/** Drill ស្ត / ស្តា → ស្ដ / ស្ដា only as space-bounded tokens (not តេស្ត / ស្ត្រ / ស្តង់) */
function applyDrillSta(text) {
  let out = text;
  out = out.replaceAll(" ស្ត ", " ស្ដ ");
  out = out.replaceAll(" ស្តា ", " ស្ដា ");
  out = out.replaceAll(' ស្តា"', ' ស្ដា"');
  out = out.replaceAll(" ស្តា\n", " ស្ដា\n");
  return out;
}

function applyAll(text) {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    if (from === to) continue;
    out = out.split(from).join(to);
  }
  out = applyDrillSta(out);
  return out;
}

const files = walk(srcRoot);
let changedFiles = 0;
const changeLog = [];

for (const f of files) {
  const before = fs.readFileSync(f, "utf8");
  const after = applyAll(before);
  if (after !== before) {
    fs.writeFileSync(f, after, "utf8");
    changedFiles++;
    const rel = path.relative(root, f);
    // count TA/DA delta roughly
    const taBefore = before.split(TA).length - 1;
    const taAfter = after.split(TA).length - 1;
    const daBefore = before.split(DA).length - 1;
    const daAfter = after.split(DA).length - 1;
    changeLog.push(`${rel}: ្ត ${taBefore}→${taAfter}, ្ដ ${daBefore}→${daAfter}`);
  }
}

console.log(`Updated ${changedFiles} files`);
for (const line of changeLog) console.log(" ", line);
