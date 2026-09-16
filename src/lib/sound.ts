/**
 * Typing feedback sounds via Howler sample playback,
 * with Web Audio oscillator fallback if assets fail to load.
 *
 * All samples are project-owned WAVs from scripts/generate-typing-sounds.mjs (MIT).
 */

import { Howl } from "howler";

import { publicAsset } from "@/lib/public-url";

const SOUND_STORAGE_KEY = "khmer_typing_sound_enabled";

type FeedbackSoundId = "error" | "round" | "lesson";

const FEEDBACK_SOUND_FILES: FeedbackSoundId[] = ["error", "round", "lesson"];

/** Soft key-click variants — random pick per keypress. */
const CLICK_SRCS = [
  publicAsset("sounds/click1.wav"),
  publicAsset("sounds/click2.wav"),
  publicAsset("sounds/click3.wav"),
] as const;

let audioCtx: AudioContext | null = null;
const feedbackHowls: Partial<Record<FeedbackSoundId, Howl>> = {};
let clickHowls: Howl[] = [];
let clickHowlsFailed = false;
let feedbackHowlsFailed = false;
let preloadStarted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = window.localStorage.getItem(SOUND_STORAGE_KEY);
  return val === null ? true : val === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  const muted = !enabled;
  for (const id of FEEDBACK_SOUND_FILES) {
    feedbackHowls[id]?.mute(muted);
  }
  for (const h of clickHowls) {
    h.mute(muted);
  }
}

function initHowls(): void {
  if (typeof window === "undefined") return;

  const muted = !isSoundEnabled();

  if (!clickHowlsFailed && clickHowls.length === 0) {
    clickHowls = CLICK_SRCS.map(
      (src) =>
        new Howl({
          src: [src],
          volume: 0.5,
          preload: true,
          mute: muted,
          onloaderror: () => {
            clickHowlsFailed = true;
          },
        }),
    );
  }

  if (feedbackHowlsFailed) return;
  for (const id of FEEDBACK_SOUND_FILES) {
    if (feedbackHowls[id]) continue;
    feedbackHowls[id] = new Howl({
      src: [publicAsset(`sounds/${id}.wav`)],
      volume: id === "error" ? 0.5 : 0.6,
      preload: true,
      mute: muted,
      onloaderror: () => {
        feedbackHowlsFailed = true;
      },
    });
  }
}

function playFeedbackHowl(id: FeedbackSoundId): boolean {
  if (feedbackHowlsFailed) return false;
  initHowls();
  const sound = feedbackHowls[id];
  if (!sound || sound.state() === "unloaded") return false;
  try {
    sound.play();
    return true;
  } catch {
    return false;
  }
}

function playClickHowl(): boolean {
  if (clickHowlsFailed) return false;
  initHowls();
  if (clickHowls.length === 0) return false;

  const sound = clickHowls[Math.floor(Math.random() * clickHowls.length)];
  if (!sound || sound.state() === "unloaded") return false;
  try {
    sound.seek(0);
    sound.play();
    return true;
  } catch {
    return false;
  }
}

/** Preload samples so the first keystroke is not silent. Safe before user gesture. */
export function preloadTypingSounds(): void {
  if (typeof window === "undefined" || preloadStarted) return;
  preloadStarted = true;
  initHowls();
}

function playSynthKey(isError: boolean): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (isError) {
      const notes: Array<{
        freq: number;
        type: OscillatorType;
        start: number;
        dur: number;
        peak: number;
      }> = [
        { freq: 330, type: "sine", start: 0, dur: 0.16, peak: 0.1 },
        { freq: 247, type: "triangle", start: 0.07, dur: 0.15, peak: 0.09 },
      ];
      notes.forEach(({ freq, type, start, dur, peak }) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const t0 = now + start;
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(peak, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t0);
        o.stop(t0 + dur);
      });
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Best-effort audio playback
  }
}

function playSynthRound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch {
    // Best-effort
  }
}

function playSynthLesson(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.09;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch {
    // Best-effort
  }
}

/** Correct key: soft click; error: soft disappointed sigh */
export function playKeySound(isError = false): void {
  if (!isSoundEnabled()) return;

  if (isError) {
    if (!playFeedbackHowl("error")) playSynthKey(true);
    return;
  }

  if (!playClickHowl()) playSynthKey(false);
}

/** Pleasant chime when advancing a round */
export function playRoundCompleteSound(): void {
  if (!isSoundEnabled()) return;
  if (!playFeedbackHowl("round")) playSynthRound();
}

/** Celebratory major chord when finishing a lesson */
export function playLessonCompleteSound(): void {
  if (!isSoundEnabled()) return;
  if (!playFeedbackHowl("lesson")) playSynthLesson();
}
