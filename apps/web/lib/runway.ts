import { ANNUAL_RATE } from "./contracts";

/** Runway calculation engine — PRD §7.4 (REQ-RWY-01). Pure, synchronous. */

const MIN_RATIO = 1.5; // Croesus 150% floor

export interface RunwayInputs {
  btcDeposited: number; // BTC quantity
  btcPriceUSD: number;
  musdBorrowed: number; // USD already borrowed
  monthlyBurn: number; // USD/month across active streams
}

export interface RunwayResult {
  collateralValueUSD: number;
  maxBorrowCapacity: number;
  availableCredit: number; // unused borrowing headroom
  monthlyInterestCost: number;
  totalMonthlyCost: number;
  runwayMonths: number; // Infinity when burn == 0
  display: string; // "∞" | "0 months" | ">10 years" | "X.X months"
}

export function calculateRunway(i: RunwayInputs): RunwayResult {
  const collateralValueUSD = i.btcDeposited * i.btcPriceUSD;
  const maxBorrowCapacity = collateralValueUSD / MIN_RATIO;
  const availableCredit = maxBorrowCapacity - i.musdBorrowed;
  const monthlyInterestCost = (i.musdBorrowed * ANNUAL_RATE) / 12;
  const totalMonthlyCost = i.monthlyBurn + monthlyInterestCost;

  let runwayMonths: number;
  let display: string;

  if (i.monthlyBurn === 0) {
    runwayMonths = Infinity;
    display = "∞";
  } else if (availableCredit <= 0) {
    runwayMonths = 0;
    display = "0 months";
  } else {
    runwayMonths = availableCredit / totalMonthlyCost;
    display = runwayMonths > 120 ? ">10 years" : `${runwayMonths.toFixed(1)} months`;
  }

  return {
    collateralValueUSD,
    maxBorrowCapacity,
    availableCredit,
    monthlyInterestCost,
    totalMonthlyCost,
    runwayMonths,
    display,
  };
}
