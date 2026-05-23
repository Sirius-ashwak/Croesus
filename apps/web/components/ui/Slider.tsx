"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Renders the thumb/track in danger red (used as the position nears a limit). */
  danger?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Gold-thumbed range input (PRD §2). Emits a number; never async on change. */
export function Slider({
  value,
  min = 0,
  max,
  step = 1,
  onChange,
  disabled,
  danger,
  className,
  ...aria
}: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max <= min ? min + 1 : max}
      step={step}
      value={value}
      disabled={disabled || max <= min}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("croesus-slider", danger && "croesus-slider--danger", className)}
      {...aria}
    />
  );
}
