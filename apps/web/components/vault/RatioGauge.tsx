"use client";

import { motion, useMotionTemplate, useReducedMotion, useSpring } from "framer-motion";
import type { HealthStatus } from "@/types/croesus";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
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
 * Collateral-ratio gauge (REQ-VAULT-03). A 270° arc whose fill springs to its target and
 * whose color follows the health status (with a soft glow). ∞ (no debt) shows a full gold arc.
 * Honours prefers-reduced-motion (snaps instead of springing).
 */
export function RatioGauge({ percent, status }: { percent: number; status: HealthStatus }) {
  const reduce = useReducedMotion();
  const isInfinite = !Number.isFinite(percent);
  const fill = isInfinite
    ? 100
    : Math.max(0, Math.min(100, ((percent - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * 100));
  const color = isInfinite ? "#D4AF37" : STATUS_COLOR[status];

  const animatedFill = useSpring(fill, { stiffness: 90, damping: 20, mass: 0.6 });
  const dash = useMotionTemplate`${animatedFill} 100`;

  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <path d={ARC_PATH} fill="none" stroke="#222222" strokeWidth={12} strokeLinecap="round" />
        <motion.path
          d={ARC_PATH}
          fill="none"
          strokeWidth={12}
          strokeLinecap="round"
          pathLength={100}
          animate={{ stroke: color }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            strokeDasharray: reduce ? `${fill} 100` : dash,
            filter: `drop-shadow(0 0 5px ${color}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold transition-colors duration-300" style={{ color }}>
          <AnimatedNumber value={percent} format={formatRatio} />
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-text-secondary">Collateral Ratio</span>
      </div>
    </div>
  );
}
