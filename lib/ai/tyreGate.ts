/**
 * Hard tyre gate. Runs BEFORE the retread inspection: every photo must clearly show a real tyre,
 * otherwise the photos are rejected as "not a tyre". Fails closed: anything unclear is "not a tyre".
 */

export const MIN_TYRE_CONFIDENCE = 0.8;

export const NOT_A_TYRE_CODE = "NOT_A_TYRE";

export const TYRE_GATE_PROMPT = `You are a strict image gate for a tyre retreading inspection app.

For EACH supplied image, decide only one thing: is the main subject a real, physical
vehicle tyre (pneumatic rubber tyre, with or without its wheel/rim) that is clearly
visible and large enough in the frame to be inspected?

Answer is_tyre = true ONLY when ALL of these hold:
- It is a photograph of a real tyre (truck, bus, car, commercial, two-wheeler, etc.).
- The tyre (or a close-up part of it: tread, sidewall, bead, shoulder) is the main subject.
- Enough of the tyre surface is visible to inspect it.

Answer is_tyre = false for everything else, including:
- people, animals, food, documents, text, screenshots, rooms, landscapes, objects
- a whole vehicle where the tyre is small or not the subject
- drawings, cartoons, icons, logos, renders, toys, or a photo of a screen
- rubber objects that are not tyres, hoses, belts, wheels without a tyre
- images that are too dark, blurry or cropped to tell

Do not guess. If you are not sure it is a tyre, answer false.
"subject" is a short plain description (max 6 words, starting with "a" or "an") of what
the image actually shows, e.g. "a tabby cat", "a parked bicycle", "a truck tyre tread".
"confidence" (0-1) is your confidence in your is_tyre answer.
Return one entry per image, in the order given, using 1-based "index".`;

export const TYRE_GATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["images"],
  properties: {
    images: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "is_tyre", "subject", "confidence"],
        properties: {
          index: { type: "integer" },
          is_tyre: { type: "boolean" },
          subject: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
  },
} as const;

export interface GateVerdict { index: number; is_tyre: boolean; subject: string; confidence: number }

/**
 * Returns the 1-based indexes of photos that did NOT pass, with what the model saw.
 * Malformed or missing verdicts count as failures (fail closed).
 */
export function gateFailures(raw: unknown, count: number): { index: number; subject: string; confidence: number }[] {
  const list = (raw as { images?: unknown })?.images;
  const verdicts = Array.isArray(list) ? (list as GateVerdict[]) : [];
  const out: { index: number; subject: string; confidence: number }[] = [];
  for (let i = 1; i <= count; i++) {
    const v = verdicts.find((x) => x && x.index === i) ?? verdicts[i - 1];
    const ok = !!v && v.is_tyre === true && typeof v.confidence === "number" && v.confidence >= MIN_TYRE_CONFIDENCE;
    if (!ok) {
      const subject = v && typeof v.subject === "string" && v.subject.trim() ? v.subject.trim().slice(0, 60) : "an unclear image";
      const conf = typeof v?.confidence === "number" && v.confidence >= 0 && v.confidence <= 1 ? v.confidence : 0;
      // Confidence that this photo is NOT a usable tyre photo.
      out.push({ index: i, subject: v?.is_tyre ? `${subject}, too unclear to inspect` : subject, confidence: v?.is_tyre ? 1 - conf : conf });
    }
  }
  return out;
}
