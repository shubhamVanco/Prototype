"use client";

import { Sparkles } from "lucide-react";
import { useApp } from "@/components/app-context";
import { ImageUploader } from "@/components/ImageUploader";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { ANGLES, demoImageSet } from "@/lib/demoImages";

export function CaptureScreen() {
  const { draft, setImages, go, notify, settings } = useApp();
  const count = ANGLES.filter((a) => draft.images[a.key]).length;

  const analyze = () => {
    if (!count) return notify("Add at least one tyre photo first", "warn");
    if (count < ANGLES.length) notify(`Analyzing with ${count} of 5 photos`, "info");
    go("scanning");
  };

  return (
    <div className="pb-8">
      <ScreenHeader title="Capture tyre" subtitle="Take clear images of the tyre from the required angles." />
      <div className="px-5">
        <ProgressSteps step={2} />
        <div className="mt-5">
          <ImageUploader images={draft.images} onChange={setImages} />
        </div>

        {settings.demoMode && <button
          onClick={() => setImages(demoImageSet())}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <Sparkles size={13} /> Use demo images
        </button>}

        <Button className="mt-2" onClick={analyze} disabled={!count}>
          Analyze tyre ({count}/5)
        </Button>
      </div>
    </div>
  );
}
