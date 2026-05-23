import type { Address } from "viem";

/** Frontend type definitions — PRD §10.1. */

export interface Organization {
  owner: Address;
  vaultAddress: Address;
  streamAddress: Address;
  name: string;
  createdAt: number;
}

export type HealthStatus = "safe" | "warning" | "danger";

export interface VaultState {
  btcDeposited: bigint; // tBTC units (18 decimals)
  musdBorrowed: bigint; // MUSD units (18 decimals)
  collateralRatioPercent: number; // 250 = 250%
  liquidationPriceUSD: number; // Mezo ~110% threshold
  marginCallPriceUSD: number; // Croesus 150% threshold
  availableCreditMUSD: number;
  btcPriceUSD: number;
  healthStatus: HealthStatus;
  lastUpdated: Date;
}

export type StreamStatus = "active" | "paused" | "cancelled" | "expired";

export interface Stream {
  id: bigint;
  orgVault: Address;
  recipient: Address;
  label?: string; // off-chain (localStorage) only
  monthlyAmountMUSD: number;
  ratePerSecond: number;
  startTime: Date;
  lastClaimedAt: Date;
  cancelledAt: Date | null;
  pausedAt: Date | null;
  accruedBalance: number; // refreshed every 30s
  status: StreamStatus;
  healthStatus: HealthStatus;
}

export interface RunwayState {
  months: number;
  stressTestPercent: number; // 0–80
  simulatedMonths: number;
  simulatedRatioPercent: number;
  isLiquidationZone: boolean;
  liquidationTriggerPercent: number; // % drop that triggers liquidation
}
