"use client";

import { RequireVault } from "@/components/vault/RequireVault";
import { StreamList } from "@/components/streams/StreamList";

export default function StreamsPage() {
  return (
    <RequireVault loadingLabel="Loading streams…" emptyBody="Open your treasury vault before setting up payroll streams.">
      <StreamList />
    </RequireVault>
  );
}
