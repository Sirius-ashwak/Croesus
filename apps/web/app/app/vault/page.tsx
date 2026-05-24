"use client";

import { RequireVault } from "@/components/vault/RequireVault";
import { SummaryStatsBar } from "@/components/vault/SummaryStatsBar";
import { PositionHealth } from "@/components/vault/PositionHealth";
import { VaultActions } from "@/components/vault/VaultActions";

export default function VaultPage() {
  return (
    <RequireVault
      loadingLabel="Loading vault…"
      emptyBody="Open your treasury vault to manage collateral and borrow MUSD."
    >
      <div>
        <SummaryStatsBar />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <PositionHealth />
          <VaultActions />
        </div>
      </div>
    </RequireVault>
  );
}
