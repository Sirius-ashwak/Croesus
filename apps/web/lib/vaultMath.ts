import type { HealthStatus } from "@/types/croesus";
import {
  ANNUAL_RATE,
  CRITICAL_RATIO_PCT,
  CROESUS_MIN_RATIO_PCT,
  MEZO_LIQUIDATION_RATIO_PCT,
  WARNING_RATIO_PCT,
} from "./contracts";

/**
 * Pure, synchronous treasury math operating on human numbers. Mirrors the on-chain
 * formulas in CroesusVault.sol exactly so that live previews match what the contract
 * will enforce (the contract remains the source of truth; previews are cosmetic).
 *
 * Ratio convention here is in **percent** (150 == 150% == the contract's 1.5e18 floor).
 */

const MIN_RATIO = CROESUS_MIN_RATIO_PCT / 100; // 1.5
const LIQ_RATIO = MEZO_LIQUIDATION_RATIO_PCT / 100; // 1.1

/** Collateral USD value. */
export function collateralValueUSD(collateralBtc: number, btcPriceUSD: number): number {
  return collateralBtc * btcPriceUSD;
}

/** Collateral ratio in percent. Infinity when there is no debt (matches the contract sentinel). */
export function ratioPercent(collateralValue: number, debtUSD: number): number {
  if (debtUSD <= 0) return Infinity;
  return (collateralValue / debtUSD) * 100;
}

/** Additional MUSD borrowable while staying at/above the 150% floor. */
export function borrowCapacity(collateralValue: number, debtUSD: number): number {
  return Math.max(0, collateralValue / MIN_RATIO - debtUSD);
}

/** Max tBTC withdrawable while staying at/above the 150% floor. */
export function maxWithdrawableBtc(collateralBtc: number, debtUSD: number, btcPriceUSD: number): number {
  if (debtUSD <= 0) return collateralBtc;
  if (btcPriceUSD <= 0) return 0;
  const minColBtc = (debtUSD * MIN_RATIO) / btcPriceUSD;
  return Math.max(0, collateralBtc - minColBtc);
}

/** BTC/USD price at which the position hits the Croesus 150% margin call. */
export function marginCallPrice(collateralBtc: number, debtUSD: number): number {
  if (collateralBtc <= 0 || debtUSD <= 0) return 0;
  return (debtUSD * MIN_RATIO) / collateralBtc;
}

/** BTC/USD price at which **Mezo** liquidates (~110%). Always below the margin-call price. */
export function liquidationPrice(collateralBtc: number, debtUSD: number): number {
  if (collateralBtc <= 0 || debtUSD <= 0) return 0;
  return (debtUSD * LIQ_RATIO) / collateralBtc;
}

/** Monthly interest cost on outstanding debt (1% annual, fixed). */
export function monthlyInterest(debtUSD: number): number {
  return (debtUSD * ANNUAL_RATE) / 12;
}

/**
 * Health classification driving banners and semantic color (REQ-VAULT-03):
 * danger below 130%, warning below 175%, safe otherwise.
 */
export function healthFromRatio(percent: number): HealthStatus {
  if (!Number.isFinite(percent)) return "safe";
  if (percent < CRITICAL_RATIO_PCT) return "danger";
  if (percent < WARNING_RATIO_PCT) return "warning";
  return "safe";
}

/** Tailwind text-color token for a health status. */
export function healthColorClass(status: HealthStatus): string {
  return status === "danger" ? "text-danger" : status === "warning" ? "text-warning" : "text-safe";
}
