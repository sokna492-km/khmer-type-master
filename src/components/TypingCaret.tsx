import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  /** Element that contains `[data-cluster-index]` spans */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Index of the active cluster (or equal to cluster count when finished) */
  clusterIndex: number;
  /** True when the hidden typing input is focused and accepting keys */
  active?: boolean;
  /** Flash red on strict reject */
  wrong?: boolean;
  className?: string;
};

/**
 * Measured caret over the prompt (native input caret can't sit on the glyphs).
 * Styled like a system caret: 1px, sharp, foreground — blinks only while focused.
 */
export function TypingCaret({
  containerRef,
  clusterIndex,
  active = false,
  wrong = false,
  className,
}: Props) {
  const caretRef = useRef<HTMLSpanElement>(null);
  const [placed, setPlaced] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const caret = caretRef.current;
    if (!container || !caret) return;

    const place = () => {
      const containerRect = container.getBoundingClientRect();
      const nodes = container.querySelectorAll<HTMLElement>("[data-cluster-index]");
      let target: HTMLElement | null = null;

      for (const node of nodes) {
        if (Number(node.dataset["clusterIndex"]) === clusterIndex) {
          target = node;
          break;
        }
      }

      const setIsPlaced = (next: boolean) => {
        setPlaced((was) => (was === next ? was : next));
      };

      // Past the last cluster — place after the final glyph
      if (!target && nodes.length > 0 && clusterIndex >= nodes.length) {
        target = nodes[nodes.length - 1]!;
        const r = target.getBoundingClientRect();
        caret.style.transform = `translate(${r.right - containerRect.left}px, ${r.top - containerRect.top}px)`;
        caret.style.height = `${Math.max(r.height, 1)}px`;
        setIsPlaced(true);
        return;
      }

      if (!target) {
        setIsPlaced(false);
        return;
      }

      const r = target.getBoundingClientRect();
      caret.style.transform = `translate(${r.left - containerRect.left}px, ${r.top - containerRect.top}px)`;
      caret.style.height = `${Math.max(r.height, 1)}px`;
      setIsPlaced(true);
    };

    const frame = requestAnimationFrame(place);
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(place);
    });
    ro.observe(container);
    window.addEventListener("resize", place);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [containerRef, clusterIndex]);

  return (
    <span
      ref={caretRef}
      aria-hidden
      className={cn(
        // Native-like: 1px, sharp, foreground black — not brand-colored
        "pointer-events-none absolute left-0 top-0 w-px rounded-none",
        !placed && "opacity-0",
        placed && active && !wrong && "bg-foreground animate-typing-caret",
        placed && active && wrong && "bg-destructive opacity-100",
        placed && !active && "bg-foreground/35 opacity-100",
        className,
      )}
    />
  );
}
