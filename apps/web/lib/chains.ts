import { defineChain } from "viem";

/** Mezo Testnet — PRD §8.4 (chainId 31611). BTC is the native gas asset. */
export const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MEZO_RPC ?? "https://rpc.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: process.env.NEXT_PUBLIC_MEZO_EXPLORER ?? "https://explorer.test.mezo.org",
    },
  },
  testnet: true,
});

/** Local anvil for mocks-first development. */
export const anvilLocal = defineChain({
  id: 31337,
  name: "Anvil (local)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_LOCAL_RPC ?? "http://127.0.0.1:8545"] } },
  testnet: true,
});

export const SUPPORTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31611);
