"use client";

import { useEffect } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { maxUint256, type Address } from "viem";
import { erc20Abi, vaultAbi, addresses } from "@/lib/contracts";
import { fromWei, priceFrom8dp } from "@/lib/utils";
import { collateralValueUSD, healthFromRatio } from "@/lib/vaultMath";
import type { HealthStatus } from "@/types/croesus";
import { useOrg } from "./useOrg";
import { useCroesusStore } from "@/store/useCroesusStore";

export interface VaultData {
  vaultAddress?: Address;
  streamAddress?: Address;
  account?: Address;
  isLoading: boolean;
  isFetched: boolean;
  refetch: () => void;

  // Raw on-chain values
  ratio: bigint; // 1e18 == 100%; maxUint256 when no debt
  collateral: bigint; // tBTC, 18dp
  debt: bigint; // MUSD, 18dp
  liquidationPriceRaw: bigint; // 8dp
  marginCallPriceRaw: bigint; // 8dp
  borrowCapacity: bigint; // MUSD, 18dp
  maxWithdrawable: bigint; // tBTC, 18dp
  btcPriceRaw: bigint; // 8dp
  vaultMusdBalance: bigint; // MUSD held by the vault (stream-funding pool), 18dp
  walletTbtc: bigint; // user wallet native BTC balance, 18dp

  // Derived human numbers
  collateralBtc: number;
  debtMusd: number;
  ratioPercent: number; // Infinity when no debt
  collateralValue: number; // USD
  liquidationPriceUsd: number;
  marginCallPriceUsd: number;
  borrowCapacityMusd: number;
  maxWithdrawableBtc: number;
  btcPriceUsd: number;
  vaultMusdBalanceMusd: number;
  walletTbtcBtc: number;
  utilizationPercent: number; // debt / max-capacity, 0..100
  safetyBufferUsd: number; // current price - liquidation price
  safetyBufferPercent: number;
  healthStatus: HealthStatus;
}

/**
 * Single source of truth for the Vault module. Resolves the connected wallet's vault
 * (REQ-AUTH-02) and reads every figure the UI needs in one multicall — vault views plus
 * MezoBorrow collateral/debt, the vault's MUSD pool, and the user's tBTC balance/allowance.
 * Refreshes every 30s (REQ-VAULT-03) and mirrors the result into the Zustand store (§9.2).
 */
export function useVault(): VaultData {
  const { address } = useAccount();
  const { org } = useOrg();
  const setVault = useCroesusStore((s) => s.setVault);

  const vaultAddress = org?.vault;
  const enabled = Boolean(vaultAddress && address && addresses.musd);

  // Collateral is the chain's NATIVE asset (BTC) on Mezo, so the user's spendable collateral
  // balance is their native wallet balance — not an ERC-20.
  const { data: nativeBalance } = useBalance({ address, query: { enabled, refetchInterval: 30_000 } });

  const { data, isLoading, isFetched, refetch } = useReadContracts({
    allowFailure: false,
    contracts: enabled
      ? ([
          { address: vaultAddress, abi: vaultAbi, functionName: "getCollateralRatio" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getLiquidationPrice" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getMarginCallPrice" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getAvailableBorrowCapacity" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getMaxWithdrawable" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getBTCPrice" },
          // Read position straight from the vault (works whether the borrow provider is the
          // shared mock or a per-org Mezo adapter — no need for its address here).
          { address: vaultAddress, abi: vaultAbi, functionName: "getCollateral" },
          { address: vaultAddress, abi: vaultAbi, functionName: "getDebt" },
          { address: addresses.musd, abi: erc20Abi, functionName: "balanceOf", args: [vaultAddress] },
        ] as const)
      : [],
    query: { enabled, refetchInterval: 30_000, staleTime: 25_000 },
  });

  const [
    ratio = maxUint256,
    liquidationPriceRaw = 0n,
    marginCallPriceRaw = 0n,
    borrowCapacity = 0n,
    maxWithdrawable = 0n,
    btcPriceRaw = 0n,
    collateral = 0n,
    debt = 0n,
    vaultMusdBalance = 0n,
  ] = (data as bigint[] | undefined) ?? [];

  const walletTbtc = nativeBalance?.value ?? 0n; // native BTC wallet balance, 18dp

  const collateralBtc = fromWei(collateral);
  const debtMusd = fromWei(debt);
  const btcPriceUsd = priceFrom8dp(btcPriceRaw);
  const collateralValue = collateralValueUSD(collateralBtc, btcPriceUsd);
  const liquidationPriceUsd = priceFrom8dp(liquidationPriceRaw);
  const marginCallPriceUsd = priceFrom8dp(marginCallPriceRaw);
  const borrowCapacityMusd = fromWei(borrowCapacity);
  const maxWithdrawableBtc = fromWei(maxWithdrawable);
  const ratioPercent = debt === 0n || ratio === maxUint256 ? Infinity : fromWei(ratio) * 100;
  const maxCapacity = debtMusd + borrowCapacityMusd;
  const utilizationPercent = maxCapacity > 0 ? (debtMusd / maxCapacity) * 100 : 0;
  const safetyBufferUsd = btcPriceUsd > 0 && debt > 0n ? btcPriceUsd - liquidationPriceUsd : Infinity;
  const safetyBufferPercent = btcPriceUsd > 0 && debt > 0n ? (safetyBufferUsd / btcPriceUsd) * 100 : Infinity;

  // Mirror into the global store so the dashboard/runway widgets read a single shape (§9.2).
  useEffect(() => {
    if (!isFetched) return;
    setVault({
      btcDeposited: collateral,
      musdBorrowed: debt,
      collateralRatio: ratio,
      liquidationPrice: liquidationPriceRaw,
      marginCallPrice: marginCallPriceRaw,
      availableCredit: borrowCapacity,
      btcPriceUSD: btcPriceRaw,
      lastOracleUpdate: Date.now(),
    });
  }, [isFetched, collateral, debt, ratio, liquidationPriceRaw, marginCallPriceRaw, borrowCapacity, btcPriceRaw, setVault]);

  return {
    vaultAddress,
    streamAddress: org?.stream,
    account: address,
    isLoading,
    isFetched,
    refetch: () => void refetch(),
    ratio,
    collateral,
    debt,
    liquidationPriceRaw,
    marginCallPriceRaw,
    borrowCapacity,
    maxWithdrawable,
    btcPriceRaw,
    vaultMusdBalance,
    walletTbtc,
    collateralBtc,
    debtMusd,
    ratioPercent,
    collateralValue,
    liquidationPriceUsd,
    marginCallPriceUsd,
    borrowCapacityMusd,
    maxWithdrawableBtc,
    btcPriceUsd,
    vaultMusdBalanceMusd: fromWei(vaultMusdBalance),
    walletTbtcBtc: fromWei(walletTbtc),
    utilizationPercent,
    safetyBufferUsd,
    safetyBufferPercent,
    healthStatus: healthFromRatio(ratioPercent),
  };
}
