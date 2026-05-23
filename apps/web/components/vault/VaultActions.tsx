"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { DepositCard } from "./DepositCard";
import { BorrowCard } from "./BorrowCard";
import { RepayCard } from "./RepayCard";
import { WithdrawCard } from "./WithdrawCard";

type Tab = "deposit" | "borrow" | "repay" | "withdraw";

const TABS: { id: Tab; label: string }[] = [
  { id: "deposit", label: "Deposit" },
  { id: "borrow", label: "Borrow" },
  { id: "repay", label: "Repay" },
  { id: "withdraw", label: "Withdraw" },
];

export function VaultActions() {
  const [tab, setTab] = useState<Tab>("deposit");

  return (
    <Card>
      <CardTitle>Manage Collateral & Debt</CardTitle>
      <div className="mb-5 flex gap-1 border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              tab === t.id
                ? "border-gold text-gold"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "deposit" && <DepositCard />}
      {tab === "borrow" && <BorrowCard />}
      {tab === "repay" && <RepayCard />}
      {tab === "withdraw" && <WithdrawCard />}
    </Card>
  );
}
