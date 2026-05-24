"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hover/focus/tap tooltip used to explain every metric in plain English (REQ-RWY-03,
 * REQ-VAULT-03). The trigger is a real <button> so it's keyboard- and touch-reachable, and
 * the bubble is linked via aria-describedby (DESIGN_REVIEW #1, #8). CSS-only reveal — no async.
 */
export function Tooltip({ label, children, className }: { label: string; children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={cn("group relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label={children ? undefined : "More information"}
        aria-describedby={id}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {children ?? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-text-secondary text-[9px] leading-none text-text-secondary">
            i
          </span>
        )}
      </button>
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded border border-border bg-bg-overlay p-2 text-xs font-normal normal-case tracking-normal text-text-secondary opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          open && "opacity-100",
        )}
      >
        {label}
      </span>
    </span>
  );
}
