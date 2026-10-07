"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { useApp } from "@/components/app-context";
import { DemoBadge, ModeBadge } from "@/components/DemoBadge";
import { ScanAnimation } from "@/components/ScanAnimation";
import { cn } from "@/lib/cn";
import { runTyreInspection } from "@/services/tyreInspection";
import type { TyreInspectionResult } from "@/types";

// Real analysis: only steps that actually happen.
const REAL_STAGES = ["Uploading photos", "Analyzing photos", "Checking retread rejection criteria", "Preparing result"];
// Demo mode: simulated pipeline (labelled as a demo on screen).
const DEMO_STAGES = [
  "Image quality check", "Tyre segmentation", "Surface analysis",
  "Defect detection", "Severity assessment", "Retread recommendation",
];
const DEMO_DURATION = 3200;

export function ScanningScreen() {
  const { draft, settings, go, back, setCurrent, notify } = useApp();
  const real = !settings.demoMode;
  const stages = real ? REAL_STAGES : DEMO_STAGES;
  const [phase, setPhase] = useState(0); // real: index of the active stage
  const [upload, setUpload] = useState(real ? 0 : 1);
  const [p, setP] = useState(0); // demo: elapsed fraction
  const result = useRef<TyreInspectionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let ticker: ReturnType<typeof setInterval> | null = null;
    const t0 = Date.now();

    const finish = (r: TyreInspectionResult) => {
      if (cancelled) return;
      setCurrent({
        id: draft.tyre.tyreId || "TV-NEW", tyre: draft.tyre, images: draft.images, result: r, createdAt: Date.now(),
      });
      if (r.mode === "UNAVAILABLE") notify("AI inspection unavailable", "bad");
      go("result", { replace: true });
    };

    runTyreInspection({
      tyre: draft.tyre, images: draft.images, scenario: settings.scenario, demoMode: settings.demoMode,
      onUploadProgress: (f) => {
        if (cancelled) return;
        setUpload(f);
        if (f >= 1) setPhase((x) => Math.max(x, 1));
      },
    })
      .then((r) => {
        if (cancelled) return;
        result.current = r;
        if (real) {
          setPhase(2);
          timers.push(setTimeout(() => setPhase(3), 450));
          timers.push(setTimeout(() => finish(r), 900));
        }
      })
      .catch((e) => {
        if (cancelled) return;
        notify(e instanceof Error && e.message === "no-image" ? "No image to analyze" : "Analysis failed. Please retry", "bad");
        back();
      });

    if (!real) {
      ticker = setInterval(() => {
        const prog = Math.min(1, (Date.now() - t0) / DEMO_DURATION);
        setP(prog);
        if (prog >= 1 && result.current) {
          if (ticker) clearInterval(ticker);
          finish(result.current);
        }
      }, 60);
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (ticker) clearInterval(ticker);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = real ? phase : Math.min(stages.length - 1, Math.floor(p * stages.length));
  const percent = real
    ? Math.min(100, phase * 25 + (phase === 0 ? upload * 25 : 10))
    : p * 100;

  return (
    <div className="px-5 pb-8 pt-8">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 role="status" className="text-xl font-semibold">Analyzing tyre…</h1>
          <p className="text-sm text-muted">{draft.tyre.tyreId} · {draft.tyre.brand} · {draft.tyre.type}</p>
        </div>
        {settings.demoMode ? <DemoBadge /> : <ModeBadge mode="REAL_AI" />}
      </div>

      <ScanAnimation src={draft.images.full ?? Object.values(draft.images).find(Boolean)} />

      <div
        role="progressbar" aria-label="Analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}
        className="mt-4 h-1 overflow-hidden rounded-full bg-ink/10"
      >
        <div className="h-full origin-left rounded-full bg-ink" style={{ transform: `scaleX(${percent / 100})`, transition: "transform 160ms linear" }} />
      </div>

      <ul className="mt-5 space-y-3.5">
        {stages.map((s, i) => {
          const state = i < active ? "done" : i === active ? "active" : "todo";
          return (
            <li key={s} className={cn("flex items-center gap-3 text-base", state === "todo" ? "text-muted" : "text-ink")}>
              {state === "done" && <Check size={18} className="text-ok" aria-hidden="true" />}
              {state === "active" && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {state === "todo" && <Circle size={16} aria-hidden="true" />}
              {s}
              {real && i === 0 && state === "active" && (
                <span className="tabular ml-auto text-sm text-muted">{Math.round(upload * 100)}%</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
