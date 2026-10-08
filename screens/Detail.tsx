"use client";

import { Bookmark, Download } from "lucide-react";
import { useApp } from "@/components/app-context";
import { Decision } from "@/components/Decision";
import { Disclaimer } from "@/components/ModeBadge";
import { Findings } from "@/components/Findings";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { Button } from "@/components/ui/button";
import { ANGLES } from "@/lib/angles";
import { DISCLAIMER } from "@/lib/decision";
import { fullDate } from "@/lib/format";
import { printReport } from "@/lib/report";

export function DetailScreen() {
  const { current, isSaved, saveCurrent, back } = useApp();
  if (!current) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-muted">Inspection not found.</p>
        <Button full={false} onClick={back}>Back</Button>
      </div>
    );
  }
  const { result, tyre } = current;
  const photos = ANGLES.filter((a) => current.images[a.key]);
  const saved = isSaved(current.id);

  return (
    <div>
      {/* Tyre facts live in the header: one line instead of a 4-row table */}
      <ScreenHeader title={current.id} subtitle={`${tyre.brand} · ${tyre.type} · ${fullDate(current.createdAt)}`} />
      <div className="space-y-5 px-5">
        <Decision result={result} />

        {photos.length > 0 && (
          <section>
            <h3 className="text-base font-semibold">Photos</h3>
            <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
              {photos.map((a) => (
                <figure key={a.key} className="w-20 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={current.images[a.key]} alt={a.label} className="aspect-square w-full rounded-lg border border-line object-cover" />
                  <figcaption className="mt-1 truncate text-xs text-muted">{a.label}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <Findings result={result} />

        <Disclaimer text={DISCLAIMER} />

        <StickyActions>
          <div className={saved ? "" : "grid grid-cols-2 gap-2.5"}>
            <Button onClick={() => printReport(current)}><Download size={16} /> {saved ? "Download report" : "Report"}</Button>
            {!saved && <Button variant="secondary" onClick={() => saveCurrent()}><Bookmark size={16} /> Save</Button>}
          </div>
        </StickyActions>
      </div>
    </div>
  );
}
