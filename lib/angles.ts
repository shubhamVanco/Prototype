import type { ImageAngle } from "@/types";

export const ANGLES: { key: ImageAngle; label: string; hint: string }[] = [
  { key: "full", label: "Full Tyre", hint: "Whole tyre in frame" },
  { key: "left", label: "Left Sidewall", hint: "Square-on to the sidewall" },
  { key: "right", label: "Right Sidewall", hint: "Square-on to the sidewall" },
  { key: "tread", label: "Tread", hint: "Close view of tread surface" },
  { key: "bead", label: "Bead", hint: "Inner edge near the rim" },
];
