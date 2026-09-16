import { useState, useEffect, useCallback, useMemo } from "react";
import { keyHintFor } from "@/lib/keymap";
import { getKeyHandFingers } from "@/lib/finger-guide";
import { NIDA_SVG_KEYMAP, type SvgKeyBox } from "@/data/nidaSvgKeymap";
import { LeftHandSvg, RightHandSvg } from "@/components/HandVisualizer";
import { cn } from "@/lib/utils";

type Props = {
  /** the next character the learner must produce */
  nextChar?: string;
  className?: string;
};

/** Normalizes KeyboardEvent.code or char to NIDA_SVG_KEYMAP keys */
function normalizeToKeymapKey(code: string): string | null {
  if (!code) return null;
  if (code.startsWith("Key")) return code.slice(3).toLowerCase();
  if (code.startsWith("Digit")) return code.slice(5);
  if (code === "Space" || code === " ") return "space";
  if (code === "BracketLeft") return "[";
  if (code === "BracketRight") return "]";
  if (code === "Backslash") return "\\";
  if (code === "Semicolon") return ";";
  if (code === "Quote") return "'";
  if (code === "Comma") return ",";
  if (code === "Period") return ".";
  if (code === "Slash") return "/";
  if (code === "Minus") return "-";
  if (code === "Equal") return "=";
  if (code === "Backquote") return "`";
  if (code === "ShiftLeft" || code === "ShiftRight") return code;
  if (code === "Backspace" || code === "Tab" || code === "CapsLock" || code === "Enter")
    return code;

  const lower = code.toLowerCase();
  if (NIDA_SVG_KEYMAP[lower]) return lower;
  return null;
}

/** Determines recommended Shift key (Left or Right) based on which hand is used for target key */
function getRecommendedShiftKey(code: string): "ShiftLeft" | "ShiftRight" {
  const leftHandKeys = new Set([
    "`",
    "1",
    "2",
    "3",
    "4",
    "5",
    "q",
    "w",
    "e",
    "r",
    "t",
    "a",
    "s",
    "d",
    "f",
    "g",
    "z",
    "x",
    "c",
    "v",
    "b",
  ]);
  return leftHandKeys.has(code.toLowerCase()) ? "ShiftRight" : "ShiftLeft";
}

