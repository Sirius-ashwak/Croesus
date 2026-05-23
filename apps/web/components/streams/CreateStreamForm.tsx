"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReadContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useOrg } from "@/hooks/useOrg";
import { useVault } from "@/hooks/useVault";
import { useTotalMonthlyBurn } from "@/hooks/useStreams";
import { useStreamActions } from "@/hooks/useStreamActions";
import { useTxRunner } from "@/hooks/useTxRunner";
import { streamAbi, explorerTx } from "@/lib/contracts";
import { ratePerSecond, formatPerSecond } from "@/lib/streams";
import { setStreamLabel } from "@/lib/streamLabels";
import { formatNumber, formatUSD, toWei } from "@/lib/utils";

export function CreateStreamForm() {
  const router = useRouter();
  const toast = useToast();
  const { org } = useOrg();
  const v = useVault();
  const existingBurn = useTotalMonthlyBurn();
  const actions = useStreamActions(org?.stream);
  const tx = useTxRunner();

  const [recipient, setRecipient] = useState("");
  const [label, setLabel] = useState("");
  const [monthlyInput, setMonthlyInput] = useState("");

  const nextIdQuery = useReadContract({
    address: org?.stream,
    abi: streamAbi,
    functionName: "nextStreamId",
    query: { enabled: Boolean(org?.stream) },
  });

  const monthly = Number(monthlyInput) || 0;
  const recipientValid = isAddress(recipient);
  const rate = ratePerSecond(monthly);

  const available = v.vaultMusdBalanceMusd + v.borrowCapacityMusd;
  const newBurn = existingBurn + monthly;
  const monthsCovered = newBurn > 0 ? available / newBurn : Infinity;
  const willExhaust = monthly > 0 && (available <= 0 || monthsCovered < 1);

  const invalid = !recipientValid || monthly <= 0;

  async function create() {
    if (!org) return;
    const fresh = await nextIdQuery.refetch();
    const newId = (fresh.data as bigint | undefined) ?? (nextIdQuery.data as bigint | undefined) ?? 0n;

    const ok = await tx.run([
      {
        label: "Creating stream",
        send: () => actions.createStream(org.vault, recipient as Address, toWei(monthly), 0n),
      },
    ]);
    if (ok) {
      if (label.trim() && org.stream) setStreamLabel(org.stream, newId, label);
      toast.success(`Stream of ${formatUSD(monthly)}/mo created.`, {
        href: tx.hash ? explorerTx(tx.hash) : undefined,
      });
      router.push("/app/streams");
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardTitle>New Payroll Stream</CardTitle>

      <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-text-secondary">Recipient address</label>
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value.trim())}
        placeholder="0x…"
        className={`mb-1 w-full rounded border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary outline-none ${
          recipient && !recipientValid ? "border-danger" : "border-border focus:border-gold"
        }`}
      />
      {recipient && !recipientValid ? (
        <p className="mb-3 text-xs text-danger">Enter a valid EVM address.</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-text-secondary">Label (optional)</label>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="e.g. Alice — Engineering"
        className="mb-4 w-full rounded border border-border bg-bg-elevated px-3 py-2 text-sm text-text-primary outline-none focus:border-gold"
      />

      <label className="mb-1 block text-xs uppercase tracking-[0.15em] text-text-secondary">Monthly amount (MUSD)</label>
      <div className="flex items-center gap-2 rounded border border-border bg-bg-elevated px-3 py-2 focus-within:border-gold">
        <input
          value={monthlyInput}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "" || /^\d*\.?\d*$/.test(next)) setMonthlyInput(next);
          }}
          inputMode="decimal"
          placeholder="3000"
          className="w-full bg-transparent font-mono text-lg text-text-primary outline-none"
        />
        <span className="text-sm text-text-secondary">MUSD</span>
      </div>

      {monthly > 0 ? (
        <div className="mt-4 rounded border border-border-subtle bg-bg-base p-3">
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-text-secondary">Per-second rate</span>
            <span className="font-mono text-gold">{formatPerSecond(rate)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-text-secondary">Available MUSD (pool + credit)</span>
            <span className="font-mono text-text-primary">{formatUSD(available)}</span>
          </div>
          <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-text-secondary">Lasts at total burn</span>
            <span className="font-mono text-text-primary">
              {Number.isFinite(monthsCovered) ? `~${formatNumber(monthsCovered, 1)} months` : "∞"}
            </span>
          </div>
        </div>
      ) : null}

      {willExhaust ? (
        <p className="mt-3 rounded border border-warning bg-warning/10 p-2.5 text-xs text-warning">
          This stream will exhaust your available MUSD in ~{formatNumber(monthsCovered, 1)} months. Consider
          depositing more collateral or borrowing more first.
        </p>
      ) : null}

      <Button className="mt-5 w-full" disabled={invalid} loading={tx.isBusy} onClick={create}>
        {tx.isBusy ? "Creating…" : "Create Stream"}
      </Button>

      {tx.status === "error" && tx.error ? <p className="mt-2 text-sm text-danger">{tx.error}</p> : null}
    </Card>
  );
}
