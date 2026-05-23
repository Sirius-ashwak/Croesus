"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import type { Address } from "viem";
import { registryAbi, streamAbi, addresses } from "@/lib/contracts";
import { fromWei } from "@/lib/utils";
import { deriveStatus, ratePerSecond } from "@/lib/streams";
import type { StreamStatus } from "@/types/croesus";
import { useOrg } from "./useOrg";

export interface StreamView {
  id: bigint;
  streamAddress: Address; // the stream contract this lives in (recipient streams span orgs)
  org: Address; // the vault
  recipient: Address;
  monthlyMusd: number;
  ratePerSec: number; // MUSD/second
  startTime: number; // unix seconds
  lastClaimedAt: number;
  claimedMusd: number;
  cancelledAt: number; // 0 if not cancelled
  pausedAt: number; // 0 if running
  pausedDurationSec: number;
  active: boolean;
  accruedRaw: bigint; // claimable now (18dp)
  accruedMusd: number;
  streamedToDateMusd: number; // claimed + accrued
  status: StreamStatus;
}

type StreamRef = { streamAddress: Address; id: bigint };
type Tuple = readonly [Address, Address, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];

function toView(ref: StreamRef, tuple: Tuple, accruedRaw: bigint): StreamView {
  const [org, recipient, monthlyAmount, startTime, lastClaimedAt, claimed, cancelledAt, pausedAt, pausedDuration] =
    tuple;
  const monthlyMusd = fromWei(monthlyAmount);
  const accruedMusd = fromWei(accruedRaw);
  const claimedMusd = fromWei(claimed);
  return {
    id: ref.id,
    streamAddress: ref.streamAddress,
    org,
    recipient,
    monthlyMusd,
    ratePerSec: ratePerSecond(monthlyMusd),
    startTime: Number(startTime),
    lastClaimedAt: Number(lastClaimedAt),
    claimedMusd,
    cancelledAt: Number(cancelledAt),
    pausedAt: Number(pausedAt),
    pausedDurationSec: Number(pausedDuration),
    active: tuple[9],
    accruedRaw,
    accruedMusd,
    streamedToDateMusd: claimedMusd + accruedMusd,
    status: deriveStatus({ cancelledAt: Number(cancelledAt), pausedAt: Number(pausedAt) }),
  };
}

/** Reads struct + live accrued for each (streamContract, id) ref in one multicall, 30s poll. */
function useStreamRefs(refs: StreamRef[]) {
  const contracts = refs.flatMap((r) => [
    { address: r.streamAddress, abi: streamAbi, functionName: "streams", args: [r.id] },
    { address: r.streamAddress, abi: streamAbi, functionName: "getAccruedBalance", args: [r.id] },
  ]);

  const { data, isLoading, refetch, dataUpdatedAt } = useReadContracts({
    allowFailure: false,
    contracts,
    query: { enabled: refs.length > 0, refetchInterval: 30_000, staleTime: 25_000 },
  });

  const streams = useMemo<StreamView[]>(() => {
    if (!data) return [];
    return refs.map((ref, i) => toView(ref, data[i * 2] as Tuple, data[i * 2 + 1] as bigint));
  }, [data, refs]);

  return { streams, isLoading, refetch: () => void refetch(), dataUpdatedAt };
}

/** All streams owned by the connected org's vault, plus its aggregate monthly burn. */
export function useOrgStreams() {
  const { org } = useOrg();
  const streamAddress = org?.stream;
  const vault = org?.vault;

  const idsQuery = useReadContract({
    address: streamAddress,
    abi: streamAbi,
    functionName: "getOrgStreams",
    args: vault ? [vault] : undefined,
    query: { enabled: Boolean(streamAddress && vault), refetchInterval: 30_000 },
  });

  const burnQuery = useReadContract({
    address: streamAddress,
    abi: streamAbi,
    functionName: "getTotalMonthlyBurn",
    args: vault ? [vault] : undefined,
    query: { enabled: Boolean(streamAddress && vault), refetchInterval: 30_000 },
  });

  const refs = useMemo<StreamRef[]>(() => {
    const ids = (idsQuery.data as bigint[] | undefined) ?? [];
    return streamAddress ? ids.map((id) => ({ streamAddress, id })) : [];
  }, [idsQuery.data, streamAddress]);

  const details = useStreamRefs(refs);
  const totalMonthlyBurnRaw = (burnQuery.data as bigint | undefined) ?? 0n;

  return {
    streams: [...details.streams].sort((a, b) => Number(a.id - b.id)),
    totalMonthlyBurnRaw,
    totalMonthlyBurnMusd: fromWei(totalMonthlyBurnRaw),
    streamAddress,
    vault,
    isLoading: idsQuery.isLoading || details.isLoading,
    dataUpdatedAt: details.dataUpdatedAt,
    refetch: () => {
      void idsQuery.refetch();
      void burnQuery.refetch();
      details.refetch();
    },
  };
}

