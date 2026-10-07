"use client";

import { tyreSvg } from "@/lib/demoImages";
import { ViewfinderCorners } from "./ViewfinderCorners";

/** The photo under analysis, framed by corner marks, with one scan line passing over it. */
export function ScanAnimation({ src }: { src?: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src ?? tyreSvg("full")} alt="Tyre photo being analysed" className="size-full object-cover" />
      <div className="scan-line" aria-hidden="true" />
      <div className="text-ink"><ViewfinderCorners /></div>
    </div>
  );
}
