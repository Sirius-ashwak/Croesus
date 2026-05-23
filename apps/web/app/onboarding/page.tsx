"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { NetworkGuard } from "@/components/wallet/NetworkGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useOrg } from "@/hooks/useOrg";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <NetworkGuard>
          <OnboardingForm />
        </NetworkGuard>
      </main>
    </div>
  );
}

function OnboardingForm() {
  const [name, setName] = useState("");
  const router = useRouter();
  const { registerOrganization, isPending, isConfirming, isSuccess } = useVaultActions();
  const { isRegistered, refetch } = useOrg();

  useEffect(() => {
    if (isSuccess || isRegistered) {
      refetch();
      router.push("/app");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isRegistered]);

  return (
    <Card className="mx-auto max-w-md">
      <CardTitle>Name your organization</CardTitle>
      <p className="mb-6 text-text-secondary">
        This deploys your vault and stream contracts and registers your treasury on-chain.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Acme DAO"
        className="mb-4 w-full rounded border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-gold"
      />
      <Button
        className="w-full"
        loading={isPending || isConfirming}
        onClick={() => registerOrganization(name || "My Treasury")}
      >
        {isConfirming ? "Confirming…" : "Open Vault"}
      </Button>
    </Card>
  );
}
