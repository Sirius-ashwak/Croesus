"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useOrg } from "@/hooks/useOrg";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/vault", label: "Vault" },
  { href: "/app/streams", label: "Streams" },
];

export function AppHeader() {
  const { org, isRegistered } = useOrg();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-bg-base/70 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/app" className="font-mono text-sm uppercase tracking-[0.3em] text-gold">
          ◆ Croesus
        </Link>
        {isRegistered && org?.name ? <span className="text-sm text-text-secondary">{org.name}</span> : null}
        <nav className="hidden gap-1 text-sm md:flex">
          {NAV.map((item) => {
            const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded px-3 py-1.5 transition-colors",
                  active ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded bg-bg-overlay"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
    </header>
  );
}
