import { videoToDataUrl } from "./image";

/** Frames sent to the AI per 360° video (one every 45° of the tyre). Server limit: route.ts MAX_VIDEO_FRAMES. */
export const FRAMES_PER_VIDEO = 8;

const SEEK_TIMEOUT_MS = 5000;

/** `n` items spread evenly across `items`, first and last included. */
export function pickEvenly<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return Array.from({ length: n }, (_, i) => items[Math.round((i * (items.length - 1)) / (n - 1))]);
}

function waitFor(el: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { cleanup(); reject(new Error("invalid-video")); }, SEEK_TIMEOUT_MS);
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error("invalid-video")); };
    const cleanup = () => {
      clearTimeout(t);
      el.removeEventListener(event, ok);
      el.removeEventListener("error", bad);
    };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", bad, { once: true });
  });
}

/** Some recordings (e.g. browser WebM) report an infinite duration until the end has been seeked. */
async function realDuration(el: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(el.duration) && el.duration > 0) return el.duration;
  el.currentTime = Number.MAX_SAFE_INTEGER;
  await waitFor(el, "seeked");
  const d = el.duration;
  el.currentTime = 0;
  await waitFor(el, "seeked");
  if (!Number.isFinite(d) || d <= 0) throw new Error("invalid-video");
  return d;
}

/** Samples FRAMES_PER_VIDEO evenly spaced JPEG frames from an uploaded video file. */
export async function framesFromVideoFile(file: File, count = FRAMES_PER_VIDEO): Promise<string[]> {
  if (!file.type.startsWith("video/")) throw new Error("invalid-video");
  const url = URL.createObjectURL(file);
  const el = document.createElement("video");
  el.muted = true;
  el.playsInline = true;
  el.preload = "auto";
  el.src = url;
  try {
    await waitFor(el, "loadeddata");
    const duration = await realDuration(el);
    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      // Centre of each slice, so the first and last frames are not black fade-in/out frames.
      el.currentTime = (duration * (i + 0.5)) / count;
      await waitFor(el, "seeked");
      frames.push(videoToDataUrl(el));
    }
    return frames;
  } finally {
    el.removeAttribute("src");
    el.load();
    URL.revokeObjectURL(url);
  }
}
