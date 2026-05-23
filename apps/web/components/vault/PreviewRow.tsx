import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Label/value row used in the live transaction previews. */
export function PreviewRow({ label, value, valueClass }: { label: string; value: ReactNode; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("font-mono text-text-primary", valueClass)}>{value}</span>
    </div>
  );
}
