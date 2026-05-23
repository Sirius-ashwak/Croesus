"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { useToast } from "@/components/ui/Toast";
import { useVault } from "@/hooks/useVault";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useTxRunner } from "@/hooks/useTxRunner";
import { explorerTx } from "@/lib/contracts";
import { collateralValueUSD, ratioPercent } from "@/lib/vaultMath";
import { formatBTC, formatRatio, formatUSD, toWei } from "@/lib/utils";
import { PreviewRow } from "./PreviewRow";

export function WithdrawCard() {
  const v = useVault();
  const toast = useToast();
  const actions = useVaultActions(v.vaultAddress);
  const tx = useTxRunner();
  const [amount, setAmount] = useState(0);

  if (v.collateral === 0n) {
    return <p className="text-sm text-text-secondary">You have no collateral deposited.</p>;
  }

  const max = v.maxWithdrawableBtc;
  if (max <= 0) {
    return (
      <p className="rounded border border-warning bg-warning/10 p-3 text-sm text-warning">
        Your position is at the 150% floor, so no collateral can be withdrawn right now. Repay MUSD or wait for BTC to
        rise to free up collateral.
      </p>
    );
  }

  const clamped = Math.min(amount, max);
  const step = Math.max(0.0001, max / 100);
  const newCollateral = Math.max(0, v.collateralBtc - clamped);
  const newRatio = ratioPercent(collateralValueUSD(newCollateral, v.btcPriceUsd), v.debtMusd);

  async function withdraw() {
    // Use the exact bigint at the cap so float rounding never trips the contract's floor check.
    const amountWei = clamped >= max - 1e-9 ? v.maxWithdrawable : toWei(clamped);
    const ok = await tx.run([{ label: "Withdrawing tBTC", send: () => actions.withdrawCollateral(amountWei) }]);
    if (ok) {
      toast.success(`Withdrew ${formatBTC(clamped)} to your wallet.`, {
        href: tx.hash ? explorerTx(tx.hash) : undefined,
      });
      setAmount(0);
      v.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <span className="font-mono text-2xl font-semibold text-text-primary">{formatBTC(clamped)}</span>
        <span className="text-xs text-text-secondary">max {formatBTC(max)}</span>
      </div>

      <Slider value={clamped} max={max} step={step} onChange={setAmount} aria-label="Withdraw amount" />

      <div className="rounded border border-border-subtle bg-bg-base p-3">
        <PreviewRow label="USD value" value={formatUSD(clamped * v.btcPriceUsd)} />
        {v.debt > 0n ? (
          <PreviewRow label="New collateral ratio" value={formatRatio(newRatio)} />
        ) : null}
      </div>

      <p className="text-xs text-text-secondary">
        Withdrawals are capped to keep your ratio at or above the 150% floor.
      </p>

      <Button className="w-full" disabled={clamped <= 0} loading={tx.isBusy} onClick={withdraw}>
        {tx.isBusy ? "Confirming…" : "Withdraw tBTC"}
      </Button>

      {tx.status === "error" && tx.error ? <p className="text-sm text-danger">{tx.error}</p> : null}
    </div>
  );
}
