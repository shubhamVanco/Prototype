import { Cpu, ShieldAlert } from "lucide-react";
import type { AnalysisMode } from "@/types";

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="text-sm leading-relaxed text-muted">
      {text}
    </p>
  );
}

export function ModeBadge({ mode }: { mode: AnalysisMode }) {
  if (mode === "UNAVAILABLE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-bad/40 bg-bad/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-bad">
        <ShieldAlert size={13} /> AI unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
      <Cpu size={13} /> Real AI analysis
    </span>
  );
}
