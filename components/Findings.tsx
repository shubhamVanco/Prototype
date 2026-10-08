"use client";

import { ChevronDown } from "lucide-react";
import type { TyreInspectionResult } from "@/types";

function Section({ title, count, note, children }: { title: string; count?: number; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-semibold">
        {title}
        {count !== undefined && <span className="tabular font-normal text-muted"> ({count})</span>}
      </h3>
      {note && <p className="mt-0.5 text-sm text-muted">{note}</p>}
      {children}
    </section>
  );
}

/** One finding. Every text is kept to 2-3 lines. */
function Entry({ title, tag, meta, body, extra }: { title: string; tag?: string; meta: string; body: string; extra?: string }) {
  return (
    <li className="border-b border-line py-3.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-semibold">{title}</span>
        {tag && <span className="tabular shrink-0 text-sm text-muted">{tag}</span>}
      </div>
      <p className="mt-0.5 line-clamp-1 text-sm text-muted">{meta}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed">{body}</p>
      {extra && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">{extra}</p>}
    </li>
  );
}

function Bullets({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <Section title={title}>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
        {/* Clamp the text, not the <li>: line-clamp on the <li> itself hides its bullet */}
        {items.map((l) => <li key={l}><span className="line-clamp-3">{l}</span></li>)}
      </ul>
    </Section>
  );
}

const LIST = "mt-2 border-y border-line";

/** Retread rejection reasons and non-rejecting observations, listed separately. */
export function Findings({ result }: { result: TyreInspectionResult }) {
  const unavailable = result.mode === "UNAVAILABLE";
  const reasons = result.rejectionReasons ?? [];
  const obs = result.observations ?? [];
  const isReject = result.overallStatus === "REJECT";

  // "Not a tyre" is fully explained by the decision card (and kept in the printed report).
  if (result.notATyre) return null;

  return (
    <>
      {!unavailable && (
        <Section
          title={isReject ? "Rejection reasons" : "Possible rejection conditions"}
          count={reasons.length}
          note={!isReject && reasons.length ? "Not confirmed. Manual inspection needed to decide." : undefined}
        >
          {reasons.length ? (
            <ul className={LIST}>
              {reasons.map((r, i) => (
                <Entry
                  key={r.code + i} title={r.name} tag={r.code} meta={`${r.confidence}% confidence · ${r.location}`}
                  body={r.evidence} extra={`Why: ${r.why}`}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {result.overallStatus === "ACCEPT" ? "No rejection condition visible." : "No confirmed rejection condition."}
            </p>
          )}
        </Section>
      )}

      {!unavailable && obs.length > 0 && (
        <Section title="Observations" count={obs.length} note="Visible, but not an automatic rejection.">
          <ul className={LIST}>
            {obs.map((o, i) => (
              <Entry key={o.name + i} title={o.name} meta={o.location} body={o.evidence} extra={o.reason} />
            ))}
          </ul>
        </Section>
      )}

      <Bullets title="Required follow-up" items={result.followUp} />

      {/* Secondary detail stays one tap away instead of adding another screen of scrolling */}
      {(result.areasNotAssessable?.length || result.limitations?.length) ? (
        <details className="group rounded-2xl border border-line bg-surface px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
            More details
            <ChevronDown size={18} className="text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="space-y-4 pb-4">
            <Bullets title="Areas not assessed" items={result.areasNotAssessable} />
            <Bullets title="Limitations" items={result.limitations} />
          </div>
        </details>
      ) : null}
    </>
  );
}
