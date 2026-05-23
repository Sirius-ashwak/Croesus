"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useOrgStreams } from "@/hooks/useStreams";
import { useVault } from "@/hooks/useVault";
import { formatUSD } from "@/lib/utils";
import { StreamCard } from "./StreamCard";

export function StreamList() {
  const { streams, totalMonthlyBurnMusd, dataUpdatedAt, isLoading, refetch } = useOrgStreams();
  const v = useVault();

  const activeCount = streams.filter((s) => s.status === "active" || s.status === "paused").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-hero text-3xl text-text-primary">Payroll Streams</h1>
          <p className="text-sm text-text-secondary">Continuous per-second MUSD distribution to your contributors.</p>
        </div>
        <Link href="/app/streams/new">
          <Button>+ New Stream</Button>
        </Link>
      </div>

      {isLoading && streams.length === 0 ? (
        <p className="text-text-secondary">Loading streams…</p>
      ) : streams.length === 0 ? (
        <Card className="text-center">
          <CardTitle>No streams yet</CardTitle>
          <p className="mb-6 text-text-secondary">
            Set up your first payroll stream to pay a contributor continuously, by the second.
          </p>
          <Link href="/app/streams/new">
            <Button>Create a Stream</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {streams.map((s) => (
              <StreamCard
                key={`${s.streamAddress}:${s.id}`}
                stream={s}
                vaultMusdPool={v.vaultMusdBalanceMusd}
                anchorMs={dataUpdatedAt}
                onChanged={() => {
                  refetch();
                  v.refetch();
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border-subtle bg-bg-surface px-5 py-4">
            <span className="text-sm text-text-secondary">
              {activeCount} active stream{activeCount === 1 ? "" : "s"} · Vault pool {formatUSD(v.vaultMusdBalanceMusd)} MUSD
            </span>
            <span className="font-mono text-lg font-semibold text-text-primary">
              {formatUSD(totalMonthlyBurnMusd)} <span className="text-sm text-text-secondary">/ mo total burn</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
