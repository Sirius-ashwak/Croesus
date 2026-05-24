"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { revealVariants } from "@/lib/motion";

/** Fade + rise on enter (in-view, fires once). `delay` is a stagger index. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={revealVariants}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-8% 0px" }}
    >
      {children}
    </motion.div>
  );
}
