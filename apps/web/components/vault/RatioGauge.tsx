"use client";

import type { HealthStatus } from "@/types/croesus";
import { formatRatio } from "@/lib/utils";

const STATUS_COLOR: Record<HealthStatus, string> = {
  safe: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",
};

// 270° arc (gap at the bottom). Geometry precomputed for r=80 about (100,100).
const ARC_PATH = "M 43.43 156.57 A 80 80 0 1 1 156.57 156.57";
const DOMAIN_MIN = 100; // ratio% mapped to an empty arc
const DOMAIN_MAX = 400; // ratio% mapped to a full arc

/**
 * Collateral-ratio gauge (REQ-VAULT-03). A 270° arc whose fill grows with safety and
 * whose color follows the health status. ∞ (no debt) shows a full gold arc.
 */
export function RatioGauge({ percent, status }: { percent: number; status: HealthStatus }) {
  const isInfinite = !Number.isFinite(percent);
  const fill = isInfinite
    ? 100
    : Math.max(0, Math.min(100, ((percent - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * 100));
  const color = isInfinite ? "#D4AF37" : STATUS_COLOR[status];

  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <path d={ARC_PATH} fill="none" stroke="#222222" strokeWidth={12} strokeLinecap="round" />
        <path
          d={ARC_PATH}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${fill} 100`}
          style={{ transition: "stroke-dasharray 300ms ease, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold" style={{ color }}>
          {formatRatio(percent)}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-text-secondary">Collateral Ratio</span>
      </div>
    </div>
  );
}
