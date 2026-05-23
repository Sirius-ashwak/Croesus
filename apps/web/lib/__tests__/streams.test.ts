import { describe, it, expect } from "vitest";
import {
  CLAIM_EXPIRY_DAYS,
  claimWindowEnd,
  deriveStatus,
  isAccruing,
  ratePerSecond,
  streamHealth,
  tickerValue,
} from "../streams";

const DAY = 86_400;
const now = () => Math.floor(Date.now() / 1000);

describe("ratePerSecond", () => {
  it("turns a monthly amount into a per-second rate via SECONDS_PER_MONTH", () => {
    expect(ratePerSecond(2_628_000)).toBe(1); // one MUSD/month-second by construction
    expect(ratePerSecond(3_000)).toBeCloseTo(0.0011416, 6);
  });
});

describe("deriveStatus", () => {
  it("is active when not paused or cancelled", () => {
    expect(deriveStatus({ cancelledAt: 0, pausedAt: 0 })).toBe("active");
  });
  it("is paused when pausedAt is set", () => {
    expect(deriveStatus({ cancelledAt: 0, pausedAt: now() })).toBe("paused");
  });
  it("is cancelled within the 30-day window, expired after", () => {
    const t = now();
    expect(deriveStatus({ cancelledAt: t - 5 * DAY, pausedAt: 0 })).toBe("cancelled");
    expect(deriveStatus({ cancelledAt: t - (CLAIM_EXPIRY_DAYS + 1) * DAY, pausedAt: 0 })).toBe("expired");
  });
});

describe("isAccruing", () => {
  it("only active streams accrue", () => {
    expect(isAccruing("active")).toBe(true);
    expect(isAccruing("paused")).toBe(false);
    expect(isAccruing("cancelled")).toBe(false);
    expect(isAccruing("expired")).toBe(false);
  });
});

describe("streamHealth", () => {
  it("green >3 months, yellow 1-3, red <1", () => {
    expect(streamHealth(5)).toBe("safe");
    expect(streamHealth(2)).toBe("warning");
    expect(streamHealth(0.5)).toBe("danger");
  });
});

describe("claimWindowEnd", () => {
  it("is 30 days after cancellation", () => {
    expect(claimWindowEnd(1_000)).toBe(1_000 + 30 * DAY);
  });
});

describe("tickerValue", () => {
  it("extrapolates base + rate × elapsed when running", () => {
    expect(tickerValue(100, 2, true, 5_000)).toBe(110); // 5s × 2/s
  });
  it("is frozen (returns base) when not accruing or zero-rate", () => {
    expect(tickerValue(100, 2, false, 5_000)).toBe(100);
    expect(tickerValue(100, 0, true, 5_000)).toBe(100);
  });
  it("never goes backwards on a negative elapsed", () => {
    expect(tickerValue(100, 2, true, -1_000)).toBe(100);
  });
});
