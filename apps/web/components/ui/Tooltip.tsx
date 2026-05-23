"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Hover/focus tooltip used to explain every metric in plain English (REQ-RWY-03,
 * REQ-VAULT-03). CSS-only reveal — no JS positioning, no async.
 */
export function Tooltip({ label, children, className }: { label: string; children?: ReactNode; className?: string }) {
  return (
    <span className={cn("group relative inline-flex items-center", className)}>
      {children ?? (
        <span className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-text-tertiary text-[9px] leading-none text-text-tertiary">
          i
        </span>
      )}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded border border-border bg-bg-overlay p-2 text-xs font-normal normal-case tracking-normal text-text-secondary opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
