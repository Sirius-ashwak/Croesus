"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { RequireVault } from "@/components/vault/RequireVault";
import { SummaryStatsBar } from "@/components/vault/SummaryStatsBar";
import { PositionHealth } from "@/components/vault/PositionHealth";
import { StressTestPanel } from "@/components/runway/StressTestPanel";
import { staggerChild, staggerParent } from "@/lib/motion";

export default function DashboardPage() {
  return (
    <RequireVault
      loadingLabel="Loading treasury…"
      emptyTitle="Welcome to Croesus"
      emptyBody="Open your treasury vault to collateralize BTC and start streaming payroll."
    >
      <motion.div variants={staggerParent} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={staggerChild}>
          <SummaryStatsBar />
        </motion.div>
        <motion.div variants={staggerChild}>
          <StressTestPanel />
        </motion.div>
        <motion.div variants={staggerChild} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
        </motion.div>
      </motion.div>
    </RequireVault>
  );
}
