"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useOrg } from "@/hooks/useOrg";

export function AppHeader() {
  const { org, isRegistered } = useOrg();

  return (
    <header className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/app" className="font-mono text-sm uppercase tracking-[0.3em] text-gold">
          ◆ Croesus
        </Link>
        {isRegistered && org?.name ? (
          <span className="text-sm text-text-secondary">{org.name}</span>
        ) : null}
        <nav className="hidden gap-5 text-sm text-text-secondary md:flex">
          <Link href="/app" className="transition-colors hover:text-text-primary">
            Dashboard
          </Link>
          <Link href="/app/vault" className="transition-colors hover:text-text-primary">
            Vault
          </Link>
          <Link href="/app/streams" className="transition-colors hover:text-text-primary">
            Streams
          </Link>
        </nav>
      </div>
      <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
    </header>
  );
}
