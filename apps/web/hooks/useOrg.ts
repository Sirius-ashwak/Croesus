"use client";

import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import { registryAbi, addresses } from "@/lib/contracts";

export interface OrgData {
  owner: Address;
  vault: Address;
  stream: Address;
  name: string;
  createdAt: bigint;
}

/** Resolves the connected wallet's organization via CroesusRegistry (REQ-AUTH-02). */
export function useOrg() {
  const { address } = useAccount();

  const registered = useReadContract({
    address: addresses.registry,
    abi: registryAbi,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && addresses.registry) },
  });

  const isRegistered = Boolean(registered.data);

  const org = useReadContract({
    address: addresses.registry,
    abi: registryAbi,
    functionName: "getOrganization",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && addresses.registry && isRegistered) },
  });

  return {
    address,
    isRegistered,
    org: org.data as OrgData | undefined,
    isLoading: registered.isLoading || org.isLoading,
    refetch: () => {
      void registered.refetch();
      void org.refetch();
    },
  };
}
