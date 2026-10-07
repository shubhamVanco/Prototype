"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useApp } from "@/components/app-context";
import { DefectOverlay } from "@/components/DefectOverlay";
import { Disclaimer } from "@/components/DemoBadge";
import { SEVERITY_STYLE, SeverityBadge } from "@/components/InspectionStatus";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/decision";
import { DEFECT_INFO } from "@/lib/taxonomy";

export function DefectDetailScreen() {
  const { current, defectId, openDefect, back } = useApp();
  const [open, setOpen] = useState(false);
  const defect = current?.result.defects.find((d) => d.id === defectId) ?? current?.result.defects[0];
  if (!current || !defect) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted">Defect not found.</p>
        <Button full={false} onClick={back}>Back</Button>
      </div>
    );
  }
  const info = DEFECT_INFO[defect.type];
  const s = SEVERITY_STYLE[defect.severity];
  const rows: [string, React.ReactNode][] = [
    ["Defect", defect.type],
    ["Status", defect.status === "POSSIBLE" ? "Possible (not confirmed)" : "Confirmed visible"],
    ["Severity", <SeverityBadge key="s" severity={defect.severity} />],
    ["Confidence", <span key="c" className={`tabular ${s.text}`}>{defect.confidence}%</span>],
    ["Location", defect.location],
  ];

  return (
    <div className="pb-8">
      <ScreenHeader title="Defect details" subtitle={`${current.id} · ${current.tyre.brand}`} />
      <div className="space-y-6 px-5">
        <DefectOverlay defect={defect} images={current.images} others={current.result.defects} />

        {current.result.defects.length > 1 && (
          <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Defects">
            {current.result.defects.map((d) => (
              <button
                key={d.id}
                onClick={() => openDefectInPlace(d.id, openDefect, back)}
                aria-pressed={d.id === defect.id}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${d.id === defect.id ? "border-ink bg-ink font-semibold text-bg" : "border-line text-muted"}`}
              >
                {d.type}
              </button>
            ))}
          </div>
        )}

        <dl className="border-y border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="text-right text-base font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        <section>
          <h3 className="text-base font-semibold">{current.result.mode === "DEMO" ? "Simulated description" : "Visual evidence"}</h3>
          <p className="mt-1 text-sm leading-relaxed">{defect.description}</p>
        </section>

        <section>
          <h3 className="text-base font-semibold">What it means</h3>
          <p className="mt-1 text-sm leading-relaxed">{info.meaning}</p>
        </section>

        <section>
          <h3 className="text-base font-semibold">Recommendation</h3>
          <p className="mt-1 text-sm leading-relaxed">{defect.recommendation}</p>
        </section>

        <section className="border-y border-line">
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex min-h-12 w-full items-center justify-between gap-2 text-left text-base font-semibold"
          >
            Why this matters
            <ChevronDown size={18} className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {open && <p className="pb-3.5 text-sm leading-relaxed text-muted">{info.why}</p>}
        </section>

        <Disclaimer text={DISCLAIMER} />
      </div>
    </div>
  );
}

/** Switch defect without growing the nav stack. */
function openDefectInPlace(id: string, open: (id: string) => void, back: () => void) {
  back();
  setTimeout(() => open(id), 0);
}
