"use client";

import { useApp } from "@/components/app-context";
import { ImageUploader } from "@/components/ImageUploader";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { Button } from "@/components/ui/button";
import { ANGLES } from "@/lib/angles";

export function CaptureScreen() {
  const { draft, setImages, go, notify } = useApp();
  const count = ANGLES.filter((a) => draft.images[a.key]).length;

  const analyze = () => {
    if (!count) return notify("Add at least one tyre photo first", "warn");
    if (count < ANGLES.length) notify(`Analyzing with ${count} of 5 photos`, "info");
    go("scanning");
  };

  return (
    <div>
      <ScreenHeader title="Capture tyre" subtitle="One clear photo is enough. More angles help." />
      <div className="px-5">
        <ProgressSteps step={2} />
        <div className="mt-5">
          <ImageUploader images={draft.images} onChange={setImages} />
        </div>

        {/* Always on screen: on small phones the button used to sit under the bottom nav */}
        <StickyActions>
          <Button onClick={analyze} disabled={!count}>
            Analyze tyre ({count}/5)
          </Button>
        </StickyActions>
      </div>
    </div>
  );
}
