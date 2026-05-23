"use client";

import { useEffect, useRef, useState } from "react";
import { tickerValue } from "@/lib/streams";

/**
 * Cosmetic live balance (PRD §12.3). Holds the last on-chain value (`base`, from the 30s
 * poll) and the wall-clock when it was captured, then every second extrapolates
 * `base + ratePerSec * secondsSinceCapture`. The real value is corrected on the next poll.
 * Frozen (no increment) when `running` is false — e.g. paused/cancelled streams.
 */
export function useTicker(base: number, ratePerSec: number, running: boolean, anchorMs?: number): number {
  const [display, setDisplay] = useState(base);
  const baseRef = useRef(base);
  const anchorRef = useRef(anchorMs ?? Date.now());

  // Re-anchor whenever a fresh poll lands.
  useEffect(() => {
    baseRef.current = base;
    anchorRef.current = anchorMs ?? Date.now();
    setDisplay(base);
  }, [base, anchorMs]);

  useEffect(() => {
    if (!running || ratePerSec <= 0) {
      setDisplay(baseRef.current);
      return;
    }
    const tick = () => setDisplay(tickerValue(baseRef.current, ratePerSec, true, Date.now() - anchorRef.current));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [ratePerSec, running]);

  return display;
}
