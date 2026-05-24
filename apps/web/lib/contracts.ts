import type { Abi, Address } from "viem";
import CroesusRegistryAbi from "@/abis/CroesusRegistry.json";
import CroesusVaultAbi from "@/abis/CroesusVault.json";
import CroesusStreamAbi from "@/abis/CroesusStream.json";
import MockMUSDAbi from "@/abis/MockMUSD.json";
import MockPythAbi from "@/abis/MockPyth.json";
import MockMezoBorrowAbi from "@/abis/MockMezoBorrow.json";

/** Generated ABIs (forge inspect). MUSD/tBTC share the mock ERC-20 ABI in dev. */
export const registryAbi = CroesusRegistryAbi as unknown as Abi;
export const vaultAbi = CroesusVaultAbi as unknown as Abi;
export const streamAbi = CroesusStreamAbi as unknown as Abi;
export const erc20Abi = MockMUSDAbi as unknown as Abi;
export const pythAbi = MockPythAbi as unknown as Abi;
export const mezoBorrowAbi = MockMezoBorrowAbi as unknown as Abi;

const toAddr = (v: string | undefined): Address | undefined =>
  v && v.length > 0 ? (v as Address) : undefined;

/**
 * Deployed addresses (filled by Deploy.s.sol / DeployMezo.s.sol output -> .env).
 * IMPORTANT: each NEXT_PUBLIC_* MUST be referenced as a STATIC literal — Next.js only
 * inlines `process.env.NEXT_PUBLIC_X` into the browser bundle at build time. Dynamic
 * access like `process.env[key]` is NOT replaced and resolves to undefined in the browser.
 */
export const addresses = {
  registry: toAddr(process.env.NEXT_PUBLIC_REGISTRY_ADDRESS),
  mezoBorrow: toAddr(process.env.NEXT_PUBLIC_MEZO_BORROW_ADDRESS),
  musd: toAddr(process.env.NEXT_PUBLIC_MUSD_TOKEN_ADDRESS),
  tbtc: toAddr(process.env.NEXT_PUBLIC_TBTC_TOKEN_ADDRESS),
  pyth: toAddr(process.env.NEXT_PUBLIC_PYTH_ORACLE_ADDRESS),
} as const;

export const BTC_USD_PRICE_ID = (process.env.NEXT_PUBLIC_BTC_USD_PRICE_FEED_ID ??
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43") as `0x${string}`;

/** Ratio convention helpers (contract uses 1e18 == 100%). */
export const CROESUS_MIN_RATIO_PCT = 150; // margin-call / borrow guard (hard floor)
export const SAFE_RATIO_PCT = 200; // recommended healthy ratio
export const MEZO_LIQUIDATION_RATIO_PCT = 110; // ~Mezo MCR — where Mezo actually liquidates
export const WARNING_RATIO_PCT = 175; // REQ-VAULT-03 yellow banner threshold
export const CRITICAL_RATIO_PCT = 130; // REQ-VAULT-03 red banner threshold
export const MIN_DEPOSIT_BTC = 0.001; // REQ-VAULT-01 minimum deposit
export const ANNUAL_RATE = 0.01; // 1% fixed
export const SECONDS_PER_MONTH = 2_628_000; // MUST match CroesusStream.SECONDS_PER_MONTH
// Mezo's minNetDebt: a trove cannot be OPENED below this (first borrow only). Read live from
// BorrowerOperations.minNetDebt() = 1800e18 on matsnet.
export const MEZO_MIN_FIRST_BORROW_MUSD = 1800;

export function explorerTx(hash: string): string {
  const base = process.env.NEXT_PUBLIC_MEZO_EXPLORER ?? "https://explorer.test.mezo.org";
  return `${base}/tx/${hash}`;
}
