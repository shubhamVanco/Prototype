import type { ImageAngle, VideoSlot } from "@/types";

export const ANGLES: { key: ImageAngle; label: string; hint: string }[] = [
  { key: "full", label: "Full Tyre", hint: "Whole tyre in frame" },
  { key: "left", label: "Left Sidewall", hint: "Square-on to the sidewall" },
  { key: "right", label: "Right Sidewall", hint: "Square-on to the sidewall" },
  { key: "tread", label: "Tread", hint: "Close view of tread surface" },
  { key: "bead", label: "Bead", hint: "Inner edge near the rim" },
];

/** Client requirement: two videos, each a 360° scan of the tyre. */
export const VIDEOS: { key: VideoSlot; label: string; hint: string }[] = [
  { key: "video1", label: "Video 1", hint: "360° scan: walk slowly round the whole tyre, tread and corner in frame" },
  { key: "video2", label: "Video 2", hint: "360° scan of the other side: sidewall and corner in frame" },
];

/** View name the AI sees for a video frame. Must match VIDEO_FRAME_VIEW in lib/ai/tyreGate.ts. */
export const frameView = (videoLabel: string, n: number) => `${videoLabel} frame ${n}`;

export type CaptureTarget = { kind: "photo"; key: ImageAngle } | { kind: "video"; key: VideoSlot };

/** Maps the AI's retake view names ("Tread", "Video 2 frame 5", "Left sidewall shoulder") to a capture slot. */
export function retakeTarget(views: string[]): CaptureTarget | null {
  for (const raw of views) {
    const v = raw.toLowerCase();
    const video = VIDEOS.find((x) => v.includes(x.label.toLowerCase()));
    if (video) return { kind: "video", key: video.key };
    const photo = ANGLES.find((a) => v.includes(a.label.toLowerCase()) || v.startsWith(a.key));
    if (photo) return { kind: "photo", key: photo.key };
  }
  return null;
}
