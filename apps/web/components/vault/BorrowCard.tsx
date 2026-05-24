"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { useToast } from "@/components/ui/Toast";
import { useVault } from "@/hooks/useVault";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useTxRunner } from "@/hooks/useTxRunner";
import { SAFE_RATIO_PCT, MEZO_MIN_FIRST_BORROW_MUSD, explorerTx } from "@/lib/contracts";
import { SUPPORTED_CHAIN_ID } from "@/lib/chains";
import { liquidationPrice, marginCallPrice, monthlyInterest, ratioPercent } from "@/lib/vaultMath";
import { formatRatio, formatUSD, toWei } from "@/lib/utils";
import { PreviewRow } from "./PreviewRow";

export function BorrowCard() {
  const v = useVault();
  const toast = useToast();
  const actions = useVaultActions(v.vaultAddress);
  const tx = useTxRunner();
  const [amount, setAmount] = useState(0);

  const capacity = v.borrowCapacityMusd;
  // Keep the slider valid as capacity refreshes.
  const clamped = Math.min(amount, capacity);
  const step = capacity > 10_000 ? 100 : Math.max(1, Math.round(capacity / 100));

  const newDebt = v.debtMusd + clamped;
  const newRatio = ratioPercent(v.collateralValue, newDebt);
  const newMarginCall = marginCallPrice(v.collateralBtc, newDebt);
  const newLiq = liquidationPrice(v.collateralBtc, newDebt);
  const inWarningZone = Number.isFinite(newRatio) && newRatio < SAFE_RATIO_PCT;

  // Mezo requires opening a trove with >= minNetDebt — but only on the FIRST borrow (no debt yet).
  // The local mock chain has no minimum, so this guard is Mezo-only.
  const isMezo = SUPPORTED_CHAIN_ID === 31611;
  const minFirstBorrow = isMezo && v.debtMusd === 0 ? MEZO_MIN_FIRST_BORROW_MUSD : 0;
  const belowMin = minFirstBorrow > 0 && clamped > 0 && clamped < minFirstBorrow;

  if (capacity <= 0) {
    return <p className="text-sm text-text-secondary">Deposit collateral first to unlock borrowing capacity.</p>;
  }

  if (minFirstBorrow > 0 && capacity < minFirstBorrow) {
    return (
      <p className="rounded border border-warning bg-warning/10 p-3 text-sm text-warning">
        Opening a position on Mezo requires borrowing at least {formatUSD(minFirstBorrow)} MUSD, but you only have{" "}
        {formatUSD(capacity)} of capacity. Deposit more BTC (about 0.035 BTC total) to start your treasury.
      </p>
    );
  }

  async function borrow() {
    const ok = await tx.run([{ label: "Borrowing MUSD", send: () => actions.borrowMUSD(toWei(clamped)) }]);
    if (ok) {
      toast.success(`Borrowed ${formatUSD(clamped)} MUSD into your vault.`, {
        href: tx.hash ? explorerTx(tx.hash) : undefined,
      });
      setAmount(0);
      v.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <span className="font-mono text-2xl font-semibold text-text-primary">{formatUSD(clamped)}</span>
        <span className="text-xs text-text-secondary">of {formatUSD(capacity)} available</span>
      </div>

      <Slider
        value={clamped}
        max={capacity}
        step={step}
        onChange={setAmount}
        danger={inWarningZone}
        aria-label="Borrow amount"
      />

      <div className="rounded border border-border-subtle bg-bg-base p-3">
        <PreviewRow
          label="New collateral ratio"
          value={formatRatio(newRatio)}
          valueClass={inWarningZone ? "text-warning" : "text-safe"}
        />
        <PreviewRow label="Margin-call price" value={formatUSD(newMarginCall)} valueClass="text-warning" />
        <PreviewRow label="Liquidation price (Mezo)" value={formatUSD(newLiq)} valueClass="text-danger" />
        <PreviewRow label="Monthly interest on this borrow" value={`${formatUSD(monthlyInterest(clamped))} / mo`} />
      </div>

      {belowMin ? (
        <p className="rounded border border-warning bg-warning/10 p-2.5 text-xs text-warning">
          Your first borrow must be at least {formatUSD(minFirstBorrow)} MUSD — Mezo requires that to open your
          position. (Later borrows have no minimum.)
        </p>
      ) : inWarningZone ? (
        <p className="rounded border border-warning bg-warning/10 p-2.5 text-xs text-warning">
          Borrowing this amount leaves limited safety margin (ratio below {SAFE_RATIO_PCT}%).
        </p>
      ) : null}

      <Button className="w-full" disabled={clamped <= 0 || belowMin} loading={tx.isBusy} onClick={borrow}>
        {tx.isBusy ? `${tx.stepLabel}…` : "Borrow MUSD"}
      </Button>

      {tx.status === "error" && tx.error ? <p className="text-sm text-danger">{tx.error}</p> : null}
    </div>
  );
}
