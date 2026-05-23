import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { mezoTestnet, anvilLocal } from "./chains";

/**
 * wagmi v2 config via RainbowKit (PRD §9.1, REQ-AUTH-01 fallback path).
 *
 * WalletConnect requires a real project id; with the dev placeholder its relay socket throws
 * "Connection interrupted while trying to subscribe" and blocks connecting. So we only enable
 * the WalletConnect/MetaMask-deeplink wallets when a real NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 * is set; otherwise we use the injected (browser-extension) connector only — which is all that's
 * needed for local mocks-first dev with the MetaMask extension. Mezo Passport layers on later.
 */
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "croesus_dev_placeholder";
const hasRealProjectId = Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: hasRealProjectId ? [injectedWallet, metaMaskWallet, walletConnectWallet] : [injectedWallet],
    },
  ],
  { appName: "Croesus", projectId },
);

// Local dev defaults to anvil (first chain). Swap the order when targeting Mezo Testnet.
export const wagmiConfig = createConfig({
  connectors,
  chains: [anvilLocal, mezoTestnet],
  transports: {
    [anvilLocal.id]: http(),
    [mezoTestnet.id]: http(),
  },
  ssr: true,
});
