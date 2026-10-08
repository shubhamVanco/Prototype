"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, RotateCcw, X, Zap, ZapOff } from "lucide-react";
import { videoToDataUrl } from "@/lib/image";
import { ViewfinderCorners } from "./ViewfinderCorners";

type CamState = "starting" | "live" | "denied" | "unavailable";

/** Full-screen camera. Falls back to a file picker if the camera can't be used. */
export function CameraCapture({
  title, onCapture, onClose, onPickFile,
}: {
  title: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  onPickFile: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CamState>("starting");
  const [shot, setShot] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [torchMsg, setTorchMsg] = useState("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setState("starting");
    if (!navigator.mediaDevices?.getUserMedia) return setState("unavailable");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
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
    return stop;
  }, [start, stop]);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    try {
      setShot(videoToDataUrl(v));
    } catch {
      setState("unavailable");
    }
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
    if (!track || !caps?.torch) {
      setTorchMsg("Flash not supported on this device");
      setTimeout(() => setTorchMsg(""), 2000);
      return;
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(!torch);
    } catch {
      setTorchMsg("Flash unavailable");
      setTimeout(() => setTorchMsg(""), 2000);
    }
  };

  const failed = state === "denied" || state === "unavailable";

  return (
    <div data-theme="dark" className="absolute inset-0 z-40 flex flex-col bg-black text-ink">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <button onClick={onClose} aria-label="Close camera" className="flex size-11 items-center justify-center rounded-full bg-white/10">
          <X size={18} />
        </button>
        <span className="text-sm font-medium">{title}</span>
        <button onClick={toggleTorch} aria-label="Toggle flash" className="flex size-11 items-center justify-center rounded-full bg-white/10">
          {torch ? <Zap size={18} className="text-warn" /> : <ZapOff size={18} />}
        </button>
      </div>

      <div className="relative mx-3 flex-1 overflow-hidden rounded-3xl bg-surface">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Captured preview" className="size-full object-cover" />
        ) : (
          <video ref={videoRef} playsInline muted className="size-full object-cover" />
        )}

        {!shot && !failed && (
          <>
            <div className="text-ink"><ViewfinderCorners inset="inset-6" /></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-9 text-center text-sm text-white/85">Align the tyre inside the frame</div>
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
            <p className="text-sm text-muted">
              {state === "denied"
                ? "Allow camera access in your browser settings, or choose a photo instead."
                : "This device or browser can't open the camera here. You can upload a photo instead."}
            </p>
            <button
              onClick={onPickFile}
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-bg"
            >
              <ImagePlus size={16} /> Choose photo
            </button>
            <button onClick={() => void start()} className="min-h-11 text-sm text-muted underline">Try camera again</button>
          </div>
        )}

        {torchMsg && (
          <div className="absolute inset-x-0 top-3 text-center">
            <span className="rounded-full bg-black/70 px-3 py-1 text-sm">{torchMsg}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-around px-6 pb-8 pt-5">
        {shot ? (
          <>
            <button onClick={() => setShot(null)} className="flex h-12 items-center gap-2 rounded-full bg-white/10 px-5 text-sm">
              <RotateCcw size={16} /> Retake
            </button>
            <button
              onClick={() => { stop(); onCapture(shot); }}
              className="flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-bg"
            >
              <Check size={16} /> Use photo
            </button>
          </>
        ) : (
          <>
            <button onClick={onPickFile} aria-label="Upload from gallery" className="flex size-12 items-center justify-center rounded-full bg-white/10">
              <ImagePlus size={20} />
            </button>
            <button
              onClick={snap}
              disabled={state !== "live"}
              aria-label="Capture"
              className="flex size-[72px] items-center justify-center rounded-full border-4 border-white/80 disabled:opacity-30"
            >
              <span className="size-14 rounded-full bg-white active:scale-90 transition-transform" />
            </button>
            <span className="size-12" />
          </>
        )}
      </div>
    </div>
  );
}
