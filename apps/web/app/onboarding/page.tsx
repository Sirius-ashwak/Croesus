"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { NetworkGuard } from "@/components/wallet/NetworkGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useVaultActions } from "@/hooks/useVaultActions";
import { useOrg } from "@/hooks/useOrg";
import { parseTxError } from "@/lib/tx";

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
  const toast = useToast();
  const { registerOrganization, isPending, isConfirming, isSuccess } = useVaultActions();
  const { isRegistered, refetch } = useOrg();

  // Redirect once the org exists — either a fresh success or an already-registered wallet.
  useEffect(() => {
    if (isSuccess || isRegistered) {
      refetch();
      router.push("/app");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isRegistered]);

  async function handleOpenVault() {
    try {
      await registerOrganization(name.trim() || "My Treasury");
      // The receipt confirmation flips isSuccess, which triggers the redirect effect above.
    } catch (e) {
      const message = parseTxError(e);
      // Already having a treasury isn't an error — just send them to the dashboard.
      if (message.includes("already has a treasury")) {
        refetch();
        router.push("/app");
        return;
      }
      toast.error(message);
    }
  }

  const busy = isPending || isConfirming;

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
        disabled={busy}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !busy) handleOpenVault();
        }}
        className="mb-4 w-full rounded border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-gold disabled:opacity-50"
      />
      <Button className="w-full" loading={busy} onClick={handleOpenVault}>
        {isConfirming ? "Confirming…" : "Open Vault"}
      </Button>
    </Card>
  );
}
