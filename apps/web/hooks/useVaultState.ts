"use client";

import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { vaultAbi } from "@/lib/contracts";

/**
 * Reads the vault's view functions in one multicall (PRD §11.2).
 * Returns [ratio, liquidationPrice, marginCallPrice, availableCredit, maxWithdrawable, btcPrice].
 */
export function useVaultState(vaultAddress?: Address) {
  return useReadContracts({
    allowFailure: false,
    contracts: vaultAddress
      ? ([
          { address: vaultAddress, abi: vaultAbi, functionName: "getCollateralRatio" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getLiquidationPrice" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getMarginCallPrice" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getAvailableBorrowCapacity" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getMaxWithdrawable" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getBTCPrice" },
        ] as const)
      : [],
    query: {
      enabled: Boolean(vaultAddress),
      refetchInterval: 30_000,
      staleTime: 25_000,
    },
  });
}
