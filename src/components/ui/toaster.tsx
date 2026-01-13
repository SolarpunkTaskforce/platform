"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/cn";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-90 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "rounded-lg border bg-background p-4 shadow-md",
            t.variant === "destructive" && "border-destructive"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {t.title ? <div className="text-sm font-semibold">{t.title}</div> : null}
              {t.description ? (
                <div className="text-sm text-muted-foreground">{t.description}</div>
              ) : null}
            </div>

            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
