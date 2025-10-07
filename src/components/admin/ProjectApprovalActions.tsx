"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Action = "approve" | "reject";

type Message = {
  kind: "success" | "error";
  text: string;
};

type Props = {
  projectId: string;
  projectName?: string;
  layout?: "stacked" | "inline";
  className?: string;
};

export function ProjectApprovalActions({
  projectId,
  projectName,
  layout = "stacked",
  className,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = isPending || pendingAction !== null;

  function runAction(action: Action, extra?: Record<string, unknown>) {
    setMessage(null);
    setPendingAction(action);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/projects/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectId, ...extra }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);
          const errorMessage =
            typeof body?.error === "string"
              ? body.error
              : `Unable to ${action} project.`;
          setMessage({ kind: "error", text: errorMessage });
          return;
        }

        setMessage({
          kind: "success",
          text: `Project ${projectName ? `“${projectName}” ` : ""}${
            action === "approve" ? "approved" : "rejected"
          }.`,
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        setMessage({
          kind: "error",
          text: "Unexpected error. Please try again.",
        });
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex gap-2",
          layout === "stacked" ? "flex-col sm:flex-row" : "flex-row flex-wrap"
        )}
      >
        <button
          type="button"
          onClick={() => runAction("approve")}
          disabled={disabled}
          className={cn(
            "rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
            (disabled && pendingAction !== "approve") ||
              (pendingAction === "approve" && isPending)
              ? "opacity-80"
              : undefined
          )}
        >
          {pendingAction === "approve" && (isPending || pendingAction)
            ? "Approving…"
            : "Approve"}
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              const confirmed = window.confirm("Reject this project?");
              if (!confirmed) {
                setPendingAction(null);
                return;
              }
              const reason = window.prompt("Reason for rejection (optional)")?.trim();
              runAction("reject", reason ? { reason } : undefined);
              return;
            }
            runAction("reject");
          }}
          disabled={disabled}
          className={cn(
            "rounded bg-rose-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-rose-700",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600",
            (disabled && pendingAction !== "reject") ||
              (pendingAction === "reject" && isPending)
              ? "opacity-80"
              : undefined
          )}
        >
          {pendingAction === "reject" && (isPending || pendingAction)
            ? "Rejecting…"
            : "Reject"}
        </button>
      </div>

      {message && (
        <p
          className={cn(
            "text-xs",
            message.kind === "success"
              ? "text-emerald-600"
              : "text-rose-600"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}