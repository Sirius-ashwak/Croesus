"use client";

import Link from "next/link";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { SummaryStatsBar } from "@/components/vault/SummaryStatsBar";
import { PositionHealth } from "@/components/vault/PositionHealth";
import { VaultActions } from "@/components/vault/VaultActions";

export default function VaultPage() {
  const { isRegistered, isLoading } = useOrg();

  if (isLoading) {
    return <p className="text-text-secondary">Loading vault…</p>;
  }

  if (!isRegistered) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardTitle>No vault yet</CardTitle>
        <p className="mb-6 text-text-secondary">Open your treasury vault to manage collateral and borrow MUSD.</p>
        <Link href="/onboarding">
          <Button>Open a Vault</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <SummaryStatsBar />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PositionHealth />
        <VaultActions />
      </div>
    </div>
  );
}
