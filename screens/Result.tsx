"use client";

import { Bookmark, Check, FileText, RefreshCw, ScanLine } from "lucide-react";
import { useApp } from "@/components/app-context";
import { Decision } from "@/components/Decision";
import { Disclaimer } from "@/components/ModeBadge";
import { Findings } from "@/components/Findings";
import { MorePhotos, needsMorePhotos } from "@/components/MorePhotos";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { Button } from "@/components/ui/button";
import { DISCLAIMER } from "@/lib/decision";

export function ResultScreen() {
  const { current, isSaved, saveCurrent, go, startNew } = useApp();
  if (!current) return <Fallback />;
  const { result } = current;
  const unavailable = result.mode === "UNAVAILABLE";
  const saved = isSaved(current.id);

  return (
    <div>
      <ScreenHeader title="Inspection result" subtitle={`${current.id} · ${current.tyre.brand} · ${current.tyre.type}`} />
      <div className="space-y-5 px-5">
        <Decision result={result} />

        {!saved && needsMorePhotos(result) && <MorePhotos result={result} />}

        {unavailable && !saved && (
          <Button variant="secondary" onClick={() => go("scanning", { replace: true })}>
            <RefreshCw size={16} /> Try the AI analysis again
          </Button>
        )}

        <Findings result={result} />

        <Disclaimer text={DISCLAIMER} />

        <Button variant="ghost" onClick={() => { startNew(); go("dashboard"); go("new"); }}>
          <ScanLine size={16} /> Inspect another tyre
        </Button>

        <StickyActions>
          <div className="grid grid-cols-2 gap-2.5">
            <Button onClick={() => saveCurrent()} disabled={saved}>
              {saved ? <><Check size={16} /> Saved</> : <><Bookmark size={16} /> Save</>}
            </Button>
            <Button variant="secondary" onClick={() => go("detail")}>
              <FileText size={16} /> Full report
            </Button>
          </div>
        </StickyActions>
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
