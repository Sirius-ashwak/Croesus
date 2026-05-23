import { describe, it, expect } from "vitest";
import { calculateStress, dropAtRatio } from "../stressTest";
import type { RunwayInputs } from "../runway";

const DEMO: RunwayInputs = { btcDeposited: 1.5, btcPriceUSD: 74_800, musdBorrowed: 25_000, monthlyBurn: 5_200 };

describe("dropAtRatio", () => {
  it("finds the % drop that hits the Croesus 150% and Mezo 110% lines", () => {
    expect(dropAtRatio(DEMO, 1.5)).toBeCloseTo(66.58, 1); // margin call
    expect(dropAtRatio(DEMO, 1.1)).toBeCloseTo(75.49, 1); // Mezo liquidation
  });

  it("is ∞ when there is no debt", () => {
    expect(dropAtRatio({ ...DEMO, musdBorrowed: 0 }, 1.5)).toBe(Infinity);
  });
});

describe("calculateStress", () => {
  it("INVARIANT: the margin-call drop is always smaller than the liquidation drop", () => {
    const s = calculateStress(DEMO, 0);
    // You always cross the Croesus action threshold (150%) before Mezo liquidates (110%).
    expect(s.marginCallDropPercent).toBeLessThan(s.liquidationDropPercent);
  });

  it("simulates the ratio at a -40% drop without tripping either threshold", () => {
    const s = calculateStress(DEMO, 40);
    expect(s.simulatedPrice).toBeCloseTo(44_880, 6);
    expect(s.collateralRatioPercent).toBeCloseTo(269.28, 1);
    expect(s.isMarginCall).toBe(false);
    expect(s.isLiquidation).toBe(false);
  });

  it("flags a margin call once available credit hits zero (~-66.6%)", () => {
    const s = calculateStress(DEMO, 67);
    expect(s.isMarginCall).toBe(true);
    expect(s.collateralRatioPercent).toBeLessThan(150);
  });

  it("flags Mezo liquidation at/below the ~110% line (~-75.5%)", () => {
    const s = calculateStress(DEMO, 76);
    expect(s.isLiquidation).toBe(true);
    expect(s.collateralRatioPercent).toBeLessThanOrEqual(110);
  });
});
