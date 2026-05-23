import type { HealthStatus, StreamStatus } from "@/types/croesus";
import { SECONDS_PER_MONTH } from "./contracts";

/** Stream domain helpers — kept in lock-step with CroesusStream.sol (§8.2). */

export const CLAIM_EXPIRY_DAYS = 30; // must match CroesusStream.CLAIM_EXPIRY_DAYS

/** MUSD/second for a given monthly amount. Mirrors `monthly / SECONDS_PER_MONTH`. */
export function ratePerSecond(monthlyMusd: number): number {
  return monthlyMusd / SECONDS_PER_MONTH;
}

/** Derives the display status from raw stream fields (unix seconds). */
export function deriveStatus(opts: {
  cancelledAt: number;
  pausedAt: number;
  nowSec?: number;
}): StreamStatus {
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (opts.cancelledAt > 0) {
    const expiry = opts.cancelledAt + CLAIM_EXPIRY_DAYS * 86_400;
    return now > expiry ? "expired" : "cancelled";
  }
  if (opts.pausedAt > 0) return "paused";
  return "active";
}

/** A stream only accrues while active+running; cancelled/paused/expired are frozen. */
export function isAccruing(status: StreamStatus): boolean {
  return status === "active";
}

/**
 * Per-stream funding health (REQ-STREAM-02): how many months the vault's MUSD pool can
 * sustain this stream. Green > 3 months, yellow 1–3, red < 1.
 */
export function streamHealth(monthsCovered: number): HealthStatus {
  if (monthsCovered >= 3) return "safe";
  if (monthsCovered >= 1) return "warning";
  return "danger";
}

/** "$0.0001234 / sec" — enough decimals to feel live. */
export function formatPerSecond(rate: number): string {
  return `$${rate.toFixed(7)} / sec`;
}

/**
 * Pure core of the live ticker (§12.3): the displayed balance is the last polled value plus
 * rate × seconds elapsed since that poll. Frozen (returns `base`) when not accruing.
 */
export function tickerValue(base: number, ratePerSec: number, running: boolean, elapsedMs: number): number {
  if (!running || ratePerSec <= 0) return base;
  return base + ratePerSec * (Math.max(0, elapsedMs) / 1000);
}

/** Unix-seconds timestamp when a cancelled stream's claim window closes. */
export function claimWindowEnd(cancelledAt: number): number {
  return cancelledAt + CLAIM_EXPIRY_DAYS * 86_400;
}
