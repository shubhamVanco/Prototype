"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_LABEL } from "@/lib/decision";
import type { OverallStatus } from "@/types";

export const STATUS_STYLE: Record<OverallStatus, { text: string; bg: string; border: string; hex: string }> = {
  ACCEPT: { text: "text-ok", bg: "bg-ok/10", border: "border-ok/30", hex: "#34d399" },
  REVIEW: { text: "text-warn", bg: "bg-warn/10", border: "border-warn/30", hex: "#fbbf24" },
  REJECT: { text: "text-bad", bg: "bg-bad/10", border: "border-bad/30", hex: "#f87171" },
};

export const STATUS_ICON = { ACCEPT: CheckCircle2, REVIEW: AlertTriangle, REJECT: XCircle };

export function InspectionStatus({ status, size = "sm" }: { status: OverallStatus; size?: "sm" | "md" }) {
  const s = STATUS_STYLE[status];
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide",
        s.text, s.bg, s.border,
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
      )}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {STATUS_LABEL[status]}
    </span>
  );
}
