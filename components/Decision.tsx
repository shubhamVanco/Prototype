"use client";

import { motion } from "framer-motion";
import { ROUTING, STATUS_HEADLINE } from "@/lib/decision";
import type { TyreInspectionResult } from "@/types";
import { STATUS_STYLE } from "./InspectionStatus";

/**
 * The answer to "should this tyre go to the retreading plant?" in one block.
 * YES / HOLD / NO is the headline; the pre-screen result and the AI's reasoning sit under it.
 * A failed or unavailable analysis can never say YES.
 */
export function Decision({ result }: { result: TyreInspectionResult }) {
  const unavailable = result.mode === "UNAVAILABLE";
  const status = unavailable ? "REVIEW" : result.overallStatus;
  const r = ROUTING[status];
  const st = STATUS_STYLE[status];

  return (
    <section aria-labelledby="decision-title" className={`rounded-2xl border p-5 ${st.border} ${st.bg}`}>
      <div className="overflow-hidden">
        <motion.p
          aria-hidden="true"
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className={`font-display text-[64px] font-bold leading-[0.9] tracking-tight ${st.text}`}
        >
          {r.verdict}
        </motion.p>
      </div>
      <h2 id="decision-title" className="mt-3 text-xl font-semibold leading-tight">
        <span className="sr-only">Send to retreading plant: {r.verdict}. </span>
        {r.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{r.note}</p>

      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 border-t border-line pt-3 text-sm">
        <div>
          <dt className="text-muted">Pre-screen result</dt>
          <dd className="font-semibold">{unavailable ? "Manual inspection required" : STATUS_HEADLINE[status]}</dd>
        </div>
        {!unavailable && (
          <div className="text-right">
            <dt className="text-muted">Confidence</dt>
            <dd className="tabular font-semibold">{result.confidence}%</dd>
          </div>
        )}
      </dl>
      {result.summary && <p className="mt-3 text-sm leading-relaxed text-muted">{result.summary}</p>}
    </section>
  );
}
