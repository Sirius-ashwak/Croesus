"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Address } from "viem";
import { streamAbi } from "@/lib/contracts";

/** Stream write actions (PRD §11.3, §7.3). */
export function useStreamActions(streamAddress?: Address) {
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const createStream = (vault: Address, recipient: Address, monthly: bigint, startTime: bigint = 0n) =>
    writeContractAsync({
      address: streamAddress!,
      abi: streamAbi,
      functionName: "createStream",
      args: [vault, recipient, monthly, startTime],
    });

  const cancelStream = (id: bigint) =>
    writeContractAsync({ address: streamAddress!, abi: streamAbi, functionName: "cancelStream", args: [id] });

  const pauseStream = (id: bigint) =>
    writeContractAsync({ address: streamAddress!, abi: streamAbi, functionName: "pauseStream", args: [id] });

  const unpauseStream = (id: bigint) =>
    writeContractAsync({ address: streamAddress!, abi: streamAbi, functionName: "unpauseStream", args: [id] });

  const claim = (id: bigint) =>
    writeContractAsync({ address: streamAddress!, abi: streamAbi, functionName: "claim", args: [id] });

  const claimAll = () =>
    writeContractAsync({ address: streamAddress!, abi: streamAbi, functionName: "claimAll", args: [] });

  return {
    createStream,
    cancelStream,
    pauseStream,
    unpauseStream,
    claim,
    claimAll,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    reset,
  };
}
