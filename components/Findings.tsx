"use client";

import type { TyreInspectionResult } from "@/types";
import { INTERNAL_NOTE } from "@/lib/decision";
import { DefectCard } from "./DefectCard";

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

/** Evidence entries with no drill-down (real-AI findings). */
function Entry({ title, tag, meta, body, extra }: { title: string; tag?: string; meta: string; body: string; extra?: string }) {
  return (
    <li className="border-b border-line py-3.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-base font-semibold">{title}</span>
        {tag && <span className="tabular shrink-0 text-sm text-muted">{tag}</span>}
      </div>
      <p className="mt-0.5 text-sm text-muted">{meta}</p>
      <p className="mt-2 text-sm leading-relaxed">{body}</p>
      {extra && <p className="mt-1.5 text-sm leading-relaxed text-muted">{extra}</p>}
    </li>
  );
}

function Bullets({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <Section title={title}>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
        {items.map((l) => <li key={l}>{l}</li>)}
      </ul>
    </Section>
  );
}

const LIST = "mt-2 border-y border-line";

/**
 * Real-AI results list retread rejection reasons and non-rejecting observations separately.
 * Demo / legacy results keep the confirmed-vs-possible defect list.
 */
export function Findings({ result, onOpen }: { result: TyreInspectionResult; onOpen: (id: string) => void }) {
  const unavailable = result.mode === "UNAVAILABLE";

  if (result.rejectionReasons) {
    const reasons = result.rejectionReasons;
    const obs = result.observations ?? [];
    const isReject = result.overallStatus === "REJECT";
    return (
      <>
        {!unavailable && (
          <Section
            title={isReject ? "Retread rejection reasons" : "Possible rejection conditions"}
            count={reasons.length}
            note={!isReject && reasons.length ? "Not confirmed. Manual inspection needed to decide." : undefined}
          >
            {reasons.length ? (
              <ul className={LIST}>
                {reasons.map((r, i) => (
                  <Entry
                    key={r.code + i} title={r.name} tag={r.code} meta={`${r.confidence}% confidence · ${r.location}`}
                    body={r.evidence} extra={`Why it meets the criterion: ${r.why}`}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {result.overallStatus === "ACCEPT"
                  ? "No configured retread rejection condition was visibly identified."
                  : "No confirmed retread rejection condition."}
              </p>
            )}
          </Section>
        )}

        {!unavailable && obs.length > 0 && (
          <Section title="Observations" count={obs.length} note="Visible, but not an automatic rejection.">
            <ul className={LIST}>
              {obs.map((o, i) => (
                <Entry key={o.name + i} title={o.name} meta={o.location} body={o.evidence} extra={`Not an automatic rejection: ${o.reason}`} />
              ))}
            </ul>
          </Section>
        )}

        <Bullets title="Areas not assessed" items={result.areasNotAssessable} />
        <Bullets title="Required follow-up" items={result.followUp} />
        <Bullets title="Limitations" items={result.limitations} />
      </>
    );
  }

  const confirmed = result.defects.filter((d) => d.status !== "POSSIBLE");
  const possible = result.defects.filter((d) => d.status === "POSSIBLE");
  return (
    <>
      {!unavailable && (
        <Section title="Detected defects" count={confirmed.length}>
          {confirmed.length ? (
            <ul className={LIST}>
              {confirmed.map((d) => <DefectCard key={d.id} defect={d} onClick={() => onOpen(d.id)} />)}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">No defects in the supplied image.</p>
          )}
        </Section>
      )}
      {possible.length > 0 && (
        <Section title="Possible observations" count={possible.length}>
          <ul className={LIST}>
            {possible.map((d) => <DefectCard key={d.id} defect={d} onClick={() => onOpen(d.id)} />)}
          </ul>
        </Section>
      )}
      <Bullets title="Areas not assessable" items={result.areasNotAssessable} />
      <Bullets title="Limitations" items={result.limitations} />
      {result.mode === "DEMO" && <p className="text-sm text-muted">{INTERNAL_NOTE}</p>}
    </>
  );
}