/** Just the org's aggregate monthly burn (for the always-on summary stats bar). */
export function useTotalMonthlyBurn(): number {
  const { org } = useOrg();
  const { data } = useReadContract({
    address: org?.stream,
    abi: streamAbi,
    functionName: "getTotalMonthlyBurn",
    args: org?.vault ? [org.vault] : undefined,
    query: { enabled: Boolean(org?.stream && org?.vault), refetchInterval: 30_000 },
  });
  return fromWei((data as bigint | undefined) ?? 0n);
}

/**
 * Every stream payable to `recipient`, across all registered orgs (REQ-STREAM-04). Enumerates
 * the registry's orgs → their per-org stream contracts → getRecipientStreams, then loads details.
 */
export function useRecipientStreams(recipient?: Address) {
  // Stage 1: how many orgs exist.
  const countQuery = useReadContract({
    address: addresses.registry,
    abi: registryAbi,
    functionName: "orgCount",
    query: { enabled: Boolean(addresses.registry && recipient) },
  });
  const orgCount = Number((countQuery.data as bigint | undefined) ?? 0n);

  // Stage 2: owner address at each index.
  const ownersQuery = useReadContracts({
    allowFailure: false,
    contracts: Array.from({ length: orgCount }, (_, i) => ({
      address: addresses.registry,
      abi: registryAbi,
      functionName: "orgList",
      args: [BigInt(i)],
    })),
    query: { enabled: orgCount > 0 },
  });

  // Stage 3: each owner's organization (we want its stream contract address).
  const owners = (ownersQuery.data as Address[] | undefined) ?? [];
  const orgsQuery = useReadContracts({
    allowFailure: false,
    contracts: owners.map((owner) => ({
      address: addresses.registry,
      abi: registryAbi,
      functionName: "getOrganization",
      args: [owner],
    })),
    query: { enabled: owners.length > 0 },
  });

  const streamContracts = useMemo<Address[]>(() => {
    const orgs = (orgsQuery.data as ReadonlyArray<{ stream: Address }> | undefined) ?? [];
    return Array.from(new Set(orgs.map((o) => o.stream)));
  }, [orgsQuery.data]);

  // Stage 4: recipient's stream ids within each stream contract.
  const recipStreamsQuery = useReadContracts({
    allowFailure: false,
    contracts: streamContracts.map((sc) => ({
      address: sc,
      abi: streamAbi,
      functionName: "getRecipientStreams",
      args: recipient ? [recipient] : undefined,
    })),
    query: { enabled: streamContracts.length > 0 && Boolean(recipient) },
  });

  const refs = useMemo<StreamRef[]>(() => {
    const lists = (recipStreamsQuery.data as bigint[][] | undefined) ?? [];
    return lists.flatMap((ids, i) => ids.map((id) => ({ streamAddress: streamContracts[i], id })));
  }, [recipStreamsQuery.data, streamContracts]);

  const details = useStreamRefs(refs);
  const claimable = details.streams.filter((s) => s.status === "active" || s.status === "cancelled");
  const totalClaimableMusd = claimable.reduce((sum, s) => sum + s.accruedMusd, 0);

  return {
    streams: details.streams,
    totalClaimableMusd,
    dataUpdatedAt: details.dataUpdatedAt,
    isLoading:
      countQuery.isLoading || ownersQuery.isLoading || orgsQuery.isLoading || recipStreamsQuery.isLoading || details.isLoading,
    refetch: () => {
      void recipStreamsQuery.refetch();
      details.refetch();
    },
  };
}
