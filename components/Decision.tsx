"use client";

import { motion } from "framer-motion";
import { Cpu, ShieldAlert } from "lucide-react";
import { NOT_A_TYRE_ROUTING, ROUTING } from "@/lib/decision";
import type { TyreInspectionResult } from "@/types";
import { STATUS_STYLE } from "./InspectionStatus";

/**
 * The answer to "should this tyre go to the retreading plant?" in one compact block:
 * verdict + title on one row, the AI's one specific reason under it, confidence and source in a footer.
 * Each fact is said once. A failed or unavailable analysis can never say YES.
 */
export function Decision({ result }: { result: TyreInspectionResult }) {
  const unavailable = result.mode === "UNAVAILABLE";
  const status = unavailable ? "REVIEW" : result.overallStatus;
  const r = result.notATyre ? NOT_A_TYRE_ROUTING : ROUTING[status];
  const st = STATUS_STYLE[status];
  // The AI's specific reason beats the generic routing note; show only one of them.
  const reason = result.summary || r.note;

  return (
    <section aria-labelledby="decision-title" className={`rounded-2xl border p-4 ${st.border} ${st.bg}`}>
      <div className="flex items-center gap-3.5">
        <motion.p
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`shrink-0 font-display text-[44px] font-bold leading-none tracking-tight ${st.text}`}
        >
          {r.verdict}
        </motion.p>
        <h2 id="decision-title" className="text-lg font-semibold leading-tight">
          <span className="sr-only">Send to retreading plant: {r.verdict}. </span>
          {r.title}
        </h2>
      </div>

      <p className="mt-2.5 line-clamp-3 text-[15px] leading-snug">{reason}</p>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2.5 text-sm text-muted">
        {unavailable ? (
          <span className="inline-flex items-center gap-1.5 text-bad"><ShieldAlert size={14} /> AI unavailable</span>
        ) : (
          <span className="inline-flex items-center gap-1.5"><Cpu size={14} /> Real AI analysis</span>
        )}
        {!unavailable && <span className="tabular">Confidence <b className="font-semibold text-ink">{result.confidence}%</b></span>}
      </div>
    </section>
  );
}
