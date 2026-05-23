"use client";

import { useCallback, useState } from "react";
import { usePublicClient } from "wagmi";
import type { Hash } from "viem";
import { parseTxError } from "@/lib/tx";

export type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export interface TxStep {
  /** Short label shown while this step is in flight, e.g. "Approving tBTC". */
  label: string;
  /** Sends the transaction and resolves to its hash (use writeContractAsync). */
  send: () => Promise<Hash>;
}

/**
 * Runs an ordered list of transactions, waiting for each receipt before the next
 * (e.g. approve → deposit). Tracks status + the active step label, surfaces the last
 * confirmed hash for an explorer link, and maps reverts to plain-English copy.
 */
export function useTxRunner() {
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<Hash | null>(null);
  const [stepLabel, setStepLabel] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setHash(null);
    setStepLabel(null);
  }, []);

  const run = useCallback(
    async (steps: TxStep[]): Promise<boolean> => {
      if (!publicClient) {
        setError("No connection to the network. Try again.");
        setStatus("error");
        return false;
      }
      try {
        setError(null);
        for (const step of steps) {
          setStepLabel(step.label);
          setStatus("pending");
          const h = await step.send();
          setHash(h);
          setStatus("confirming");
          await publicClient.waitForTransactionReceipt({ hash: h });
        }
        setStatus("success");
        setStepLabel(null);
        return true;
      } catch (e) {
        setError(parseTxError(e));
        setStatus("error");
        setStepLabel(null);
        return false;
      }
    },
    [publicClient],
  );

  return {
    status,
    error,
    hash,
    stepLabel,
    run,
    reset,
    isBusy: status === "pending" || status === "confirming",
    isSuccess: status === "success",
  };
}
