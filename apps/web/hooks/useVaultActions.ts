"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Address } from "viem";
import { vaultAbi, registryAbi, addresses } from "@/lib/contracts";

/**
 * Vault + registry write actions (PRD §11.3). Each returns a promise resolving to the tx hash;
 * callers await the receipt via `useWaitForTransactionReceipt` on the returned hash.
 */
export function useVaultActions(vaultAddress?: Address) {
  const { writeContractAsync, data: hash, isPending, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  // Collateral is native BTC on Mezo — sent as msg.value, no ERC-20 approval step.
  const depositCollateral = (amount: bigint) =>
    writeContractAsync({
      address: vaultAddress!,
      abi: vaultAbi,
      functionName: "depositCollateral",
      args: [amount],
      value: amount,
    });

  const borrowMUSD = (amount: bigint) =>
    writeContractAsync({ address: vaultAddress!, abi: vaultAbi, functionName: "borrowMUSD", args: [amount] });

  const repayMUSD = (amount: bigint) =>
    writeContractAsync({ address: vaultAddress!, abi: vaultAbi, functionName: "repayMUSD", args: [amount] });

  const withdrawCollateral = (amount: bigint) =>
    writeContractAsync({ address: vaultAddress!, abi: vaultAbi, functionName: "withdrawCollateral", args: [amount] });

  const registerOrganization = (name: string) =>
    writeContractAsync({ address: addresses.registry!, abi: registryAbi, functionName: "registerOrganization", args: [name] });

  return {
    depositCollateral,
    borrowMUSD,
    repayMUSD,
    withdrawCollateral,
    registerOrganization,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    reset,
  };
}
