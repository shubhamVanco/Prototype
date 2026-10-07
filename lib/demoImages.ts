import type { ImageAngle, TyreImages } from "@/types";

export const ANGLES: { key: ImageAngle; label: string; hint: string }[] = [
  { key: "full", label: "Full Tyre", hint: "Whole tyre in frame" },
  { key: "left", label: "Left Sidewall", hint: "Square-on to the sidewall" },
  { key: "right", label: "Right Sidewall", hint: "Square-on to the sidewall" },
  { key: "tread", label: "Tread", hint: "Close view of tread surface" },
  { key: "bead", label: "Bead", hint: "Inner edge near the rim" },
];

/** Generated placeholder tyre picture (SVG data URI). Used for demo images and seeded records. */
export function tyreSvg(angle: ImageAngle): string {
  const tread = angle === "tread";
  const body = tread
    ? Array.from({ length: 9 }, (_, i) =>
        `<path d="M${-20 + i * 55} 0 L${20 + i * 55} 300" stroke="#0b0d10" stroke-width="16"/>` +
        `<path d="M0 ${30 + i * 32} H400" stroke="#1d2229" stroke-width="3"/>`).join("")
    : `<g transform="translate(200 150)">
        <circle r="138" fill="#14181d"/>
        <circle r="138" fill="none" stroke="#222831" stroke-width="10" stroke-dasharray="14 7"/>
        <circle r="104" fill="#191e24" stroke="#2a313a" stroke-width="2"/>
        <circle r="78" fill="#20262d" stroke="#323a45" stroke-width="3"/>
        <circle r="40" fill="#0f1215" stroke="#3a434f" stroke-width="3"/>
        <circle r="12" fill="#3a434f"/>
        <text y="-88" text-anchor="middle" font-size="9" fill="#4b5563" font-family="sans-serif" letter-spacing="3">TUBELESS - RADIAL</text>
      </g>`;
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#2a3038"/><stop offset="1" stop-color="#0c0e11"/></radialGradient></defs>
        <rect width="400" height="300" fill="url(#g)"/>${body}</svg>`,
    )
  );
}

export function demoImageSet(): TyreImages {
  const out: TyreImages = {};
  for (const a of ANGLES) out[a.key] = tyreSvg(a.key);
  return out;
}
