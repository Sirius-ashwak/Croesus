import type { StreamStatus } from "@/types/croesus";
import { cn } from "@/lib/utils";

const STYLES: Record<StreamStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "border-safe/40 text-safe" },
  paused: { label: "Paused", className: "border-warning/40 text-warning" },
  cancelled: { label: "Ending", className: "border-danger/40 text-danger" },
  expired: { label: "Expired", className: "border-text-tertiary text-text-tertiary" },
};

export function StatusBadge({ status }: { status: StreamStatus }) {
  const s = STYLES[status];
  return (
    <span className={cn("rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]", s.className)}>
      {s.label}
    </span>
  );
}
