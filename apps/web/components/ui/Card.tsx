import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Croesus data card — #0A0A0A surface, 1px #222 border, 4px radius (PRD §2.4). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded border border-border-subtle bg-bg-surface p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("mb-4 text-xs font-medium uppercase tracking-[0.2em] text-text-secondary", className)}
      {...props}
    />
  );
}
