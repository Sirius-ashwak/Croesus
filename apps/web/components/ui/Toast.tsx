"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  href?: string;
  hrefLabel?: string;
}

interface ToastApi {
  success: (message: string, opts?: { href?: string; hrefLabel?: string }) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string, opts?: { href?: string; hrefLabel?: string }) => {
      const id = nextId.current++;
      setToasts((t) => [...t, { id, kind, message, ...opts }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, opts) => push("success", message, opts),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Screen readers announce additions to this region (DESIGN_REVIEW #4). */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[360px] max-w-[calc(100vw-3rem)] flex-col gap-3"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const accents: Record<ToastKind, string> = {
  success: "border-l-safe",
  error: "border-l-danger",
  info: "border-l-gold",
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      role={toast.kind === "error" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto rounded border border-border-subtle border-l-2 bg-bg-elevated p-4 shadow-lg",
        accents[toast.kind],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-text-primary">{toast.message}</p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="-m-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          ✕
        </button>
      </div>
      {toast.href ? (
        <a
          href={toast.href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-mono text-xs text-gold hover:underline"
        >
          {toast.hrefLabel ?? "View transaction"} ↗
        </a>
      ) : null}
    </motion.div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
