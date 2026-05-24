import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion language for the "Full Fluid / Neural" UI — the single source of truth so
 * every animation feels like one physical system. Honour prefers-reduced-motion everywhere:
 * MotionConfig reducedMotion="user" (app/providers.tsx) collapses transform/layout animations
 * globally; the CSS aurora has its own reduced-motion kill-switch in globals.css.
 */

export const spring: Record<"gentle" | "snappy" | "flow", Transition> = {
  /** Soft, settling — cards, reveals, gauges. */
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 0.8 },
  /** Quick, responsive — buttons, hovers. */
  snappy: { type: "spring", stiffness: 320, damping: 26 },
  /** Slow, fluid — hero moments, number flows. */
  flow: { type: "spring", stiffness: 70, damping: 18, mass: 1 },
};

/** Expo-out — the "natural deceleration" curve for non-spring tweens. */
export const easeOut = [0.16, 1, 0.3, 1] as const;

export const duration = { fast: 0.2, base: 0.4, slow: 0.7 } as const;

/** Fade + rise. `custom` is a delay index for manual stagger. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { ...spring.gentle, delay: i * 0.06 },
  }),
};

/** Parent that staggers its direct motion children. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Child used under staggerParent. */
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: spring.gentle },
};
