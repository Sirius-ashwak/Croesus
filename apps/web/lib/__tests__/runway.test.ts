import { describe, it, expect } from "vitest";
import { calculateRunway, type RunwayInputs } from "../runway";

// Canonical demo dataset (PRD §14.3): 1.5 tBTC @ $74,800, $25k borrowed, $5,200/mo burn.
const DEMO: RunwayInputs = { btcDeposited: 1.5, btcPriceUSD: 74_800, musdBorrowed: 25_000, monthlyBurn: 5_200 };

describe("calculateRunway", () => {
  it("matches the canonical demo numbers (~9.5 months runway)", () => {
    const r = calculateRunway(DEMO);
    expect(r.collateralValueUSD).toBe(112_200);
    expect(r.maxBorrowCapacity).toBeCloseTo(74_800, 6);
    expect(r.availableCredit).toBeCloseTo(49_800, 6);
    expect(r.monthlyInterestCost).toBeCloseTo(20.8333, 3);
    expect(r.runwayMonths).toBeCloseTo(9.54, 1);
    expect(r.display).toMatch(/^9\.5 months$/);
  });

  it("returns ∞ when there is no burn", () => {
    const r = calculateRunway({ ...DEMO, monthlyBurn: 0 });
    expect(r.runwayMonths).toBe(Infinity);
    expect(r.display).toBe("∞");
  });

  it("returns 0 months when fully borrowed (no available credit)", () => {
    const r = calculateRunway({ ...DEMO, musdBorrowed: 74_800 }); // borrowed == max capacity
    expect(r.availableCredit).toBeCloseTo(0, 6);
    expect(r.runwayMonths).toBe(0);
    expect(r.display).toBe("0 months");
  });

  it("caps very long runways at >10 years", () => {
    const r = calculateRunway({ ...DEMO, monthlyBurn: 1 });
    expect(r.runwayMonths).toBeGreaterThan(120);
    expect(r.display).toBe(">10 years");
  });
});
