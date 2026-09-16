/**
 * Generate project-owned soft typing sound WAVs (no third-party samples).
 * Run: node scripts/generate-typing-sounds.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "sounds");
const SAMPLE_RATE = 44100;

function clamp(v, min = -1, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function writeWav(path, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = clamp(samples[i]);
    buffer.writeInt16LE((s * 0x7fff) | 0, 44 + i * 2);
  }
  writeFileSync(path, buffer);
}

function alloc(seconds) {
  return new Float64Array(Math.max(1, Math.floor(SAMPLE_RATE * seconds)));
}

function addTone(out, freq, startSec, durSec, peak = 0.12, type = "triangle") {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const n = Math.floor(durSec * SAMPLE_RATE);
  for (let i = 0; i < n; i++) {
    const idx = start + i;
    if (idx >= out.length) break;
    const t = i / SAMPLE_RATE;
    const amp = peak * Math.exp(-t / (durSec * 0.45));
    const phase = 2 * Math.PI * freq * t;
    const sample =
      type === "sine"
        ? Math.sin(phase)
        : (2 / Math.PI) * Math.asin(Math.sin(phase)); // soft triangle-ish
    out[idx] += sample * amp;
  }
}

/** Soft descending “disappointed sigh” (E4 → B3) for errors */
function synthesizeError() {
  const out = alloc(0.22);
  for (let i = 0; i < Math.floor(SAMPLE_RATE * 0.012); i++) {
    const t = i / SAMPLE_RATE;
    out[i] += (Math.random() * 2 - 1) * Math.exp(-t / 0.006) * 0.04;
  }
  addTone(out, 330, 0, 0.16, 0.38, "sine"); // E4
  addTone(out, 247, 0.07, 0.15, 0.34, "triangle"); // B3 — minor fall
  return out;
}

/** Two-note chime C5 → E5 */
function synthesizeRound() {
  const out = alloc(0.38);
  addTone(out, 523.25, 0, 0.22, 0.14, "triangle");
  addTone(out, 659.25, 0.08, 0.24, 0.12, "triangle");
  return out;
}

/** Major arpeggio C5 E5 G5 C6 */
function synthesizeLesson() {
  const out = alloc(0.7);
  const chord = [523.25, 659.25, 783.99, 1046.5];
  chord.forEach((freq, idx) => {
    addTone(out, freq, idx * 0.09, 0.42, 0.11, "sine");
  });
  return out;
}

/**
 * Short soft key-click variants (project-owned, MIT).
 * Slight pitch / noise differences so random picks feel natural.
 */
function synthesizeClick(variant) {
  const out = alloc(0.05);
  const baseFreq = 920 + variant * 55;
  // Quiet noise tick
  for (let i = 0; i < Math.floor(SAMPLE_RATE * 0.008); i++) {
    const t = i / SAMPLE_RATE;
    out[i] += (Math.random() * 2 - 1) * Math.exp(-t / 0.003) * 0.08;
  }
  addTone(out, baseFreq, 0, 0.035, 0.18, "sine");
  addTone(out, baseFreq * 0.55, 0.002, 0.028, 0.08, "triangle");
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });

const files = {
  "error.wav": synthesizeError(),
  "round.wav": synthesizeRound(),
  "lesson.wav": synthesizeLesson(),
  "click1.wav": synthesizeClick(0),
  "click2.wav": synthesizeClick(1),
  "click3.wav": synthesizeClick(2),
};

for (const [name, samples] of Object.entries(files)) {
  const path = join(OUT_DIR, name);
  writeWav(path, samples);
  console.log(`wrote ${path} (${samples.length} samples)`);
}
