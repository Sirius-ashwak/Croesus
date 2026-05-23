"use client";

import Link from "next/link";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { SummaryStatsBar } from "@/components/vault/SummaryStatsBar";
import { PositionHealth } from "@/components/vault/PositionHealth";
import { StressTestPanel } from "@/components/runway/StressTestPanel";

export default function DashboardPage() {
  const { isRegistered, isLoading } = useOrg();

  if (isLoading) {
    return <p className="text-text-secondary">Loading treasury…</p>;
  }

  if (!isRegistered) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardTitle>Welcome to Croesus</CardTitle>
        <p className="mb-6 text-text-secondary">
          Open your treasury vault to collateralize BTC and start streaming payroll.
        </p>
        <Link href="/onboarding">
          <Button>Open a Vault</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryStatsBar />
      <StressTestPanel />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PositionHealth />
        <Card className="flex flex-col">
          <CardTitle>Treasury Actions</CardTitle>
          <p className="mb-6 text-text-secondary">
            Manage collateral and debt in the Vault, or set up per-second payroll in Streams.
          </p>
          <div className="mt-auto flex gap-3">
            <Link href="/app/vault" className="flex-1">
              <Button className="w-full">Open Vault</Button>
            </Link>
            <Link href="/app/streams" className="flex-1">
              <Button variant="secondary" className="w-full">
                Streams
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
