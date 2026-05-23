"use client";

import Link from "next/link";
import { ClaimPanel } from "@/components/streams/ClaimPanel";

export default function ClaimPage() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <Link href="/" className="font-mono text-sm uppercase tracking-[0.3em] text-gold">
          ◆ Croesus
        </Link>
        <span className="text-xs text-text-secondary">Recipient claim portal</span>
      </header>
      <main className="mx-auto max-w-lg px-6 py-12">
        <ClaimPanel />
      </main>
    </div>
  );
}
