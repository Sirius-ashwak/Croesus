"use client";

import { cn } from "@/lib/utils";

/** Numeric input with a unit suffix, an optional MAX button, and a balance hint. */
export function AmountField({
  value,
  onChange,
  unit,
  max,
  onMax,
  placeholder = "0.00",
  hint,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  max?: number;
  onMax?: () => void;
  placeholder?: string;
  hint?: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 rounded border bg-bg-elevated px-3 py-2",
          invalid ? "border-danger" : "border-border focus-within:border-gold",
        )}
      >
        <input
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "" || /^\d*\.?\d*$/.test(next)) onChange(next);
          }}
          inputMode="decimal"
          placeholder={placeholder}
          className="w-full bg-transparent font-mono text-lg text-text-primary outline-none"
        />
        <span className="text-sm text-text-secondary">{unit}</span>
        {onMax ? (
          <button
            type="button"
            onClick={onMax}
            className="rounded border border-border px-2 py-0.5 text-xs text-gold hover:bg-bg-overlay"
          >
            MAX
          </button>
        ) : null}
      </div>
      {hint ? <p className={cn("mt-1.5 text-xs", invalid ? "text-danger" : "text-text-secondary")}>{hint}</p> : null}
    </div>
  );
}
