"use client";

import Link from "next/link";
import { useOrg } from "@/hooks/useOrg";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { StreamList } from "@/components/streams/StreamList";

export default function StreamsPage() {
  const { isRegistered, isLoading } = useOrg();

  if (isLoading) return <p className="text-text-secondary">Loading streams…</p>;

  if (!isRegistered) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <CardTitle>No vault yet</CardTitle>
        <p className="mb-6 text-text-secondary">Open your treasury vault before setting up payroll streams.</p>
        <Link href="/onboarding">
          <Button>Open a Vault</Button>
        </Link>
      </Card>
    );
  }

  return <StreamList />;
}
