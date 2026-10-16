"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Film, RotateCcw, Square, X } from "lucide-react";
import { videoToDataUrl } from "@/lib/image";
import { FRAMES_PER_VIDEO, pickEvenly } from "@/lib/video";
import { ViewfinderCorners } from "./ViewfinderCorners";

type CamState = "starting" | "live" | "recording" | "done" | "denied" | "unavailable";

// The scan has no fixed length (client: "depends on coverage of a complete tyre"): the inspector
// stops when the 360° is done. Samples stay bounded: when the buffer is full, every other sample
// is dropped and the interval doubles, so long scans keep even coverage.
const START_INTERVAL_MS = 400;
const MAX_SAMPLES = 48;
const MIN_SCAN_MS = 3000;
// Safety stop so a forgotten recording can't run forever.
const MAX_SCAN_MS = 5 * 60_000;

const mmss = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Full-screen 360° scan. Records from the camera and keeps FRAMES_PER_VIDEO evenly spaced frames. */
export function VideoCapture({
  title, hint, onCapture, onClose, onPickFile,
}: {
  title: string;
  hint?: string;
  onCapture: (frames: string[]) => void;
  onClose: () => void;
  onPickFile: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samples = useRef<string[]>([]);
  const interval = useRef(START_INTERVAL_MS);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const [state, setState] = useState<CamState>("starting");
  const [elapsed, setElapsed] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);

  const stopStream = useCallback(() => {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Bumped on every start/stop: a getUserMedia that resolves after Close or a newer start is stopped at once.
  const generation = useRef(0);

  const start = useCallback(async () => {
    const gen = ++generation.current;
    setState("starting");
    if (!navigator.mediaDevices?.getUserMedia) return setState("unavailable");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      if (gen !== generation.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setState("live");
    } catch (e) {
      const name = e instanceof DOMException ? e.name : "";
      setState(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  }, []);

  useEffect(() => {
    void start();
    return stopStream;
  }, [start, stopStream]);

  const finish = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    // Nothing was captured (camera gave no frames): stay live so the inspector can record again.
    if (!samples.current.length) return setState("live");
    setFrames(pickEvenly(samples.current, FRAMES_PER_VIDEO));
    stopStream();
    setState("done");
  }, [stopStream]);

  const sample = useCallback(() => {
    const v = videoRef.current;
    if (v?.videoWidth) {
      try {
        samples.current.push(videoToDataUrl(v));
      } catch {
        /* a dropped frame is fine; the next tick samples again */
      }
      if (samples.current.length >= MAX_SAMPLES) {
        samples.current = samples.current.filter((_, i) => i % 2 === 0);
        interval.current *= 2;
      }
    }
    const ms = Date.now() - startedAt.current;
    setElapsed(ms);
    if (ms >= MAX_SCAN_MS) return finish();
    timer.current = setTimeout(sample, interval.current);
  }, [finish]);

  const record = () => {
    samples.current = [];
    interval.current = START_INTERVAL_MS;
    startedAt.current = Date.now();
    setElapsed(0);
    setState("recording");
    sample();
  };

  const redo = () => {
    setFrames([]);
    setElapsed(0);
    void start();
  };

  const failed = state === "denied" || state === "unavailable";
  const recording = state === "recording";

  return (
    <div data-theme="dark" className="absolute inset-0 z-40 flex flex-col bg-black text-ink">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <button onClick={() => { stopStream(); onClose(); }} aria-label="Close camera" className="flex size-11 items-center justify-center rounded-full bg-white/10">
          <X size={18} />
        </button>
        <span className="text-sm font-medium">{title} · 360° scan</span>
        <span className={`tabular flex h-8 min-w-14 items-center justify-center rounded-full px-2 text-sm ${recording ? "bg-bad text-white" : "bg-white/10"}`}>
          {mmss(elapsed)}
        </span>
      </div>

      <div className="relative mx-3 flex-1 overflow-hidden rounded-3xl bg-surface">
        <video ref={videoRef} playsInline muted className={`size-full object-cover ${state === "done" ? "hidden" : ""}`} />

        {state === "done" && (
          <div className="grid size-full grid-cols-2 gap-1 overflow-y-auto p-1">
            {frames.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={f} alt={`Frame ${i + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
            ))}
          </div>
        )}

        {(state === "live" || recording) && (
          <>
            <div className="text-ink"><ViewfinderCorners inset="inset-6" /></div>
            <div className="pointer-events-none absolute inset-x-4 bottom-9 text-center text-sm text-white/85">
              {recording ? "Keep walking round the tyre. Stop when you are back at the start." : hint ?? "Walk slowly round the whole tyre"}
            </div>
          </>
        )}

        {state === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">Starting camera…</div>
        )}

        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-base font-semibold">
              {state === "denied" ? "Camera permission denied" : "Camera not available"}
            </p>
            <p className="text-sm text-muted">Upload a 360° video of the tyre instead.</p>
            <button
              onClick={onPickFile}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-bg"
            >
              <Film size={16} /> Choose video
            </button>
            <button onClick={() => void start()} className="min-h-11 text-sm text-muted underline">Try camera again</button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-around px-6 pb-8 pt-5">
        {state === "done" ? (
          <>
            <button onClick={redo} className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-sm">
              <RotateCcw size={16} /> Record again
            </button>
            <button
              onClick={() => { stopStream(); onCapture(frames); }}
              disabled={!frames.length}
              className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-bg disabled:opacity-40"
            >
              <Check size={16} /> Use video
            </button>
          </>
        ) : (
          <>
            <button onClick={onPickFile} aria-label="Upload a video" className="flex size-12 items-center justify-center rounded-full bg-white/10">
              <Film size={20} />
            </button>
            {recording ? (
              <button
                onClick={finish}
                disabled={elapsed < MIN_SCAN_MS}
                aria-label="Stop recording"
                className="flex size-[72px] items-center justify-center rounded-full border-4 border-white/80 disabled:opacity-40"
              >
                <Square size={26} className="fill-bad text-bad" />
              </button>
            ) : (
              <button
                onClick={record}
                disabled={state !== "live"}
                aria-label="Start recording"
                className="flex size-[72px] items-center justify-center rounded-full border-4 border-white/80 disabled:opacity-30"
              >
                <span className="size-14 rounded-full bg-bad transition-transform active:scale-90" />
              </button>
            )}
            <span className="size-12" />
          </>
        )}
      </div>
    </div>
  );
}
