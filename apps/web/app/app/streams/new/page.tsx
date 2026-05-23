"use client";

import Link from "next/link";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CreateStreamForm } from "@/components/streams/CreateStreamForm";

export default function NewStreamPage() {
  const { isRegistered, isLoading } = useOrg();

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;

  if (!isRegistered) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardTitle>No vault yet</CardTitle>
        <p className="mb-6 text-text-secondary">Open your treasury vault before creating streams.</p>
        <Link href="/onboarding">
          <Button>Open a Vault</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <Link href="/app/streams" className="mb-4 inline-block text-sm text-text-secondary hover:text-text-primary">
        ← Back to streams
      </Link>
      <CreateStreamForm />
    </div>
  );
}
