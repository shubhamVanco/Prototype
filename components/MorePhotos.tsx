"use client";

import { motion } from "framer-motion";
import { ImagePlus, RefreshCw } from "lucide-react";
import type { TyreInspectionResult } from "@/types";
import { useApp } from "./app-context";
import { ImageUploader } from "./ImageUploader";
import { Button } from "./ui/button";

/** True when the AI asked for a clearer or additional photo (so the user can add more and re-run). */
export function needsMorePhotos(r: TyreInspectionResult): boolean {
  return (
    r.mode === "REAL_AI" &&
    r.overallStatus !== "REJECT" &&
    (r.imageQuality?.usable === false || (r.followUp?.length ?? 0) > 0)
  );
}

export function MorePhotos({ result }: { result: TyreInspectionResult }) {
  const { draft, setImages, go } = useApp();
  const hints = [...(result.imageQuality?.issues ?? []), ...(result.followUp ?? [])];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-warn/40 p-4"
    >
      <div className="flex items-center gap-2">
        <ImagePlus size={18} className="text-warn" />
        <h3 className="text-base font-semibold">The AI needs a clearer or additional photo</h3>
      </div>
      {hints.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
          {hints.map((h) => <li key={h}>{h}</li>)}
        </ul>
      )}
      <p className="mb-3 mt-2 text-sm text-muted">
        Add or replace photos below, then run the analysis again. Earlier photos are kept.
      </p>
      <ImageUploader images={draft.images} onChange={setImages} />
      <Button className="mt-4" onClick={() => go("scanning", { replace: true })}>
        <RefreshCw size={16} /> Re-analyze with new photos
      </Button>
    </motion.section>
  );
}
