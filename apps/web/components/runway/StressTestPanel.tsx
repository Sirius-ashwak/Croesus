"use client";

import { useMemo } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { useVault } from "@/hooks/useVault";
import { useTotalMonthlyBurn } from "@/hooks/useStreams";
import type { RunwayInputs } from "@/lib/runway";
import { RunwayWidget } from "./RunwayWidget";
import { StressTestSlider } from "./StressTestSlider";

/** The hero panel: current runway + the interactive stress-test simulator (PRD §7.4). */
export function StressTestPanel() {
  const v = useVault();
  const monthlyBurn = useTotalMonthlyBurn();

  const inputs = useMemo<RunwayInputs>(
    () => ({
      btcDeposited: v.collateralBtc,
      btcPriceUSD: v.btcPriceUsd,
      musdBorrowed: v.debtMusd,
      monthlyBurn,
    }),
    [v.collateralBtc, v.btcPriceUsd, v.debtMusd, monthlyBurn],
  );

  return (
    <Card>
      <CardTitle>Runway & Stress Test</CardTitle>
      <div className="grid gap-8 md:grid-cols-[minmax(0,260px)_1fr]">
        <RunwayWidget inputs={inputs} />
        <div className="border-border-subtle md:border-l md:pl-8">
          <StressTestSlider inputs={inputs} />
        </div>
      </div>
    </Card>
  );
}
