"use client";

import { useEffect, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useSpring } from "framer-motion";

/**
 * Tweens a numeric value with a spring so figures "flow" into place (ratios, USD, runway).
 * Non-finite values (∞) render statically. Honours prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const finite = Number.isFinite(value);
  const spring = useSpring(finite ? value : 0, { stiffness: 90, damping: 20, mass: 0.6 });
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (!finite || reduce) {
      setDisplay(format(value));
      return;
    }
    spring.set(value);
  }, [value, finite, reduce, spring, format]);

  useMotionValueEvent(spring, "change", (latest) => {
    if (finite && !reduce) setDisplay(format(latest));
  });

  return <span className={className}>{display}</span>;
}
