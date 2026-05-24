"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useStreamActions } from "@/hooks/useStreamActions";
import { useTxRunner } from "@/hooks/useTxRunner";
import { useTicker } from "@/hooks/useTicker";
import type { StreamView } from "@/hooks/useStreams";
import { claimWindowEnd, formatPerSecond, isAccruing, streamHealth } from "@/lib/streams";
import { getStreamLabel } from "@/lib/streamLabels";
import { explorerTx } from "@/lib/contracts";
import { cn, formatNumber, formatUSD, truncateAddress } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

const HEALTH_DOT: Record<string, string> = {
  safe: "bg-safe",
  warning: "bg-warning",
  danger: "bg-danger",
};

const HEALTH_TEXT: Record<string, string> = {
  safe: "text-safe",
  warning: "text-warning",
  danger: "text-danger",
};

export function StreamCard({
  stream,
  vaultMusdPool,
  anchorMs,
  onChanged,
}: {
  stream: StreamView;
  vaultMusdPool: number;
  anchorMs?: number;
  onChanged: () => void;
}) {
  const toast = useToast();
  const actions = useStreamActions(stream.streamAddress);
  const tx = useTxRunner();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const accruing = isAccruing(stream.status);
  const claimable = useTicker(stream.accruedMusd, stream.ratePerSec, accruing, anchorMs);
  const streamed = useTicker(stream.streamedToDateMusd, stream.ratePerSec, accruing, anchorMs);

  const monthsCovered = stream.monthlyMusd > 0 ? vaultMusdPool / stream.monthlyMusd : Infinity;
  const health = streamHealth(monthsCovered);
  const label = getStreamLabel(stream.streamAddress, stream.id);

  const isCancelled = stream.status === "cancelled" || stream.status === "expired";
  const daysLeft =
    stream.status === "cancelled"
      ? Math.max(0, Math.ceil((claimWindowEnd(stream.cancelledAt) * 1000 - Date.now()) / 86_400_000))
      : 0;

  async function cancel() {
    const ok = await tx.run([{ label: "Cancelling stream", send: () => actions.cancelStream(stream.id) }]);
    if (ok) {
      toast.success("Stream cancelled.", { href: tx.hash ? explorerTx(tx.hash) : undefined });
      setConfirmCancel(false);
      onChanged();
    }
  }

  async function togglePause() {
    const paused = stream.status === "paused";
    const ok = await tx.run([
      paused
        ? { label: "Resuming stream", send: () => actions.unpauseStream(stream.id) }
        : { label: "Pausing stream", send: () => actions.pauseStream(stream.id) },
    ]);
    if (ok) {
      toast.success(paused ? "Stream resumed." : "Stream paused.", {
        href: tx.hash ? explorerTx(tx.hash) : undefined,
      });
      onChanged();
    }
  }

  return (
    <div className="rounded border border-border-subtle bg-bg-surface p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn("inline-flex items-center gap-1 font-mono text-[10px]", HEALTH_TEXT[health])}
              title={`Funding health: ${health}`}
            >
              <span className={cn("h-2 w-2 rounded-full", HEALTH_DOT[health])} aria-hidden />
              {Number.isFinite(monthsCovered) ? `${formatNumber(monthsCovered, 1)}mo funded` : "fully funded"}
            </span>
            <span className="font-mono text-sm text-text-primary">{truncateAddress(stream.recipient)}</span>
            <StatusBadge status={stream.status} />
          </div>
          {label ? <p className="mt-1 text-sm text-text-secondary">{label}</p> : null}
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-text-primary">{formatUSD(stream.monthlyMusd)} / mo</div>
          <div className="text-xs text-text-secondary">{formatPerSecond(stream.ratePerSec)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-secondary">Claimable now</div>
          <div className={cn("font-mono text-xl font-semibold", accruing ? "text-gold" : "text-text-primary")}>
            {formatUSD(claimable, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-text-secondary">Streamed to date</div>
          <div className="font-mono text-xl font-semibold text-text-primary">{formatUSD(streamed, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
        </div>
      </div>

      {isCancelled ? (
        <p className="mt-4 rounded border border-border-subtle bg-bg-base p-2.5 text-xs text-text-secondary">
          {stream.status === "expired"
            ? "Claim window closed. Any unclaimed balance is no longer claimable."
            : `Cancelled — recipient has ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to claim the remaining balance.`}
        </p>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" loading={tx.isBusy} onClick={togglePause}>
            {stream.status === "paused" ? "Resume" : "Pause"}
          </Button>
          <Button variant="danger" className="flex-1" disabled={tx.isBusy} onClick={() => setConfirmCancel(true)}>
            Cancel
          </Button>
        </div>
      )}

      {tx.status === "error" && tx.error ? <p className="mt-2 text-sm text-danger">{tx.error}</p> : null}

      <Modal open={confirmCancel} onClose={() => !tx.isBusy && setConfirmCancel(false)} title="Cancel Stream">
        <p className="mb-4 text-sm text-text-secondary">
          Cancelling this stream stops future payments.{" "}
          <span className="text-text-primary">{truncateAddress(stream.recipient)}</span> will have 30 days to claim
          their accrued balance of <span className="text-gold">{formatUSD(stream.accruedMusd)}</span> MUSD.
        </p>
        {tx.status === "error" && tx.error ? <p className="mb-3 text-sm text-danger">{tx.error}</p> : null}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" disabled={tx.isBusy} onClick={() => setConfirmCancel(false)}>
            Keep streaming
          </Button>
          <Button variant="danger" className="flex-1" loading={tx.isBusy} onClick={cancel}>
            {tx.isBusy ? "Cancelling…" : "Cancel stream"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
