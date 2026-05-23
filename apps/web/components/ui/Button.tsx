"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-gold text-black hover:bg-gold-muted disabled:bg-gold/40",
  secondary: "border border-border text-text-primary hover:bg-bg-overlay",
  danger: "bg-danger text-black hover:bg-danger/80",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? "…" : children}
    </button>
  ),
);
Button.displayName = "Button";
