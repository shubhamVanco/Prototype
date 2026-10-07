"use client";

import { Download } from "lucide-react";
import { useApp } from "@/components/app-context";
import { Decision } from "@/components/Decision";
import { Disclaimer, ModeBadge, modeOf } from "@/components/DemoBadge";
import { Findings } from "@/components/Findings";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { ANGLES, tyreSvg } from "@/lib/demoImages";
import { DISCLAIMER } from "@/lib/decision";
import { fullDate } from "@/lib/format";
import { printReport } from "@/lib/report";

export function DetailScreen() {
  const { current, openDefect, isSaved, saveCurrent, back } = useApp();
  if (!current) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted">Inspection not found.</p>
        <Button full={false} onClick={back}>Back</Button>
      </div>
    );
  }
  const { result, tyre } = current;
  const mode = modeOf(result);
  const info: [string, string][] = [
    ["Tyre ID", current.id],
    ["Brand", tyre.brand],
    ["Type", tyre.type],
    ["Analysis", mode === "REAL_AI" ? "Real AI" : mode === "DEMO" ? "Demo (simulated)" : "Unavailable"],
  ];
  const hasPhotos = Object.values(current.images).some(Boolean);

  return (
    <div className="pb-8">
      <ScreenHeader title={current.id} subtitle={fullDate(current.createdAt)} />
      <div className="space-y-6 px-5">
        <ModeBadge mode={mode} />
        <Decision result={result} />

        <section>
          <h3 className="text-base font-semibold">Tyre</h3>
          <dl className="mt-2 border-y border-line">
            {info.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="text-right text-base font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="text-base font-semibold">Captured images</h3>
          {hasPhotos ? (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {ANGLES.filter((a) => current.images[a.key]).map((a) => (
                <figure key={a.key} className="w-28 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.images[a.key]} alt={a.label} className="aspect-square w-full rounded-lg border border-line object-cover" />
                  <figcaption className="mt-1 text-sm text-muted">{a.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">No photos stored for this record (sample data).</p>
          )}
        </section>

        <Findings result={result} onOpen={openDefect} />

        <section>
          <h3 className="text-base font-semibold">Recommendation</h3>
          <p className="mt-1 text-base leading-snug">{result.recommendation}</p>
          {result.reason && <p className="mt-2 text-sm leading-relaxed text-muted">{result.reason}</p>}
        </section>

        <Disclaimer text={DISCLAIMER} />

        <div className="space-y-2.5">
          <Button onClick={() => printReport(current)}><Download size={16} /> Download report</Button>
          {!isSaved(current.id) && <Button variant="secondary" onClick={() => saveCurrent()}>Save inspection</Button>}
        </div>
      </div>
    </div>
  );
}
