import { useState, useEffect, useCallback, useMemo } from "react";
import { keyHintFor } from "@/lib/keymap";
import { getKeyHandFingers } from "@/lib/finger-guide";
import { publicAsset } from "@/lib/public-url";
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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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

  // Hovered key box for sky overlay (skip when same as pressed — press wins visually)
  const hoveredKeyBox: SvgKeyBox | null = useMemo(() => {
    if (!hoveredKey) return null;
    const pressedNorm = pressedKeyCode ? normalizeToKeymapKey(pressedKeyCode) : null;
    if (pressedNorm && pressedNorm === hoveredKey) return null;
    return NIDA_SVG_KEYMAP[hoveredKey] ?? null;
  }, [hoveredKey, pressedKeyCode]);

  // Real-time highlighted hand fingers for target key
  const { leftFingers: targetLeftFingers, rightFingers: targetRightFingers } = useMemo(
    () => getKeyHandFingers(hint?.code, requiresShift),
    [hint?.code, requiresShift],
  );

  // Hover replaces target for active (amber) fingers while pointer is over a key
  const { leftFingers: hoveredLeftFingers, rightFingers: hoveredRightFingers } = useMemo(
    () => getKeyHandFingers(hoveredKey ?? undefined, false),
    [hoveredKey],
  );

  const activeLeftFingers = hoveredKey ? hoveredLeftFingers : targetLeftFingers;
  const activeRightFingers = hoveredKey ? hoveredRightFingers : targetRightFingers;

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

  const clearHover = useCallback(() => {
    setHoveredKey(null);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearHover);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearHover);
    };
  }, [handleKeyDown, handleKeyUp, clearHover]);

  const isHovering = Boolean(hoveredKey);

  return (
    <div
      className={cn(
        "relative flex w-full min-h-0 select-none flex-col overflow-hidden",
        className,
      )}
    >
      {/* Same layout on home and practice: hands in flow, width-driven keyboard */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
        <div className="kb-side-hands hidden w-[clamp(4rem,10vw,9rem)] shrink-0 flex-col items-center justify-center sm:flex">
          <LeftHandSvg
            activeFingers={activeLeftFingers}
            pressedFingers={pressedLeftFingers}
            className="pointer-events-none h-auto max-h-[clamp(7rem,32dvh,18rem)] w-full select-none"
          />
        </div>

        <div className="relative min-h-0 min-w-0 flex-[2] overflow-hidden rounded-xl bg-transparent select-none">
          <div className="relative w-full">
            <img
              src={publicAsset("khmer_layout.svg")}
              alt="Khmer NiDA Unicode Keyboard Layout"
              className="pointer-events-none mx-auto block h-auto w-full object-contain select-none"
              draggable={false}
            />

            <svg
              viewBox="0 0 857 333"
              className="pointer-events-none absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {!isHovering && shiftKeyBox && (
                <path
                  d={shiftKeyBox.d}
                  fill="rgba(147, 51, 234, 0.22)"
                  stroke="#9333EA"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}

              {!isHovering && targetKeyBox && (
                <path
                  d={targetKeyBox.d}
                  fill="rgba(245, 158, 11, 0.35)"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              )}

              {hoveredKeyBox && (
                <path
                  d={hoveredKeyBox.d}
                  fill="rgba(14, 165, 233, 0.18)"
                  stroke="#0284c7"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              )}

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

            <div
              className="pointer-events-auto absolute inset-0 h-full w-full"
              onMouseLeave={clearHover}
            >
              <svg
                viewBox="0 0 857 333"
                className="h-full w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {Object.entries(NIDA_SVG_KEYMAP).map(([keyName, box]) => (
                  <path
                    key={keyName}
                    d={box.d}
                    fill="transparent"
                    className="cursor-pointer hover:fill-foreground/[0.04] transition-colors"
                    onMouseEnter={() => setHoveredKey(keyName)}
                    onMouseLeave={() => setHoveredKey((k) => (k === keyName ? null : k))}
                    onClick={() => {
                      setPressedKeyCode(keyName);
                      setTimeout(() => setPressedKeyCode(null), 200);
                    }}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="kb-side-hands hidden w-[clamp(4rem,10vw,9rem)] shrink-0 flex-col items-center justify-center sm:flex">
          <RightHandSvg
            activeFingers={activeRightFingers}
            pressedFingers={pressedRightFingers}
            className="pointer-events-none h-auto max-h-[clamp(7rem,32dvh,18rem)] w-full select-none"
          />
        </div>
      </div>

      {/* Bottom hands: narrow screens, or short height (see .kb-bottom-hands) */}
      <div className="kb-bottom-hands mt-2 flex shrink-0 items-center justify-center gap-8 pt-2 sm:hidden">
        <div className="flex w-[clamp(4.5rem,18vw,6rem)] flex-col items-center">
          <LeftHandSvg
            activeFingers={activeLeftFingers}
            pressedFingers={pressedLeftFingers}
            className="h-auto w-full max-h-[clamp(4rem,18dvh,6rem)]"
          />
        </div>
        <div className="flex w-[clamp(4.5rem,18vw,6rem)] flex-col items-center">
          <RightHandSvg
            activeFingers={activeRightFingers}
            pressedFingers={pressedRightFingers}
            className="h-auto w-full max-h-[clamp(4rem,18dvh,6rem)]"
          />
        </div>
      </div>
    </div>
  );
}
