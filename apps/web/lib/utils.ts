import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui className merge helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate an EVM address: 0xABCD...1234 (PRD §7.3). */
export function truncateAddress(addr?: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** USD formatter, no cents by default. */
export function formatUSD(value: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(value);
}

/** Compact MUSD/number formatter. */
export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

/** bigint (18 decimals) -> human number. */
export function fromWei(value: bigint, decimals = 18): number {
  return Number(value) / 10 ** decimals;
}

/** human number -> bigint (18 decimals), via a fixed-point string to avoid float drift. */
export function toWei(value: number, decimals = 18): bigint {
  if (!Number.isFinite(value) || value <= 0) return 0n;
  const [whole, frac = ""] = value.toFixed(decimals).split(".");
  return BigInt(whole + frac.padEnd(decimals, "0").slice(0, decimals));
}

/** Pyth/contract 8-decimal price bigint -> USD number. */
export function priceFrom8dp(value: bigint): number {
  return Number(value) / 1e8;
}

/** BTC quantity formatter (default 4 dp). */
export function formatBTC(value: number, maximumFractionDigits = 4): string {
  return `${formatNumber(value, maximumFractionDigits)} BTC`;
}

/** Collateral-ratio formatter. Treats the contract's debt==0 sentinel as ∞. */
export function formatRatio(percent: number): string {
  if (!Number.isFinite(percent)) return "∞";
  return `${formatNumber(percent, 0)}%`;
}
