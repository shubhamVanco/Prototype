"use client";

import { useEffect, useRef, useState } from "react";
import { Film, Loader2, Trash2, Video } from "lucide-react";
import { VIDEOS } from "@/lib/angles";
import { framesFromVideoFile } from "@/lib/video";
import type { TyreVideos, VideoSlot } from "@/types";
import { VideoCapture } from "./VideoCapture";
import { useApp } from "./app-context";

/**
 * The two 360° scan videos. Each video is kept as a set of evenly spaced frames, which is what
 * the AI inspects. `autoOpen` opens the recorder straight away (used when the AI asks for a retake).
 */
export function VideoUploader({
  videos, onChange, autoOpen, hint, only,
}: {
  videos: TyreVideos;
  onChange: (v: TyreVideos) => void;
  autoOpen?: VideoSlot;
  hint?: string;
  /** Show just this slot (retake panel) */
  only?: VideoSlot;
}) {
  const { notify } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<VideoSlot | null>(null);
  const [busy, setBusy] = useState<VideoSlot | null>(null);
  const target = useRef<VideoSlot>("video1");
  const videosRef = useRef(videos);
  videosRef.current = videos;

  useEffect(() => {
    if (!autoOpen) return;
    target.current = autoOpen;
    setRecording(autoOpen);
  }, [autoOpen]);

  const save = (slot: VideoSlot, frames: string[]) => {
    onChange({ ...videosRef.current, [slot]: frames });
    setRecording(null);
    notify(`${VIDEOS.find((v) => v.key === slot)?.label} added`, "ok");
  };

  const pickFile = (slot: VideoSlot) => {
    target.current = slot;
    fileRef.current?.click();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const slot = target.current;
    setRecording(null);
    setBusy(slot);
    try {
      save(slot, await framesFromVideoFile(file));
    } catch {
      notify("That video could not be read. Try another file", "bad");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = (slot: VideoSlot) => {
    const next = { ...videos };
    delete next[slot];
    onChange(next);
  };

  const slots = VIDEOS.filter((v) => !only || v.key === only);
  const active = VIDEOS.find((v) => v.key === recording);

  return (
    <div className="space-y-2.5">
      {slots.map((v) => {
        const frames = videos[v.key];
        return (
          <div key={v.key} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-bg">
              {frames?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frames[0]} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-muted">
                  {busy === v.key ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} aria-hidden="true" />}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{v.label} <span className="font-normal text-muted">· 360°</span></div>
              <div className="line-clamp-2 text-sm text-muted">
                {busy === v.key ? "Reading video…" : frames ? `${frames.length} frames ready` : v.hint}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              {frames && (
                <button
                  onClick={() => remove(v.key)}
                  aria-label={`Remove ${v.label}`}
                  className="flex size-11 items-center justify-center rounded-full border border-line text-muted hover:text-bad"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                onClick={() => { target.current = v.key; setRecording(v.key); }}
                disabled={!!busy}
                aria-label={`${frames ? "Re-record" : "Record"} ${v.label}`}
                className="flex size-11 items-center justify-center rounded-xl bg-ink text-bg disabled:opacity-50"
              >
                <Video size={16} />
              </button>
              <button
                onClick={() => pickFile(v.key)}
                disabled={!!busy}
                aria-label={`Upload ${v.label}`}
                className="flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2 disabled:opacity-50"
              >
                <Film size={16} />
              </button>
            </div>
          </div>
        );
      })}

      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />

      {active && (
        <VideoCapture
          title={active.label}
          hint={hint ?? active.hint}
          onClose={() => setRecording(null)}
          onPickFile={() => pickFile(active.key)}
          onCapture={(frames) => save(active.key, frames)}
        />
      )}
    </div>
  );
}
