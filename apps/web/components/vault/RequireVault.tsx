"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";

/**
 * Gate for treasury pages: a consistent loading state, or a single "open a vault" prompt
 * when the connected wallet has no org yet. Replaces four near-identical guard blocks across
 * the /app routes (DESIGN_REVIEW #12).
 */
export function RequireVault({
  children,
  loadingLabel = "Loading…",
  emptyTitle = "No vault yet",
  emptyBody = "Open your treasury vault to collateralize BTC and start streaming payroll.",
}: {
  children: ReactNode;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const { isRegistered, isLoading } = useOrg();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="animate-pulse text-text-secondary">{loadingLabel}</p>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardTitle>{emptyTitle}</CardTitle>
        <p className="mb-6 text-text-secondary">{emptyBody}</p>
        <Link href="/onboarding">
          <Button>Open a Vault</Button>
        </Link>
      </Card>
    );
  }

  return <>{children}</>;
}
