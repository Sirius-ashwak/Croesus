import { create } from "zustand";
import type { Address } from "viem";
import type { Stream } from "@/types/croesus";

/** Global state — PRD §9.2. Vault numbers are mirrored from on-chain reads every 30s. */
interface CroesusState {
  // Organization
  orgName: string | null;
  vaultAddress: Address | null;
  streamAddress: Address | null;
  isRegistered: boolean;

  // Vault (refreshed every 30s)
  btcDeposited: bigint;
  musdBorrowed: bigint;
  collateralRatio: bigint; // 1e18 = 100%
  liquidationPrice: bigint; // 8 decimals — Mezo ~110%
  marginCallPrice: bigint; // 8 decimals — Croesus 150%
  availableCredit: bigint; // 18 decimals
  btcPriceUSD: bigint; // 8 decimals
  lastOracleUpdate: number;

  // Streams
  streams: Stream[];
  totalMonthlyBurn: bigint;

  // Runway / stress test
  stressTestPercent: number; // 0 = current price, 80 = -80%

  // UI
  isLoading: boolean;
  lastRefreshed: number;

  // actions
  setOrg: (o: Partial<Pick<CroesusState, "orgName" | "vaultAddress" | "streamAddress" | "isRegistered">>) => void;
  setVault: (
    v: Partial<
      Pick<
        CroesusState,
        | "btcDeposited"
        | "musdBorrowed"
        | "collateralRatio"
        | "liquidationPrice"
        | "marginCallPrice"
        | "availableCredit"
        | "btcPriceUSD"
        | "lastOracleUpdate"
      >
    >,
  ) => void;
  setStreams: (streams: Stream[], totalMonthlyBurn: bigint) => void;
  setStressTestPercent: (pct: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initial = {
  orgName: null,
  vaultAddress: null,
  streamAddress: null,
  isRegistered: false,
  btcDeposited: 0n,
  musdBorrowed: 0n,
  collateralRatio: 0n,
  liquidationPrice: 0n,
  marginCallPrice: 0n,
  availableCredit: 0n,
  btcPriceUSD: 0n,
  lastOracleUpdate: 0,
  streams: [] as Stream[],
  totalMonthlyBurn: 0n,
  stressTestPercent: 0,
  isLoading: false,
  lastRefreshed: 0,
};

export const useCroesusStore = create<CroesusState>((set) => ({
  ...initial,
  setOrg: (o) => set(o),
  setVault: (v) => set({ ...v, lastRefreshed: Date.now() }),
  setStreams: (streams, totalMonthlyBurn) => set({ streams, totalMonthlyBurn }),
  setStressTestPercent: (pct) => set({ stressTestPercent: Math.min(80, Math.max(0, pct)) }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initial),
}));
