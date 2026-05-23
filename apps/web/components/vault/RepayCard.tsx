"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useVault } from "@/hooks/useVault";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useTxRunner } from "@/hooks/useTxRunner";
import { explorerTx } from "@/lib/contracts";
import { liquidationPrice, ratioPercent } from "@/lib/vaultMath";
import { formatRatio, formatUSD, toWei } from "@/lib/utils";
import { AmountField } from "./AmountField";
import { PreviewRow } from "./PreviewRow";

export function RepayCard() {
  const v = useVault();
  const toast = useToast();
  const actions = useVaultActions(v.vaultAddress);
  const tx = useTxRunner();
  const [input, setInput] = useState("");

  if (v.debt === 0n) {
    return <p className="text-sm text-text-secondary">You have no outstanding MUSD debt.</p>;
  }

  const amount = Number(input) || 0;
  const repayableMax = Math.min(v.debtMusd, v.vaultMusdBalanceMusd);
  const overDebt = amount > v.debtMusd + 1e-9;
  const overPool = amount > v.vaultMusdBalanceMusd + 1e-9;
  const invalid = amount <= 0 || overDebt || overPool;

  const newDebt = Math.max(0, v.debtMusd - amount);
  const newRatio = ratioPercent(v.collateralValue, newDebt);
  const newLiq = liquidationPrice(v.collateralBtc, newDebt);

  const hint = overDebt
    ? "That's more than you owe"
    : overPool
      ? `Vault holds only ${formatUSD(v.vaultMusdBalanceMusd)} MUSD`
      : `Outstanding debt: ${formatUSD(v.debtMusd)} · Vault pool: ${formatUSD(v.vaultMusdBalanceMusd)}`;

  async function repay() {
    // Repay-all uses the exact debt bigint to avoid float dust leaving 1 wei behind.
    const amountWei = amount >= repayableMax - 1e-9 && repayableMax === v.debtMusd ? v.debt : toWei(amount);
    const ok = await tx.run([{ label: "Repaying MUSD", send: () => actions.repayMUSD(amountWei) }]);
    if (ok) {
      toast.success(`Repaid ${formatUSD(amount)} MUSD.`, { href: tx.hash ? explorerTx(tx.hash) : undefined });
      setInput("");
      v.refetch();
    }
  }

  return (
    <div className="space-y-4">
      <AmountField
        value={input}
        onChange={setInput}
        unit="MUSD"
        onMax={() => setInput(String(repayableMax))}
        hint={hint}
        invalid={overDebt || overPool}
      />

      {amount > 0 && !invalid ? (
        <div className="rounded border border-border-subtle bg-bg-base p-3">
          <PreviewRow label="New collateral ratio" value={formatRatio(newRatio)} valueClass="text-safe" />
          <PreviewRow
            label="New liquidation price"
            value={newDebt > 0 ? formatUSD(newLiq) : "None — debt cleared"}
            valueClass="text-danger"
          />
        </div>
      ) : null}

      <Button className="w-full" disabled={invalid} loading={tx.isBusy} onClick={repay}>
        {tx.isBusy ? "Confirming…" : "Repay MUSD"}
      </Button>

      {tx.status === "error" && tx.error ? <p className="text-sm text-danger">{tx.error}</p> : null}
    </div>
  );
}
