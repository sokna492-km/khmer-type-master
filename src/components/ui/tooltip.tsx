"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    hideArrow?: boolean;
  }
>(({ className, sideOffset = 6, hideArrow = false, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs select-none rounded-full border border-border/60 bg-card/95 px-2.5 py-1",
        "text-xs font-medium text-foreground/90 shadow-sm backdrop-blur-md",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1",
        "data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
        "origin-(--radix-tooltip-content-transform-origin)",
        className,
      )}
      {...props}
    >
      {children}
      {!hideArrow && (
        <TooltipPrimitive.Arrow className="fill-card drop-shadow-[0_1px_0_var(--border)]" width={10} height={5} />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/** Soft pill tooltip wrapper for icon buttons and compact controls. */
function Tip({
  label,
  children,
  side = "top",
  align = "center",
  delayDuration,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactElement;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  align?: React.ComponentProps<typeof TooltipContent>["align"];
  delayDuration?: number;
  className?: string;
}) {
  if (!label) return children;

  return (
    <Tooltip {...(delayDuration !== undefined ? { delayDuration } : {})}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={cn("km", className)}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Tip };
