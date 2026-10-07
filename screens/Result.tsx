"use client";

import { ArrowRight, Bookmark, Check, RefreshCw, ScanLine } from "lucide-react";
import { useApp } from "@/components/app-context";
import { Decision } from "@/components/Decision";
import { Disclaimer, ModeBadge, modeOf } from "@/components/DemoBadge";
import { Findings } from "@/components/Findings";
import { MorePhotos, needsMorePhotos } from "@/components/MorePhotos";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/decision";

export function ResultScreen() {
  const { current, isSaved, saveCurrent, openDefect, go, startNew } = useApp();
  if (!current) return <Fallback />;
  const { result } = current;
  const unavailable = modeOf(result) === "UNAVAILABLE";
  const saved = isSaved(current.id);

  return (
    <div className="pb-8">
      <ScreenHeader title="Inspection result" subtitle={`${current.id} · ${current.tyre.brand} · ${current.tyre.type}`} />
      <div className="space-y-6 px-5">
        <ModeBadge mode={modeOf(result)} />

        <Decision result={result} />

        {!saved && needsMorePhotos(result) && <MorePhotos result={result} />}

        {unavailable && !saved && (
          <Button variant="secondary" onClick={() => go("scanning", { replace: true })}>
            <RefreshCw size={16} /> Try the AI analysis again
          </Button>
        )}

        <Findings result={result} onOpen={openDefect} />

        <section>
          <h3 className="text-base font-semibold">Recommendation</h3>
          <p className="mt-1 text-base leading-snug">{result.recommendation}</p>
          {result.reason && <p className="mt-2 text-sm leading-relaxed text-muted">{result.reason}</p>}
        </section>

        <Disclaimer text={DISCLAIMER} />

        <div className="space-y-2.5">
          <Button onClick={() => saveCurrent()} disabled={saved}>
            {saved ? <><Check size={16} /> Saved</> : <><Bookmark size={16} /> Save inspection</>}
          </Button>
          <Button variant="secondary" onClick={() => go("detail")}>
            View full report <ArrowRight size={16} />
          </Button>
          <Button variant="ghost" onClick={() => { startNew(); go("dashboard"); go("new"); }}>
            <ScanLine size={16} /> Inspect another tyre
          </Button>
        </div>
      </div>
    </div>
  );
}

function Fallback() {
  const { go } = useApp();
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-muted">No inspection to show yet.</p>
      <Button full={false} onClick={() => go("dashboard")}>Go to dashboard</Button>
    </div>
  );
}
