"use client";

import { motion } from "framer-motion";
import { tyreSvg } from "@/lib/demoImages";
import type { Defect, TyreImages } from "@/types";
import { SEVERITY_STYLE } from "./InspectionStatus";

/**
 * Shows the captured image for a defect with its bounding box.
 * Boxes are in percent of the displayed frame (4:3, object-cover), so the overlay
 * stays aligned regardless of screen size. Real engines convert pixel boxes to percent.
 */
export function DefectOverlay({
  defect, images, others = [],
}: { defect: Defect; images: TyreImages; others?: Defect[] }) {
  const angle = defect.angle ?? "full";
  const src = images[angle] ?? Object.values(images).find(Boolean) ?? tyreSvg(angle);
  const all = [defect, ...others.filter((d) => d.id !== defect.id && (d.angle ?? "full") === angle)];
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${angle} view of tyre`} className="size-full object-cover" />
      {all.map((d, i) => {
        if (!d.bbox) return null;
        const s = SEVERITY_STYLE[d.severity];
        const main = d.id === defect.id;
        return (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: main ? 1 : 0.45, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
            className="absolute rounded-md border-2"
            style={{
              left: `${d.bbox.x}%`, top: `${d.bbox.y}%`, width: `${d.bbox.w}%`, height: `${d.bbox.h}%`,
              borderColor: s.hex, background: `${s.hex}22`, boxShadow: main ? `0 0 16px ${s.hex}66` : "none",
            }}
          >
            {main && (
              <span
                className="absolute -top-6 left-[-2px] whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
                style={{ background: s.hex }}
              >
                {d.type} {d.confidence}%
              </span>
            )}
          </motion.div>
        );
      })}
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-white/80">
        {angle}
      </span>
    </div>
  );
}
