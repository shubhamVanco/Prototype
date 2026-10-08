"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Circle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { ANGLES } from "@/lib/angles";
import { fileToDataUrl } from "@/lib/image";
import { cn } from "@/lib/cn";
import type { ImageAngle, TyreImages } from "@/types";
import { CameraCapture } from "./CameraCapture";
import { useApp } from "./app-context";

/**
 * Five angle slots with camera / gallery capture.
 * `compact` drops the large preview box (used inside the result page to save a screen of scrolling).
 */
export function ImageUploader({
  images, onChange, compact = false,
}: { images: TyreImages; onChange: (i: TyreImages) => void; compact?: boolean }) {
  const { notify } = useApp();
  const galleryRef = useRef<HTMLInputElement>(null);
  const nativeCamRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<ImageAngle>(() => ANGLES.find((a) => !images[a.key])?.key ?? "full");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState<{ angle: ImageAngle; progress: number; preview?: string; done?: boolean } | null>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const pickNext = (current: ImageAngle, latest: TyreImages) => {
    const next = ANGLES.find((a) => !latest[a.key] && a.key !== current);
    if (next) setActive(next.key);
  };

  /**
   * Swiggy-style add: progress ring climbs while the photo is processed, snaps to 100%,
   * shows a tick, then the photo drops into its slot.
   */
  const addPhoto = async (angle: ImageAngle, source: Promise<string>) => {
    setBusy(true);
    setUp({ angle, progress: 4 });
    let ready: string | null = null;
    source.then((u) => { ready = u; setUp((c) => (c ? { ...c, preview: u } : c)); }).catch(() => {});
    const started = Date.now();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setUp((c) => (c && !c.done ? { ...c, progress: Math.min(ready ? 100 : 90, c.progress + (ready ? 14 : 6)) } : c));
    }, 70);
    try {
      const url = await source;
      const wait = Math.max(0, 700 - (Date.now() - started));
      await new Promise((r) => setTimeout(r, wait));
      setUp({ angle, progress: 100, preview: url, done: true });
      await new Promise((r) => setTimeout(r, 450));
      const latest = { ...imagesRef.current, [angle]: url };
      onChange(latest);
      setCameraOpen(false);
      pickNext(angle, latest);
    } catch (e) {
      notify(
        e instanceof Error && e.message === "invalid-image"
          ? "That file isn't a valid image"
          : "Upload failed. Please try again",
        "bad",
      );
    } finally {
      if (timer.current) clearInterval(timer.current);
      setUp(null);
      setBusy(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (nativeCamRef.current) nativeCamRef.current.value = "";
    }
  };

  const handleFile = (file?: File | null) => {
    if (file) void addPhoto(active, fileToDataUrl(file));
  };

  const openCamera = () => {
    if (typeof navigator.mediaDevices?.getUserMedia === "function") setCameraOpen(true);
    else nativeCamRef.current?.click(); // no getUserMedia (e.g. http on phone): use native camera picker
  };

  const activeInfo = ANGLES.find((a) => a.key === active)!;

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {ANGLES.map((a) => {
          const img = images[a.key];
          return (
            <button
              key={a.key}
              onClick={() => setActive(a.key)}
              aria-label={a.label}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-surface transition-colors",
                active === a.key ? "border-brand" : "border-line",
              )}
            >
              <AnimatePresence>
                {img && (
                  <motion.img
                    key={img.slice(-24)}
                    // eslint-disable-next-line @next/next/no-img-element
                    src={img}
                    alt=""
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
              </AnimatePresence>
              <span className="absolute bottom-1 right-1 flex size-4 items-center justify-center rounded-full bg-bg ring-1 ring-line">
                {up?.angle === a.key ? <Loader2 size={10} className="animate-spin text-brand" />
                  : img ? <Check size={10} className="text-ok" /> : <Circle size={8} className="text-muted" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cn("rounded-2xl border border-line bg-surface", compact ? "mt-2.5 p-3" : "mt-4 p-4")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold">{activeInfo.label} <span className="tabular font-normal text-muted">· {ANGLES.findIndex((a) => a.key === active) + 1} of 5</span></div>
            {!compact && <div className="text-sm text-muted">{activeInfo.hint}</div>}
          </div>
          {images[active] && (
            <button
              onClick={() => { const n = { ...images }; delete n[active]; onChange(n); }}
              aria-label="Remove photo"
              className="flex size-11 items-center justify-center rounded-full border border-line text-muted hover:text-bad"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div className={cn("relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-dashed border-ink/20 bg-bg", compact && !up && "hidden")}>
          {images[active] && up?.angle !== active ? (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img key={images[active]!.slice(-24)} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }}
              src={images[active]} alt={`${activeInfo.label} preview`} className="size-full object-cover" />
          ) : up?.angle === active ? null : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted">
              <Camera size={28} aria-hidden="true" />
              <span className="text-sm">No photo yet</span>
            </div>
          )}
          {up?.angle === active && <UploadOverlay up={up} />}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={openCamera}
            disabled={busy}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-bg disabled:opacity-50"
          >
            <Camera size={16} /> {images[active] ? "Retake" : "Camera"}
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            disabled={busy}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 text-sm font-medium disabled:opacity-50"
          >
            <ImagePlus size={16} /> Upload
          </button>
        </div>
      </div>

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={nativeCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      {cameraOpen && (
        <CameraCapture
          title={activeInfo.label}
          onClose={() => setCameraOpen(false)}
          onPickFile={() => galleryRef.current?.click()}
          onCapture={(url) => { setCameraOpen(false); void addPhoto(active, Promise.resolve(url)); }}
        />
      )}
    </div>
  );
}

function UploadOverlay({ up }: { up: { progress: number; preview?: string; done?: boolean } }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      {up.preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={up.preview} alt="" className="absolute inset-0 size-full object-cover opacity-60 blur-sm" />
      )}
      <div className="absolute inset-0 bg-bg/40" />
      <div className="relative flex flex-col items-center gap-2">
        <div className="relative size-[76px]">
          <svg viewBox="0 0 76 76" className="size-full -rotate-90">
            <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="5" className="text-ink" />
            <circle
              cx="38" cy="38" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
              stroke={up.done ? "var(--color-ok)" : "var(--color-brand)"}
              strokeDasharray={c} strokeDashoffset={c * (1 - up.progress / 100)}
              style={{ transition: "stroke-dashoffset 120ms linear, stroke 200ms" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {up.done ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14 }}>
                <Check size={28} className="text-ok" />
              </motion.span>
            ) : (
              <span className="text-sm font-semibold tabular-nums">{Math.round(up.progress)}%</span>
            )}
          </div>
        </div>
        <span className="rounded-full bg-surface/90 px-3 py-1 text-xs font-medium">
          {up.done ? "Photo added" : "Uploading photo…"}
        </span>
      </div>
    </div>
  );
}
