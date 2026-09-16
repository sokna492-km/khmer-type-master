import React from "react";
import { LEFT_HAND_SVG, RIGHT_HAND_SVG } from "@/data/handsSvgData";
import { cn } from "@/lib/utils";

interface HandSvgProps {
  activeFingers?: number[];
  pressedFingers?: number[];
  className?: string;
  activeColor?: string;
  pressedColor?: string;
}

const FINGER_NAMES: Record<number, string> = {
  1: "មេដៃ (Thumb)",
  2: "ចង្អុលដៃ (Index)",
  3: "កណ្តាល (Middle)",
  4: "នាងដៃ (Ring)",
  5: "កូនដៃ (Pinky)",
};

export function LeftHandSvg({
  activeFingers = [],
  pressedFingers = [],
  className,
  activeColor = "#f59e0b", // Warm amber/orange matching the reference
  pressedColor = "#10b981", // Emerald green for keypress
}: HandSvgProps) {
  return (
    <svg
      viewBox="0 0 540.501 640.304"
      className={cn("w-full h-auto drop-shadow-xs transition-all duration-150", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Hand Outline */}
      <g transform="matrix(-0.8746401,0,0,-0.8518511,506.62235,592.87107)" id="left-hand-outline">
        <polyline
          points={LEFT_HAND_SVG.outline1}
          className="stroke-foreground/70 dark:stroke-zinc-300"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="square"
          strokeMiterlimit="10"
        />
        <polyline
          points={LEFT_HAND_SVG.outline2}
          className="stroke-foreground/70 dark:stroke-zinc-300"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="square"
          strokeMiterlimit="10"
        />
      </g>

      {/* 5 Finger Paths (1: Thumb, 2: Index, 3: Middle, 4: Ring, 5: Pinky) */}
      {([1, 2, 3, 4, 5] as const).map((fingerNum) => {
        const d = LEFT_HAND_SVG.fingers[fingerNum];
        const isActive = activeFingers.includes(fingerNum);
        const isPressed = pressedFingers.includes(fingerNum);

        let fill = "none";
        let stroke = "currentColor";
        let strokeWidth = "1.2";
        let strokeOpacity = 0.2;

        if (isPressed) {
          fill = pressedColor;
          stroke = "#059669";
          strokeWidth = "2.5";
          strokeOpacity = 1;
        } else if (isActive) {
          fill = activeColor;
          stroke = "#d97706";
          strokeWidth = "2.5";
          strokeOpacity = 1;
        }

        return (
          <path
            key={`left-${fingerNum}`}
            id={`left-finger-${fingerNum}`}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            className="transition-colors duration-150"
          >
            <title>{`ដៃឆ្វេង: ${FINGER_NAMES[fingerNum]}`}</title>
          </path>
        );
      })}
    </svg>
  );
}

export function RightHandSvg({
  activeFingers = [],
  pressedFingers = [],
  className,
  activeColor = "#f59e0b",
  pressedColor = "#10b981",
}: HandSvgProps) {
  return (
    <svg
      viewBox="0 0 540.501 640.304"
      className={cn("w-full h-auto drop-shadow-xs transition-all duration-150", className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Hand Outline */}
      <g transform="matrix(0.8746401,0,0,-0.8518511,33.878521,592.87107)" id="right-hand-outline">
        <polyline
          points={RIGHT_HAND_SVG.outline1}
          className="stroke-foreground/70 dark:stroke-zinc-300"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="square"
          strokeMiterlimit="10"
        />
        <polyline
          points={RIGHT_HAND_SVG.outline2}
          className="stroke-foreground/70 dark:stroke-zinc-300"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="square"
          strokeMiterlimit="10"
        />
      </g>

      {/* 5 Finger Paths (1: Thumb, 2: Index, 3: Middle, 4: Ring, 5: Pinky) */}
      {([1, 2, 3, 4, 5] as const).map((fingerNum) => {
        const d = RIGHT_HAND_SVG.fingers[fingerNum];
        const isActive = activeFingers.includes(fingerNum);
        const isPressed = pressedFingers.includes(fingerNum);

        let fill = "none";
        let stroke = "currentColor";
        let strokeWidth = "1.2";
        let strokeOpacity = 0.2;

        if (isPressed) {
          fill = pressedColor;
          stroke = "#059669";
          strokeWidth = "2.5";
          strokeOpacity = 1;
        } else if (isActive) {
          fill = activeColor;
          stroke = "#d97706";
          strokeWidth = "2.5";
          strokeOpacity = 1;
        }

        return (
          <path
            key={`right-${fingerNum}`}
            id={`right-finger-${fingerNum}`}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            className="transition-colors duration-150"
          >
            <title>{`ដៃស្តាំ: ${FINGER_NAMES[fingerNum]}`}</title>
          </path>
        );
      })}
    </svg>
  );
}
