"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useVault } from "@/hooks/useVault";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useTxRunner } from "@/hooks/useTxRunner";
import { MIN_DEPOSIT_BTC, explorerTx } from "@/lib/contracts";
import { borrowCapacity, collateralValueUSD, ratioPercent } from "@/lib/vaultMath";
import { formatBTC, formatRatio, formatUSD, toWei } from "@/lib/utils";
import { AmountField } from "./AmountField";
import { PreviewRow } from "./PreviewRow";

export function DepositCard() {
  const v = useVault();
  const toast = useToast();
  const actions = useVaultActions(v.vaultAddress);
  const tx = useTxRunner();
  const [input, setInput] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amount = Number(input) || 0;
  const usdValue = amount * v.btcPriceUsd;

  // Preview the position after this deposit.
  const newCollateralValue = collateralValueUSD(v.collateralBtc + amount, v.btcPriceUsd);
  const newCapacity = borrowCapacity(newCollateralValue, v.debtMusd);
  const newRatio = ratioPercent(newCollateralValue, v.debtMusd);

  const tooSmall = amount > 0 && amount < MIN_DEPOSIT_BTC;
  const tooLarge = amount > v.walletTbtcBtc;
  const invalid = amount <= 0 || tooSmall || tooLarge;
  const hint = tooSmall
    ? `Minimum deposit is ${MIN_DEPOSIT_BTC} tBTC`
    : tooLarge
      ? "You don't have enough tBTC in your wallet"
      : `Wallet balance: ${formatBTC(v.walletTbtcBtc)}`;

  async function confirmDeposit() {
    const amountWei = toWei(amount);
    const needsApproval = v.tbtcAllowance < amountWei;
    const steps = [
      ...(needsApproval ? [{ label: "Approving tBTC", send: () => actions.approveTbtc(amountWei) }] : []),
      { label: "Depositing collateral", send: () => actions.depositCollateral(amountWei) },
    ];
    const ok = await tx.run(steps);
    if (ok) {
      toast.success(`Deposited ${formatBTC(amount)} as collateral.`, {
        href: tx.hash ? explorerTx(tx.hash) : undefined,
      });
      setInput("");
      setConfirmOpen(false);
      v.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <AmountField
        value={input}
        onChange={setInput}
        unit="tBTC"
        onMax={() => setInput(String(v.walletTbtcBtc))}
        hint={hint}
        invalid={tooSmall || tooLarge}
      />

      {amount > 0 && !invalid ? (
        <div className="rounded border border-border-subtle bg-bg-base p-3">
          <PreviewRow label="USD value" value={formatUSD(usdValue)} />
          <PreviewRow label="New borrowing capacity" value={formatUSD(newCapacity)} valueClass="text-gold" />
          {v.debt > 0n ? <PreviewRow label="New collateral ratio" value={formatRatio(newRatio)} /> : null}
        </div>
      ) : null}

      <Button className="w-full" disabled={invalid} onClick={() => setConfirmOpen(true)}>
        Deposit Collateral
      </Button>

      {tx.status === "error" && tx.error ? <p className="text-sm text-danger">{tx.error}</p> : null}

      <Modal open={confirmOpen} onClose={() => !tx.isBusy && setConfirmOpen(false)} title="Confirm Deposit">
        <p className="mb-4 text-sm text-text-secondary">
          You are depositing <span className="text-text-primary">{formatBTC(amount)}</span> ({formatUSD(usdValue)}).
          This gives you borrowing capacity of <span className="text-gold">{formatUSD(newCapacity)}</span> MUSD.
        </p>
        {tx.isBusy ? <p className="mb-3 text-sm text-text-secondary">{tx.stepLabel}…</p> : null}
        {tx.status === "error" && tx.error ? <p className="mb-3 text-sm text-danger">{tx.error}</p> : null}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" disabled={tx.isBusy} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" loading={tx.isBusy} onClick={confirmDeposit}>
            {tx.isBusy ? "Confirming…" : "Confirm"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
