"use client";

import Link from "next/link";
import { RequireVault } from "@/components/vault/RequireVault";
import { CreateStreamForm } from "@/components/streams/CreateStreamForm";

export default function NewStreamPage() {
  return (
    <RequireVault emptyBody="Open your treasury vault before creating streams.">
      <div>
        <Link href="/app/streams" className="mb-4 inline-block text-sm text-text-secondary hover:text-text-primary">
          ← Back to streams
        </Link>
        <CreateStreamForm />
      </div>
    </RequireVault>
  );
}
