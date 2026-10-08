"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, RefreshCw } from "lucide-react";
import type { TyreInspectionResult } from "@/types";
import { useApp } from "./app-context";
import { ImageUploader } from "./ImageUploader";
import { Button } from "./ui/button";

/** True when the AI asked for a clearer or additional photo, or found no tyre (so the user can replace and re-run). */
export function needsMorePhotos(r: TyreInspectionResult): boolean {
  if (r.mode !== "REAL_AI") return false;
  if (r.notATyre) return true;
  return r.overallStatus !== "REJECT" && (r.imageQuality?.usable === false || (r.followUp?.length ?? 0) > 0);
}

/**
 * Add / replace photos and re-run. Starts collapsed (one row) so it doesn't push the findings a screen down;
 * open straight away when no tyre was found, because adding a tyre photo is the only way forward.
 */
export function MorePhotos({ result }: { result: TyreInspectionResult }) {
  const { draft, setImages, go } = useApp();
  const [open, setOpen] = useState(!!result.notATyre);
  const hints = result.notATyre ? [] : (result.imageQuality?.issues ?? []);
  const count = Object.values(draft.images).filter(Boolean).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-warn/40 p-4"
    >
      <div className="flex items-center gap-2">
        <ImagePlus size={18} className="shrink-0 text-warn" />
        <h3 className="text-base font-semibold">{result.notATyre ? "Upload a tyre photo" : "A clearer photo would help"}</h3>
      </div>
      {hints.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
          {hints.map((h) => <li key={h}><span className="line-clamp-3">{h}</span></li>)}
        </ul>
      )}

      {open ? (
        <>
          {!result.notATyre && <p className="mt-1 text-sm text-muted">Add or replace photos, then analyze again.</p>}
          <div className="mt-3">
            <ImageUploader images={draft.images} onChange={setImages} compact />
          </div>
          <Button className="mt-3" disabled={!count} onClick={() => go("scanning", { replace: true })}>
            <RefreshCw size={16} /> Analyze again
          </Button>
        </>
      ) : (
        <Button variant="secondary" className="mt-3" onClick={() => setOpen(true)}>
          <ImagePlus size={16} /> Add photos
        </Button>
      )}
    </motion.section>
  );
}
