"use client";

import { useVault } from "@/hooks/useVault";
import { useTotalMonthlyBurn } from "@/hooks/useStreams";
import { calculateRunway } from "@/lib/runway";
import { healthColorClass } from "@/lib/vaultMath";
import { formatBTC, formatNumber, formatUSD } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ReactNode } from "react";

/**
 * Sticky treasury overview (REQ-RWY-03). Six metrics, each with a plain-English tooltip,
 * refreshed every 30s / after any tx via the shared useVault read.
 */
export function SummaryStatsBar() {
  const v = useVault();
  const monthlyBurn = useTotalMonthlyBurn();

  const runway = calculateRunway({
    btcDeposited: v.collateralBtc,
    btcPriceUSD: v.btcPriceUsd,
    musdBorrowed: v.debtMusd,
    monthlyBurn,
  });
  const runwayHealth =
    runway.runwayMonths >= 12 || !Number.isFinite(runway.runwayMonths)
      ? "safe"
      : runway.runwayMonths >= 6
        ? "warning"
        : "danger";

  return (
    <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-border-subtle bg-bg-base/95 px-6 py-4 backdrop-blur">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="BTC Locked"
          tip="Bitcoin held as collateral in your vault, and its current dollar value."
          value={formatBTC(v.collateralBtc, 3)}
          sub={formatUSD(v.collateralValue)}
        />
        <Stat
          label="MUSD Borrowed"
          tip="Stablecoin you've drawn against your Bitcoin, shown as a share of your maximum capacity."
          value={formatUSD(v.debtMusd)}
          sub={`${formatNumber(v.utilizationPercent, 0)}% of capacity`}
        />
        <Stat
          label="Available Credit"
          tip="Additional MUSD you can still borrow while staying at or above the 150% safety floor."
          value={formatUSD(v.borrowCapacityMusd)}
          sub="MUSD"
        />
        <Stat
          label="Monthly Burn"
          tip="Total MUSD streaming out to contributors each month across all active streams."
          value={`${formatUSD(monthlyBurn)} / mo`}
        />
        <Stat
          label="Annual Rate"
          tip="Mezo's fixed borrowing rate. It never changes with market conditions."
          value={<span className="text-safe">1.00% fixed</span>}
        />
        <Stat
          label="Runway"
          tip="How long your available credit lasts at the current burn rate plus interest."
          value={<span className={healthColorClass(runwayHealth)}>{runway.display}</span>}
        />
      </div>
    </div>
  );
}

function Stat({ label, tip, value, sub }: { label: string; tip: string; value: ReactNode; sub?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-secondary">{label}</span>
        <Tooltip label={tip} />
      </div>
      <div className="font-mono text-lg font-semibold text-text-primary">{value}</div>
      {sub ? <div className="text-xs text-text-secondary">{sub}</div> : null}
    </div>
  );
}
