"use client";

import { useEffect, useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { useApp } from "@/components/app-context";
import { ScanAnimation } from "@/components/ScanAnimation";
import { cn } from "@/lib/cn";
import { ANGLES } from "@/lib/angles";
import { runTyreInspection } from "@/services/tyreInspection";
import type { TyreInspectionResult } from "@/types";

// Only steps that actually happen. The tyre check and the criteria check run in parallel on the server.
const STAGES = ["Uploading photos", "Checking for a tyre and rejection criteria", "Preparing result"];

// Share of the bar each step gets; the AI step eases toward its end so the bar never stalls or jumps.
const UPLOAD_SHARE = 15;
const AI_END = 92;
const AI_EASE_MS = 12_000;
const TICK_MS = 200;

export function ScanningScreen() {
  const { draft, go, back, setCurrent, notify, setImages } = useApp();
  const [phase, setPhase] = useState(0); // index of the active stage
  const [upload, setUpload] = useState(0);
  const [aiStartedAt, setAiStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = (r: TyreInspectionResult) => {
      if (cancelled) return;
      setCurrent({
        id: draft.tyre.tyreId || "TV-NEW", tyre: draft.tyre, images: draft.images, result: r, createdAt: Date.now(),
      });
      if (r.notATyre) {
        // Drop the photos without a tyre from the draft so a re-run uses only tyre photos.
        const bad = new Set((r.rejectionReasons ?? []).map((x) => x.location));
        const kept = { ...draft.images };
        for (const a of ANGLES) if (bad.has(a.label)) delete kept[a.key];
        setImages(kept);
        notify("Rejected: no tyre in the photo", "bad");
      }
      if (r.mode === "UNAVAILABLE") notify("AI inspection unavailable", "bad");
      go("result", { replace: true });
    };

    runTyreInspection({
      tyre: draft.tyre, images: draft.images,
      onUploadProgress: (f) => {
        if (cancelled) return;
        setUpload(f);
        if (f >= 1) {
          setPhase((x) => Math.max(x, 1));
          setAiStartedAt((t) => t ?? Date.now());
        }
      },
    })
      .then((r) => {
        if (cancelled) return;
        setPhase(2);
        timers.push(setTimeout(() => setPhase(3), 450));
        timers.push(setTimeout(() => finish(r), 900));
      })
      .catch((e) => {
        if (cancelled) return;
        notify(e instanceof Error && e.message === "no-image" ? "No image to analyze" : "Analysis failed. Please retry", "bad");
        back();
      });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aiEased = aiStartedAt === null ? 0 : 1 - Math.exp(-(now - aiStartedAt) / AI_EASE_MS);
  const percent =
    phase === 0 ? upload * UPLOAD_SHARE
      : phase === 1 ? UPLOAD_SHARE + (AI_END - UPLOAD_SHARE) * aiEased
        : phase === 2 ? AI_END
          : 100;

  return (
    <div className="px-5 pb-8 pt-8">
      <div className="mb-5">
        <h1 role="status" className="text-xl font-semibold">Analyzing tyre…</h1>
        <p className="text-sm text-muted">{draft.tyre.tyreId} · {draft.tyre.brand} · {draft.tyre.type}</p>
      </div>

      <ScanAnimation src={draft.images.full ?? Object.values(draft.images).find(Boolean)} />

      <div
        role="progressbar" aria-label="Analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}
        className="mt-4 h-1 overflow-hidden rounded-full bg-ink/10"
      >
        <div className="h-full origin-left rounded-full bg-ink" style={{ transform: `scaleX(${percent / 100})`, transition: "transform 160ms linear" }} />
      </div>

      <ul className="mt-5 space-y-3.5">
        {STAGES.map((s, i) => {
          const state = i < phase ? "done" : i === phase ? "active" : "todo";
          return (
            <li key={s} className={cn("flex items-center gap-3 text-base", state === "todo" ? "text-muted" : "text-ink")}>
              {state === "done" && <Check size={18} className="text-ok" aria-hidden="true" />}
              {state === "active" && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {state === "todo" && <Circle size={16} aria-hidden="true" />}
              {s}
              {i === 0 && state === "active" && upload > 0 && (
                <span className="tabular ml-auto text-sm text-muted">{Math.round(upload * 100)}%</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
