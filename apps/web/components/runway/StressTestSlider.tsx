"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RunwayInputs } from "@/lib/runway";
import { calculateStress } from "@/lib/stressTest";
import { liquidationPrice, marginCallPrice } from "@/lib/vaultMath";
import { cn, formatNumber, formatRatio, formatUSD } from "@/lib/utils";

const MAX_DROP = 80; // slider runs 0%..-80%

/**
 * The stress-test slider (REQ-RWY-02) — the product's hero. Every metric recomputes
 * synchronously on each slider step (pure JS, <16ms budget; no async on drag). Shows the
 * Croesus margin-call and Mezo liquidation points on the track and triggers banners.
 */
export function StressTestSlider({ inputs }: { inputs: RunwayInputs }) {
  const [drop, setDrop] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Pure synchronous recompute — the whole point of the feature.
  const s = useMemo(() => calculateStress(inputs, drop), [inputs, drop]);
  const marginCallUsd = marginCallPrice(inputs.btcDeposited, inputs.musdBorrowed);
  const liquidationUsd = liquidationPrice(inputs.btcDeposited, inputs.musdBorrowed);
  const liqDistancePct = liquidationUsd > 0 ? (s.simulatedPrice / liquidationUsd - 1) * 100 : Infinity;

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  function reset() {
    const from = drop;
    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 200);
      const eased = 1 - Math.pow(1 - k, 3); // ease-out
      setDrop(Math.round(from * (1 - eased)));
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  const pos = (d: number) => Math.max(0, Math.min(100, (d / MAX_DROP) * 100));
  const mcPos = pos(s.marginCallDropPercent);
  const liqPos = pos(s.liquidationDropPercent);
  const thumbPos = pos(drop);
  const labelPos = Math.max(6, Math.min(94, thumbPos));

  const runwayLabel = s.isLiquidation
    ? "LIQUIDATION"
    : !Number.isFinite(s.runwayMonths)
      ? "∞"
      : s.runwayMonths <= 0
        ? "0 mo"
        : s.runwayMonths > 120
          ? ">10y"
          : `${s.runwayMonths.toFixed(1)} mo`;
  const runwayColor = s.isLiquidation || s.isMarginCall ? "text-danger" : "text-text-primary";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary">Simulate BTC Price Drop</span>
        <button onClick={reset} disabled={drop === 0} className="text-xs text-gold hover:underline disabled:text-text-tertiary">
          Reset
        </button>
      </div>

      {/* Live thumb label */}
      <div className="relative mb-2 h-5">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-sm text-text-primary"
          style={{ left: `${labelPos}%` }}
        >
          BTC at {formatUSD(s.simulatedPrice)} <span className="text-text-secondary">(−{drop}%)</span>
        </span>
      </div>

      {/* Zoned track + native range on top */}
      <div className="relative h-4">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-border-subtle" />
        {Number.isFinite(s.marginCallDropPercent) && liqPos > mcPos ? (
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 bg-warning/30"
            style={{ left: `${mcPos}%`, width: `${liqPos - mcPos}%` }}
          />
        ) : null}
        {Number.isFinite(s.liquidationDropPercent) && liqPos < 100 ? (
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 rounded-r-full bg-danger/40"
            style={{ left: `${liqPos}%`, width: `${100 - liqPos}%` }}
          />
        ) : null}
        {Number.isFinite(s.marginCallDropPercent) && mcPos < 100 ? (
          <Marker pos={mcPos} className="bg-warning" />
        ) : null}
        {Number.isFinite(s.liquidationDropPercent) && liqPos < 100 ? (
          <Marker pos={liqPos} className="bg-danger" />
        ) : null}
        <input
          type="range"
          min={0}
          max={MAX_DROP}
          step={1}
          value={drop}
          onChange={(e) => setDrop(Number(e.target.value))}
          className="stress-slider absolute inset-0"
          aria-label="Simulate BTC price drop"
        />
      </div>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-[11px] text-text-secondary">
        {Number.isFinite(s.marginCallDropPercent) ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" /> Margin call −{formatNumber(s.marginCallDropPercent, 0)}%
            ({formatUSD(marginCallUsd)})
          </span>
        ) : null}
        {Number.isFinite(s.liquidationDropPercent) ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" /> Liquidation −{formatNumber(s.liquidationDropPercent, 0)}%
            ({formatUSD(liquidationUsd)})
          </span>
        ) : null}
      </div>

      {/* Reactive metrics */}
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Metric label="Runway" value={runwayLabel} valueClass={runwayColor} />
        <Metric label="Collateral ratio" value={formatRatio(s.collateralRatioPercent)} />
        <Metric
          label="Liquidation distance"
          value={
            !Number.isFinite(liqDistancePct)
              ? "∞"
              : liqDistancePct <= 0
                ? "below liq."
                : `${formatNumber(liqDistancePct, 0)}% above`
          }
          valueClass={liqDistancePct <= 0 ? "text-danger" : undefined}
        />
        <Metric label="Monthly interest" value={`${formatUSD((inputs.musdBorrowed * 0.01) / 12)}`} />
      </div>

      {/* Banners */}
      <AnimatePresence mode="wait">
        {s.isLiquidation ? (
          <motion.div
            key="liq"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="croesus-pulse mt-5 rounded border border-danger bg-danger/10 p-3 text-sm text-danger"
          >
            Mezo would liquidate this position at a BTC price of {formatUSD(liquidationUsd)}.
          </motion.div>
        ) : s.isMarginCall ? (
          <motion.div
            key="mc"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 rounded border border-warning bg-warning/10 p-3 text-sm text-warning"
          >
            Action threshold reached at {formatUSD(marginCallUsd)} — add collateral or repay MUSD.
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Marker({ pos, className }: { pos: number; className: string }) {
  return <div className={cn("absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2", className)} style={{ left: `${pos}%` }} />;
}

function Metric({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-text-secondary">{label}</div>
      <div className={cn("font-mono text-lg font-semibold text-text-primary", valueClass)}>{value}</div>
    </div>
  );
}
