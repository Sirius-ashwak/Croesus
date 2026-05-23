"use client";

import { useVault } from "@/hooks/useVault";
import { Card, CardTitle } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { RatioGauge } from "./RatioGauge";
import { cn, formatNumber, formatUSD } from "@/lib/utils";

/** Position health monitoring (REQ-VAULT-03): gauge, price thresholds, safety buffer, banners. */
export function PositionHealth() {
  const v = useVault();
  const hasDebt = v.debt > 0n;

  return (
    <Card>
      <CardTitle>Position Health</CardTitle>

      <HealthBanner status={v.healthStatus} ratioPercent={v.ratioPercent} hasDebt={hasDebt} />

      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-8">
        <div className="flex items-center justify-center">
          <RatioGauge percent={v.ratioPercent} status={v.healthStatus} />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <Metric
            label="BTC Price"
            tip="Live BTC/USD from the Pyth oracle, refreshed every 30 seconds."
            value={formatUSD(v.btcPriceUsd)}
          />
          <Metric
            label="Collateral Value"
            tip="The current dollar value of the Bitcoin locked in your vault."
            value={formatUSD(v.collateralValue)}
          />
          <Metric
            label="Margin-Call Price"
            tip="If BTC falls to here, your position hits the Croesus 150% action threshold. This is a warning level, NOT liquidation — it sits safely above the Mezo liquidation price."
            value={hasDebt ? formatUSD(v.marginCallPriceUsd) : "—"}
            valueClass="text-warning"
          />
          <Metric
            label="Liquidation Price"
            tip="If BTC falls to here, MEZO liquidates your collateral (its ~110% minimum). This is the real danger line — always below the margin-call price."
            value={hasDebt ? formatUSD(v.liquidationPriceUsd) : "—"}
            valueClass="text-danger"
          />
          <Metric
            label="Safety Buffer"
            tip="How far BTC can fall before Mezo liquidates, in dollars and percent."
            value={
              hasDebt
                ? `${formatUSD(v.safetyBufferUsd)} (${formatNumber(v.safetyBufferPercent, 0)}%)`
                : "Unlimited"
            }
            valueClass={hasDebt ? undefined : "text-safe"}
          />
          <Metric
            label="MUSD Borrowed"
            tip="Total stablecoin debt outstanding against your collateral."
            value={formatUSD(v.debtMusd)}
          />
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  tip,
  value,
  valueClass,
}: {
  label: string;
  tip: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-secondary">{label}</span>
        <Tooltip label={tip} />
      </div>
      <div className={cn("font-mono text-lg font-semibold text-text-primary", valueClass)}>{value}</div>
    </div>
  );
}

function HealthBanner({
  status,
  ratioPercent,
  hasDebt,
}: {
  status: "safe" | "warning" | "danger";
  ratioPercent: number;
  hasDebt: boolean;
}) {
  if (!hasDebt || status === "safe") return null;

  if (status === "danger") {
    return (
      <div className="croesus-pulse mb-6 rounded border border-danger bg-danger/10 p-4 text-sm text-danger">
        ⚠ CRITICAL: Your position is at risk of liquidation ({formatNumber(ratioPercent, 0)}% ratio). Add collateral
        or repay MUSD immediately.
      </div>
    );
  }

  return (
    <div className="mb-6 rounded border border-warning bg-warning/10 p-4 text-sm text-warning">
      Your collateral ratio ({formatNumber(ratioPercent, 0)}%) is approaching the safe threshold. Consider adding
      collateral or repaying MUSD.
    </div>
  );
}
