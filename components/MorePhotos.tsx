"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, ImagePlus, RefreshCw } from "lucide-react";
import { ANGLES, retakeTarget, type CaptureTarget } from "@/lib/angles";
import { RETAKE_REASON_LABEL } from "@/lib/decision";
import type { TyreInspectionResult } from "@/types";
import { useApp, type Draft } from "./app-context";
import { ImageUploader } from "./ImageUploader";
import { VideoUploader } from "./VideoUploader";
import { Button } from "./ui/button";

/** True when the AI asked for a retake (lighting, closer look...) or found no tyre. */
export function needsMorePhotos(r: TyreInspectionResult): boolean {
  if (r.mode !== "REAL_AI") return false;
  return !!r.notATyre || !!r.retake;
}

/** Where to point the camera when the AI did not name a view we recognise. */
function fallbackTarget(draft: Draft): CaptureTarget {
  const photo = ANGLES.find((a) => draft.images[a.key]);
  if (photo) return { kind: "photo", key: photo.key };
  if (draft.videos.video1 || !Object.keys(draft.videos).length) return { kind: "video", key: "video1" };
  return { kind: "video", key: "video2" };
}

/**
 * Retake panel. When the AI rejected because of lighting / a closer look needed / blur..., the camera
 * opens AUTOMATICALLY on the flagged view with the AI's instruction over the viewfinder. After the
 * retake the inspector taps "Analyze again". For "not a tyre" the uploader opens without the camera.
 */
export function MorePhotos({ result }: { result: TyreInspectionResult }) {
  const { draft, setImages, setVideos, go } = useApp();
  const retake = result.retake;
  // Decided once per result, so re-renders never re-open a camera the inspector closed.
  const [target] = useState<CaptureTarget>(() => (retake && retakeTarget(retake.views)) || fallbackTarget(draft));
  const [open, setOpen] = useState(!!result.notATyre || !!retake);
  const count = Object.values(draft.images).filter(Boolean).length
    + Object.values(draft.videos).filter((f) => f?.length).length;

  const title = result.notATyre ? "Upload a tyre photo" : `Retake needed${retake ? `: ${RETAKE_REASON_LABEL[retake.reason]}` : ""}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-warn/40 p-4"
    >
      <div className="flex items-center gap-2">
        {retake ? <Camera size={18} className="shrink-0 text-warn" /> : <ImagePlus size={18} className="shrink-0 text-warn" />}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {retake?.instruction && <p className="mt-1.5 line-clamp-3 text-sm text-muted">{retake.instruction}</p>}

      {open ? (
        <>
          <div className="mt-3">
            {target.kind === "video" && !result.notATyre ? (
              <VideoUploader
                videos={draft.videos}
                onChange={setVideos}
                only={target.key}
                autoOpen={retake ? target.key : undefined}
                hint={retake?.instruction}
              />
            ) : (
              <ImageUploader
                images={draft.images}
                onChange={setImages}
                compact
                autoOpen={retake && target.kind === "photo" ? target.key : undefined}
                cameraHint={retake?.instruction}
              />
            )}
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
