import { describe, it, expect } from "vitest";
import {
  borrowCapacity,
  collateralValueUSD,
  healthFromRatio,
  liquidationPrice,
  marginCallPrice,
  maxWithdrawableBtc,
  monthlyInterest,
  ratioPercent,
} from "../vaultMath";

const COLLATERAL_BTC = 1.5;
const BTC_PRICE = 74_800;
const DEBT = 25_000;
const COLLATERAL_VALUE = COLLATERAL_BTC * BTC_PRICE; // 112,200

describe("vaultMath", () => {
  it("computes collateral value and ratio (∞ when no debt)", () => {
    expect(collateralValueUSD(COLLATERAL_BTC, BTC_PRICE)).toBe(COLLATERAL_VALUE);
    expect(ratioPercent(COLLATERAL_VALUE, DEBT)).toBeCloseTo(448.8, 1);
    expect(ratioPercent(COLLATERAL_VALUE, 0)).toBe(Infinity);
  });

  it("computes borrowing capacity to the 150% floor", () => {
    expect(borrowCapacity(COLLATERAL_VALUE, DEBT)).toBeCloseTo(49_800, 6);
    expect(borrowCapacity(COLLATERAL_VALUE, 100_000)).toBe(0); // never negative
  });

  it("INVARIANT: margin-call price is always above the liquidation price", () => {
    const mc = marginCallPrice(COLLATERAL_BTC, DEBT);
    const liq = liquidationPrice(COLLATERAL_BTC, DEBT);
    expect(mc).toBeCloseTo(25_000, 6);
    expect(liq).toBeCloseTo(18_333.33, 1);
    expect(mc).toBeGreaterThan(liq);
  });

  it("caps max withdrawable at the 150% floor", () => {
    expect(maxWithdrawableBtc(COLLATERAL_BTC, DEBT, BTC_PRICE)).toBeCloseTo(0.9987, 3);
    expect(maxWithdrawableBtc(COLLATERAL_BTC, 0, BTC_PRICE)).toBe(COLLATERAL_BTC); // no debt → all
  });

  it("classifies health: danger <130, warning <175, safe otherwise", () => {
    expect(healthFromRatio(448.8)).toBe("safe");
    expect(healthFromRatio(170)).toBe("warning");
    expect(healthFromRatio(120)).toBe("danger");
    expect(healthFromRatio(Infinity)).toBe("safe");
  });

  it("computes the fixed 1% monthly interest", () => {
    expect(monthlyInterest(DEBT)).toBeCloseTo(20.8333, 3);
  });
});
