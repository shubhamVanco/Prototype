import { FlaskConical } from "lucide-react";

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
      <FlaskConical size={10} /> Demo mode
    </span>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="text-sm leading-relaxed text-muted">
      {text}
    </p>
  );
}

import { Cpu, ShieldAlert } from "lucide-react";
import type { AnalysisMode, TyreInspectionResult } from "@/types";

export const modeOf = (r: TyreInspectionResult): AnalysisMode => r.mode ?? (r.demo ? "DEMO" : "REAL_AI");

/** Never label a simulated result as AI analysis. */
export function ModeBadge({ mode }: { mode: AnalysisMode }) {
  if (mode === "DEMO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warn">
        <FlaskConical size={11} /> Demo mode — simulated result
      </span>
    );
  }
  if (mode === "UNAVAILABLE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-bad/40 bg-bad/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bad">
        <ShieldAlert size={11} /> AI unavailable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
      <Cpu size={11} /> Real AI analysis
    </span>
  );
}
