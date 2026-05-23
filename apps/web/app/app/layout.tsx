import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { NetworkGuard } from "@/components/wallet/NetworkGuard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <NetworkGuard>{children}</NetworkGuard>
      </main>
    </div>
  );
}
