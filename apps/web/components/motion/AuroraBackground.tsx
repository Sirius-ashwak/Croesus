"use client";

import { motion } from "framer-motion";

/**
 * Ambient gold "aurora" — slow-drifting radial blobs behind all content. Transform/opacity
 * only (GPU-cheap). Under prefers-reduced-motion the drift collapses (MotionConfig) leaving a
 * static glow; the .aurora rule in globals.css reinforces this for the CSS layer.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="aurora pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute left-[8%] top-[-12%] h-[55vh] w-[55vh] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.22), transparent 70%)", filter: "blur(60px)" }}
        animate={{ x: [0, 80, -30, 0], y: [0, 50, -20, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[4%] top-[18%] h-[45vh] w-[45vh] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.16), transparent 70%)", filter: "blur(70px)" }}
        animate={{ x: [0, -60, 40, 0], y: [0, 40, 60, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-18%] left-[28%] h-[50vh] w-[50vh] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.18), transparent 70%)", filter: "blur(80px)" }}
        animate={{ x: [0, 50, -40, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
