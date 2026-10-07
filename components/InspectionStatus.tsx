"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_LABEL } from "@/lib/decision";
import type { OverallStatus, Severity } from "@/types";

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
        size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs",
      )}
    >
      <Icon size={size === "sm" ? 12 : 14} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export const SEVERITY_STYLE: Record<Severity, { text: string; bg: string; border: string; hex: string; status: OverallStatus }> = {
  LOW: { text: "text-muted", bg: "bg-ink/5", border: "border-line", hex: "#9aa4b2", status: "ACCEPT" },
  MEDIUM: { text: "text-warn", bg: "bg-warn/10", border: "border-warn/30", hex: "#fbbf24", status: "REVIEW" },
  HIGH: { text: "text-warn", bg: "bg-warn/20", border: "border-warn/70", hex: "#fb923c", status: "REVIEW" },
  NOT_DETERMINABLE: { text: "text-warn", bg: "bg-warn/10", border: "border-warn/30", hex: "#fbbf24", status: "REVIEW" },
  CRITICAL: { text: "text-bad", bg: "bg-bad/10", border: "border-bad/30", hex: "#f87171", status: "REJECT" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider", s.text, s.bg, s.border)}>
      {severity === "NOT_DETERMINABLE" ? "POSSIBLE" : severity}
    </span>
  );
}