export function KhmerKeyboard({ nextChar, className }: Props) {
  const [pressedKeyCode, setPressedKeyCode] = useState<string | null>(null);

  const hint = useMemo(() => keyHintFor(nextChar), [nextChar]);
  const requiresShift = Boolean(hint?.shift);

  // Active key in NIDA SVG coordinates
  const targetKeyBox: SvgKeyBox | null = useMemo(() => {
    if (!hint?.code) return null;
    const norm = normalizeToKeymapKey(hint.code);
    return norm && NIDA_SVG_KEYMAP[norm] ? NIDA_SVG_KEYMAP[norm] : null;
  }, [hint?.code]);

  // Recommended Shift key box when Shift is required
  const shiftKeyBox: SvgKeyBox | null = useMemo(() => {
    if (!requiresShift || !hint?.code) return null;
    const shiftCode = getRecommendedShiftKey(hint.code);
    return NIDA_SVG_KEYMAP[shiftCode] ?? NIDA_SVG_KEYMAP["ShiftLeft"] ?? null;
  }, [requiresShift, hint?.code]);

  // Currently pressed key box on physical keyboard
  const pressedKeyBox: SvgKeyBox | null = useMemo(() => {
    if (!pressedKeyCode) return null;
    const norm = normalizeToKeymapKey(pressedKeyCode);
    return norm && NIDA_SVG_KEYMAP[norm] ? NIDA_SVG_KEYMAP[norm] : null;
  }, [pressedKeyCode]);

  // Real-time highlighted hand fingers for target key
  const { leftFingers: activeLeftFingers, rightFingers: activeRightFingers } = useMemo(
    () => getKeyHandFingers(hint?.code, requiresShift),
    [hint?.code, requiresShift],
  );

  // Real-time highlighted hand fingers for physically pressed key
  const { leftFingers: pressedLeftFingers, rightFingers: pressedRightFingers } = useMemo(() => {
    if (!pressedKeyCode) return { leftFingers: [], rightFingers: [] };
    const norm = normalizeToKeymapKey(pressedKeyCode);
    return getKeyHandFingers(norm ?? undefined, false);
  }, [pressedKeyCode]);

  // Listen to physical keyboard events for real-time live highlighting
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setPressedKeyCode(e.code);
  }, []);

  const handleKeyUp = useCallback(() => {
    setPressedKeyCode(null);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className={cn("w-full select-none py-1", className)}>
      {/* Keyboard Layout Flanked by Real-Time Auto-Highlighting Hands directly on background */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 lg:gap-5">
        {/* Left Hand Guide */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-16 sm:w-20 md:w-28 lg:w-32 xl:w-36">
          <LeftHandSvg
            activeFingers={activeLeftFingers}
            pressedFingers={pressedLeftFingers}
            className="w-full h-auto max-h-52 select-none pointer-events-none"
          />
        </div>

        {/* Official Wikimedia NiDA SVG Layout with Clean Minimalist Key Highlights */}
        <div className="relative flex-1 min-w-0 rounded-xl overflow-hidden bg-transparent select-none">
          {/* SVG Keyboard Graphic */}
          <img
            src="/khmer_layout.svg"
            alt="Khmer NiDA Unicode Keyboard Layout"
            className="w-full h-auto block select-none pointer-events-none"
            draggable={false}
          />

          {/* Dynamic Real-Time Interactive SVG Highlight Layer */}
          <svg
            viewBox="0 0 857 333"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 1. Recommended Shift Key Highlight (clean outline when nextChar requires Shift) */}
            {shiftKeyBox && (
              <path
                d={shiftKeyBox.d}
                fill="rgba(147, 51, 234, 0.22)"
                stroke="#9333EA"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}

            {/* 2. Target Character Key Highlight (matching the amber/orange finger in reference image) */}
            {targetKeyBox && (
              <path
                d={targetKeyBox.d}
                fill="rgba(245, 158, 11, 0.35)"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            )}

            {/* 3. Physical Keypress Real-time Feedback (clean emerald accent on press) */}
            {pressedKeyBox && (
              <path
                d={pressedKeyBox.d}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#059669"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}
          </svg>

          {/* Interactive hitboxes for keys to allow clicking / testing with subtle minimalist hover */}
          <div className="absolute inset-0 w-full h-full pointer-events-auto">
            <svg
              viewBox="0 0 857 333"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {Object.entries(NIDA_SVG_KEYMAP).map(([keyName, box]) => (
                <path
                  key={keyName}
                  d={box.d}
                  fill="transparent"
                  className="cursor-pointer hover:fill-foreground/[0.04] transition-colors"
                  onClick={() => {
                    setPressedKeyCode(keyName);
                    setTimeout(() => setPressedKeyCode(null), 200);
                  }}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Right Hand Guide */}
        <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-16 sm:w-20 md:w-28 lg:w-32 xl:w-36">
          <RightHandSvg
            activeFingers={activeRightFingers}
            pressedFingers={pressedRightFingers}
            className="w-full h-auto max-h-52 select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Mobile Hand Guide (visible only on small screens < sm) */}
      <div className="flex sm:hidden items-center justify-center gap-6 pt-3 mt-3">
        <div className="flex flex-col items-center w-20">
          <span className="text-[10px] font-semibold text-muted-foreground mb-1 km">
            ដៃឆ្វេង (Left)
          </span>
          <LeftHandSvg
            activeFingers={activeLeftFingers}
            pressedFingers={pressedLeftFingers}
            className="w-16 h-auto"
          />
        </div>
        <div className="flex flex-col items-center w-20">
          <span className="text-[10px] font-semibold text-muted-foreground mb-1 km">
            ដៃស្តាំ (Right)
          </span>
          <RightHandSvg
            activeFingers={activeRightFingers}
            pressedFingers={pressedRightFingers}
            className="w-16 h-auto"
          />
        </div>
      </div>
    </div>
  );
}
