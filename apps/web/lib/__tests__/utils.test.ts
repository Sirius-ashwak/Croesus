import { describe, it, expect } from "vitest";
import { formatRatio, fromWei, priceFrom8dp, toWei, truncateAddress } from "../utils";

describe("toWei / fromWei", () => {
  it("converts human numbers to 18-decimal bigints without float drift", () => {
    expect(toWei(1.5)).toBe(1_500_000_000_000_000_000n);
    expect(toWei(0.001)).toBe(1_000_000_000_000_000n);
    expect(toWei(0)).toBe(0n);
    expect(toWei(-5)).toBe(0n); // guards against negatives
  });
  it("round-trips through fromWei (lossy for large values — fine for display)", () => {
    expect(fromWei(toWei(1.5))).toBe(1.5);
    // fromWei is Number(bigint)/1e18, so large amounts carry float noise; we always format to few dp.
    expect(fromWei(25_000_000_000_000_000_000_000n)).toBeCloseTo(25_000, 6);
  });
});

describe("priceFrom8dp", () => {
  it("scales an 8-decimal price bigint to USD", () => {
    expect(priceFrom8dp(7_480_000_000_000n)).toBe(74_800);
  });
});

describe("formatRatio", () => {
  it("renders ∞ for non-finite ratios and rounds otherwise", () => {
    expect(formatRatio(Infinity)).toBe("∞");
    expect(formatRatio(448.8)).toBe("449%");
  });
});

describe("truncateAddress", () => {
  it("shortens to 0xABCD…1234", () => {
    expect(truncateAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
    expect(truncateAddress(undefined)).toBe("");
  });
});
