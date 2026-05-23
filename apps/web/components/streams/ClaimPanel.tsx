"use client";

import { useAccount, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import type { Address } from "viem";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useRecipientStreams } from "@/hooks/useStreams";
import { useTxRunner } from "@/hooks/useTxRunner";
import { useTicker } from "@/hooks/useTicker";
import { streamAbi, explorerTx } from "@/lib/contracts";
import { formatNumber, formatUSD, truncateAddress } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const toast = useToast();
  const { streams, totalClaimableMusd, dataUpdatedAt, isLoading, refetch } = useRecipientStreams(address);
  const { writeContractAsync } = useWriteContract();
  const tx = useTxRunner();

  // Live aggregate (only active streams keep accruing).
  const activeRate = streams.filter((s) => s.status === "active").reduce((sum, s) => sum + s.ratePerSec, 0);
  const liveTotal = useTicker(totalClaimableMusd, activeRate, isConnected, dataUpdatedAt);

  const claimable = streams.filter((s) => (s.status === "active" || s.status === "cancelled") && s.accruedMusd > 0);
  const contracts = Array.from(new Set(claimable.map((s) => s.streamAddress))) as Address[];

  async function claimAll() {
    const ok = await tx.run(
      contracts.map((sc) => ({
        label: "Claiming MUSD",
        send: () => writeContractAsync({ address: sc, abi: streamAbi, functionName: "claimAll", args: [] }),
      })),
    );
    if (ok) {
      toast.success(`Claimed ${formatUSD(totalClaimableMusd)} MUSD to your wallet.`, {
        href: tx.hash ? explorerTx(tx.hash) : undefined,
      });
      refetch();
    }
  }

  if (!isConnected) {
    return (
      <Card className="text-center">
        <CardTitle>Claim your salary</CardTitle>
        <p className="mb-6 text-text-secondary">
          Connect the wallet your stream pays to. No account needed — anyone can claim what they&apos;ve earned.
        </p>
        <div className="flex justify-center">
          <ConnectButton showBalance={false} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <CardTitle>Your claimable balance</CardTitle>
        <div className="my-4 font-mono text-5xl font-bold text-gold">${formatNumber(liveTotal, 4)}</div>
        <p className="mb-6 text-sm text-text-secondary">
          Across {claimable.length} stream{claimable.length === 1 ? "" : "s"} · paid in MUSD
        </p>
        <Button
          className="w-full"
          disabled={claimable.length === 0}
          loading={tx.isBusy}
          onClick={claimAll}
        >
          {tx.isBusy ? "Claiming…" : claimable.length === 0 ? "Nothing to claim" : "Claim All"}
        </Button>
        {tx.status === "error" && tx.error ? <p className="mt-2 text-sm text-danger">{tx.error}</p> : null}
      </Card>

      {isLoading && streams.length === 0 ? (
        <p className="text-center text-text-secondary">Looking up your streams…</p>
      ) : streams.length === 0 ? (
        <p className="text-center text-text-secondary">No streams are paying this wallet.</p>
      ) : (
        <div className="space-y-3">
          {streams.map((s) => (
            <div
              key={`${s.streamAddress}:${s.id}`}
              className="flex items-center justify-between rounded border border-border-subtle bg-bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <StatusBadge status={s.status} />
                <span className="text-sm text-text-secondary">from {truncateAddress(s.org)}</span>
              </div>
              <span className="font-mono text-sm text-text-primary">{formatUSD(s.accruedMusd)} claimable</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
