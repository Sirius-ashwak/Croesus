import { calculateRunway, type RunwayInputs } from "./runway";

/** Stress-test engine — PRD §7.4 (REQ-RWY-02) / §9.3. Pure, synchronous (<16ms budget). */

const MIN_RATIO = 1.5; // Croesus margin-call
const MEZO_LIQ_RATIO = 1.1; // Mezo liquidation (~110%)

export interface StressResult {
  simulatedPrice: number;
  collateralRatioPercent: number; // at simulated price
  runwayMonths: number;
  availableCredit: number;
  isMarginCall: boolean; // available credit <= 0 (Croesus 150%)
  isLiquidation: boolean; // ratio <= 110% (Mezo liquidates)
  marginCallDropPercent: number; // % drop that triggers the margin call
  liquidationDropPercent: number; // % drop that triggers Mezo liquidation
}

/** Recomputes all dependent metrics at `dropPercent` (0–80) below the current BTC price. */
export function calculateStress(i: RunwayInputs, dropPercent: number): StressResult {
  const simulatedPrice = i.btcPriceUSD * (1 - dropPercent / 100);
  const r = calculateRunway({ ...i, btcPriceUSD: simulatedPrice });
  const collateralRatioPercent =
    i.musdBorrowed > 0 ? (r.collateralValueUSD / i.musdBorrowed) * 100 : Number.POSITIVE_INFINITY;

  return {
    simulatedPrice,
    collateralRatioPercent,
    runwayMonths: r.runwayMonths,
    availableCredit: r.availableCredit,
    isMarginCall: r.availableCredit <= 0,
    isLiquidation: collateralRatioPercent <= MEZO_LIQ_RATIO * 100,
    marginCallDropPercent: dropAtRatio(i, MIN_RATIO),
    liquidationDropPercent: dropAtRatio(i, MEZO_LIQ_RATIO),
  };
}

/** % BTC drop at which the collateral ratio falls to `ratio`. */
export function dropAtRatio(i: RunwayInputs, ratio: number): number {
  if (i.musdBorrowed <= 0 || i.btcDeposited <= 0 || i.btcPriceUSD <= 0) return Number.POSITIVE_INFINITY;
  const triggerPrice = (i.musdBorrowed * ratio) / i.btcDeposited;
  return Math.max(0, (1 - triggerPrice / i.btcPriceUSD) * 100);
}
