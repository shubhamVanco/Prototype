"use client";

import { useApp } from "@/components/app-context";
import { ImageUploader } from "@/components/ImageUploader";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { VideoUploader } from "@/components/VideoUploader";
import { Button } from "@/components/ui/button";
import { ANGLES, VIDEOS } from "@/lib/angles";

export function CaptureScreen() {
  const { draft, setImages, setVideos, go, notify } = useApp();
  const photos = ANGLES.filter((a) => draft.images[a.key]).length;
  const videos = VIDEOS.filter((v) => draft.videos[v.key]?.length).length;
  const total = photos + videos;

  const analyze = () => {
    if (!total) return notify("Add a tyre photo or a 360° video first", "warn");
    if (videos < VIDEOS.length) notify(`Analyzing with ${videos} of ${VIDEOS.length} videos`, "info");
    go("scanning");
  };

  return (
    <div>
      <ScreenHeader title="Capture tyre" subtitle="Two 360° videos, plus photos of any area of concern." />
      <div className="px-5">
        <ProgressSteps step={2} />

        <section className="mt-5" aria-labelledby="videos-h">
          <h2 id="videos-h" className="text-base font-semibold">
            360° videos <span className="tabular font-normal text-muted">· {videos} of {VIDEOS.length}</span>
          </h2>
          <div className="mt-2">
            <VideoUploader videos={draft.videos} onChange={setVideos} />
          </div>
        </section>

        <section className="mt-6" aria-labelledby="photos-h">
          <h2 id="photos-h" className="text-base font-semibold">
            Photos <span className="tabular font-normal text-muted">· {photos} of {ANGLES.length}</span>
          </h2>
          <div className="mt-2">
            <ImageUploader images={draft.images} onChange={setImages} />
          </div>
        </section>

        {/* Always on screen: on small phones the button used to sit under the bottom nav */}
        <StickyActions>
          <Button onClick={analyze} disabled={!total}>
            Analyze tyre
          </Button>
        </StickyActions>
      </div>
    </div>
  );
}
