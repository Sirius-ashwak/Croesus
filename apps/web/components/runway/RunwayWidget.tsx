"use client";

import { calculateRunway, type RunwayInputs } from "@/lib/runway";
import { Tooltip } from "@/components/ui/Tooltip";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { cn, formatUSD } from "@/lib/utils";

/** Current-state runway figure (REQ-RWY-01) with semantic color + edge-case copy. */
export function RunwayWidget({ inputs }: { inputs: RunwayInputs }) {
  const r = calculateRunway(inputs);

  const noBurn = inputs.monthlyBurn === 0;
  const fullyBorrowed = r.availableCredit <= 0 && !noBurn;
  const color = noBurn
    ? "text-gold"
    : fullyBorrowed || r.runwayMonths < 6
      ? "text-danger"
      : r.runwayMonths < 12
        ? "text-warning"
        : "text-safe";

  const subtitle = noBurn
    ? "Add streams to calculate runway"
    : fullyBorrowed
      ? "Your vault is fully borrowed"
      : "at current burn + 1% interest";

  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary">Runway</span>
        <Tooltip label="How long your unused borrowing headroom lasts at the current monthly burn plus 1% interest. Conservative: it ignores MUSD already sitting in the vault." />
      </div>
      <div className={cn("font-mono text-5xl font-bold leading-none transition-colors duration-300", color)}>
        {r.display}
      </div>
      <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>

      <div className="mt-5 space-y-1 border-t border-border-subtle pt-4 text-sm">
        <Row label="Available credit" value={r.availableCredit} />
        <Row label="Monthly burn" value={inputs.monthlyBurn} suffix=" / mo" />
        <Row label="Monthly interest (1%)" value={r.monthlyInterestCost} suffix=" / mo" />
        <Row label="Total monthly cost" value={r.totalMonthlyCost} suffix=" / mo" />
      </div>
    </div>
  );
}

function Row({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className="font-mono text-text-primary">
        <AnimatedNumber value={value} format={formatUSD} />
        {suffix}
      </span>
    </div>
  );
}
