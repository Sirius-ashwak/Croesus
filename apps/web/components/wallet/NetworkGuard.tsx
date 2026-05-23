"use client";

import type { ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SUPPORTED_CHAIN_ID, anvilLocal, mezoTestnet } from "@/lib/chains";
import { Button } from "@/components/ui/Button";

const ANVIL_LOCAL_ID = 31337;
const TARGET_CHAIN = [anvilLocal, mezoTestnet].find((c) => c.id === SUPPORTED_CHAIN_ID) ?? mezoTestnet;

/**
 * Blocks app interaction unless the wallet is connected to Mezo Testnet (REQ-AUTH-01).
 * Local anvil (31337) is permitted during mocks-first development. Shows a clear
 * switch prompt instead of a raw error.
 */
export function NetworkGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return (
      <Centered>
        <p className="text-text-secondary">Connect a wallet to access your treasury.</p>
        <ConnectButton showBalance={false} />
      </Centered>
    );
  }

  const onSupportedNetwork = chainId === SUPPORTED_CHAIN_ID || chainId === ANVIL_LOCAL_ID;
  if (!onSupportedNetwork) {
    return (
      <Centered>
        <p className="text-text-secondary">Croesus runs on {TARGET_CHAIN.name}.</p>
        <Button onClick={() => switchChain({ chainId: SUPPORTED_CHAIN_ID })}>Switch to {TARGET_CHAIN.name}</Button>
      </Centered>
    );
  }

  return <>{children}</>;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">{children}</div>
  );
}
