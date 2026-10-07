import OpenAI from "openai";
import { NextResponse } from "next/server";
import { debugLog, imageDimensions } from "@/lib/ai/imageInfo";
import { getRetreadCriteria } from "@/lib/ai/retreadCriteria";
import {
  FINAL_CLAUSE, INTERNAL_DEFECT_NOTICE, TYRE_INSPECTION_PROMPT,
} from "@/lib/ai/tyreInspectionPrompt";
import { TYRE_INSPECTION_SCHEMA } from "@/lib/ai/tyreInspectionSchema";
import { validateModelOutput } from "@/lib/ai/validateOutput";
import type { InspectTyreResponse, RetreadDecision, TyreInspectionResult } from "@/types/tyreInspection";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 5;
const TIMEOUT_MS = 45_000;
const MIN_REJECT_CONFIDENCE = 0.7;

const fail = (status: number, error: string) =>
  NextResponse.json<InspectTyreResponse>({ success: false, error }, { status });

/** Detect the real image type from magic bytes (don't trust the client's MIME type). */
function sniff(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  return null;
}

const FORBIDDEN = /approved for retreading|(?:tyre|tire) is (?:completely |totally )?safe|suitable for retreading|no internal damage|all defects (?:have been|were) detected|100% accurate|definitely unsafe|unsafe tyre|bad tyre|defective tyre/i;

/** If the model uses a forbidden claim, discard its sentence and use a fixed safe one. */
function sanitize(s: string, safe: string): string {
  return FORBIDDEN.test(s) ? safe : s;
}

const INTERNAL_CLAIM = /\b(internal|belt|casing|ply)\b/i;
const DAMAGE_WORD = /(damage|separation|failure|broken|fractur)/i;
const HEDGED = /(possible|possibly|may|might|could|cannot|can't|not (?:confirmed|assessed|assessable|visible|determin)|unable|unclear)/i;
/** Hidden/internal damage stated as fact is not allowed as a rejection basis from an RGB photo. */
const claimsInternalDamage = (t: string) => INTERNAL_CLAIM.test(t) && DAMAGE_WORD.test(t) && !HEDGED.test(t);

function unvalidated(): TyreInspectionResult {
  return {
    decision: "MANUAL_REVIEW",
    tyre_detected: true,
    image_quality: { usable: false, score: 0, issues: ["AI output could not be validated reliably."] },
    retread_rejection_reasons: [],
    observations_not_automatic_rejection: [],
    areas_not_assessed: ["Internal casing condition cannot be assessed from RGB image"],
    decision_reason: `AI output could not be validated reliably. Manual inspection required. ${FINAL_CLAUSE}`,
    required_follow_up: ["Manual physical inspection"],
    limitations: [INTERNAL_DEFECT_NOTICE],
  };
}

/**
 * Conservative post-processing. The prompt is the first line of defence; this enforces the same
 * rules in code so a model slip can never produce an unsupported reject or an unsafe pass.
 */
function normalize(r: TyreInspectionResult): TyreInspectionResult {
  // Rejection reasons must rest on concrete visible evidence, not on hidden-damage claims.
  const reasons = r.retread_rejection_reasons.filter(
    (d) => d.visual_evidence.trim() && !claimsInternalDamage(`${d.visual_evidence} ${d.why_it_meets_rejection_criterion}`),
  );

  const areas = [...r.areas_not_assessed];
  if (!areas.some((a) => /internal/i.test(a))) areas.push("Internal casing condition cannot be assessed from RGB image");
  const limitations = [...r.limitations];
  if (!limitations.some((l) => /internal/i.test(l))) limitations.push(INTERNAL_DEFECT_NOTICE);

  const goodImage = r.tyre_detected && r.image_quality.usable;
  const solid = reasons.some((d) => d.confidence >= MIN_REJECT_CONFIDENCE);
  let decision: RetreadDecision = r.decision;

  if (decision === "RETREAD_REJECT" && (!goodImage || !solid)) decision = "MANUAL_REVIEW";
  if (decision === "NO_VISIBLE_RETREAD_REJECTION") {
    // A pass cannot stand with an unusable image, a pending rejection candidate, or unresolved follow-up.
    if (!goodImage || reasons.length || r.required_follow_up.length) decision = "MANUAL_REVIEW";
  }

  const safeReason =
    decision === "NO_VISIBLE_RETREAD_REJECTION"
      ? "No configured retreading rejection condition was visibly identified from the supplied image."
      : decision === "RETREAD_REJECT"
        ? "A configured retread rejection condition is clearly visible in the supplied image."
        : "Possible rejection condition or insufficient evidence; manual inspection required.";
  // If the server changed the model's decision, the model's own explanation no longer fits.
  let reason = decision !== r.decision
    ? `${safeReason} The evidence did not meet the image-quality, confidence or follow-up requirements for the model's original decision.`
    : sanitize(r.decision_reason, safeReason).trim() || safeReason;
  if (decision === "RETREAD_REJECT" && !/pre-screening/i.test(reason)) {
    reason = `Rejected during AI pre-screening against configured retread rejection criteria. ${reason}`;
  }
  if (!reason.includes("approved physical inspection process")) reason = `${reason} ${FINAL_CLAUSE}`;

  return {
    ...r,
    decision,
    image_quality: { ...r.image_quality, issues: r.image_quality.issues.map((i) => sanitize(i, "Image issue noted.")) },
    retread_rejection_reasons: reasons,
    observations_not_automatic_rejection: r.observations_not_automatic_rejection.map((o) => ({
      ...o, visual_evidence: sanitize(o.visual_evidence, "Visible feature described by the model; confirm by physical inspection."),
    })),
    areas_not_assessed: areas,
    decision_reason: reason,
    limitations,
  };
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fail(503, "AI inspection is not configured on the server.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, "Send the photo as multipart/form-data in the 'image' field.");
  }

  const files = form.getAll("image").filter((v): v is File => typeof v !== "string");
  if (!files.length) return fail(400, "No image was provided.");
  if (files.length > MAX_IMAGES) return fail(400, `Please send at most ${MAX_IMAGES} images.`);

  const imageParts: { type: "input_image"; image_url: string; detail: "high" }[] = [];
  const views: string[] = [];
  for (const f of files) {
    if (f.size === 0) return fail(400, "The uploaded image is empty.");
    if (f.size > MAX_BYTES) return fail(413, "Image is too large. Maximum size is 8 MB.");
    const bytes = new Uint8Array(await f.arrayBuffer());
    const mime = sniff(bytes);
    if (!mime) return fail(415, "Unsupported image. Use a JPEG, PNG or WEBP photo.");
    const dims = imageDimensions(bytes);
    debugLog([
      `Image received: ${f.name || "(unnamed)"}`, `Type: ${mime}`, `Size: ${Math.round(f.size / 1024)} KB`,
      `Decoded: ${dims ? "yes" : "NO"}`, `Dimensions: ${dims ? `${dims.width}x${dims.height}` : "unknown"}`,
    ]);
    if (!dims) return fail(415, "The file could not be read as a valid image.");
    imageParts.push({
      type: "input_image",
      image_url: `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`,
      detail: "high",
    });
    views.push((f.name || "photo").replace(/\.[a-z0-9]+$/i, "").replace(/[^\w -]/g, "").slice(0, 30));
  }

  const ctx = ["tyreId", "brand", "size", "inspectionContext"]
    .map((k) => [k, String(form.get(k) ?? "").slice(0, 200)] as const)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const criteria = getRetreadCriteria();
  const intro =
    imageParts.length > 1
      ? `The application confirms that all ${imageParts.length} images below show the SAME tyre. Views, in order: ${views.map((v, i) => `${i + 1}) ${v}`).join(", ")}.`
      : "One image of a tyre is provided.";
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4.1";
  const client = new OpenAI({ apiKey, timeout: TIMEOUT_MS, maxRetries: 1 });
  const t0 = Date.now();
  debugLog([`Vision model: ${model}`, `Criteria: ${criteria.map((c) => c.code).join(", ")}`, "Vision inference: STARTED"]);

  try {
    const response = await client.responses.create({
      model,
      instructions: TYRE_INSPECTION_PROMPT,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `${intro}\n\nRETREAD_REJECTION_CRITERIA (the only authority for RETREAD_REJECT; use these exact codes):\n${JSON.stringify(criteria, null, 2)}` +
                (ctx ? `\n\nOperator-supplied context (unverified; not visual evidence):\n${ctx}` : ""),
            },
            ...imageParts,
          ],
        },
      ],
      text: {
        format: { type: "json_schema", name: "tyre_retread_prescreen", strict: true, schema: TYRE_INSPECTION_SCHEMA as unknown as Record<string, unknown> },
      },
      store: false,
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      console.warn("[inspect-tyre] malformed model output", { model, ms: Date.now() - t0 });
      return fail(502, "The AI returned an unreadable result. Please try again.");
    }

    const checked = validateModelOutput(parsed, ctx, criteria);
    if (!checked.ok) {
      console.warn("[inspect-tyre] model output failed validation", { model, ms: Date.now() - t0, reason: checked.reason });
      return NextResponse.json<InspectTyreResponse>({
        success: true, inspection: unvalidated(), model, validated: false,
        disclaimer: `${INTERNAL_DEFECT_NOTICE} ${FINAL_CLAUSE}`,
      });
    }

    const inspection = normalize(checked.value);
    debugLog([
      "Vision inference: COMPLETED", `Decision: ${inspection.decision}`,
      `Rejection reasons: ${inspection.retread_rejection_reasons.length}  Observations: ${inspection.observations_not_automatic_rejection.length}`,
    ]);
    console.info("[inspect-tyre] ok", {
      model, images: imageParts.length, ms: Date.now() - t0, decision: inspection.decision,
      modelDecision: checked.value.decision, reasons: inspection.retread_rejection_reasons.length,
      observations: inspection.observations_not_automatic_rejection.length, tyre: inspection.tyre_detected,
    });

    if (!inspection.tyre_detected) {
      return fail(422, "No tyre was detected in the photo. Please retake it with the tyre clearly in frame.");
    }
    return NextResponse.json<InspectTyreResponse>({
      success: true, inspection, model, validated: true,
      disclaimer: `${INTERNAL_DEFECT_NOTICE} This is AI pre-screening against configured retread rejection criteria, not a certified retreadability decision. ${FINAL_CLAUSE}`,
    });
  } catch (e) {
    const status = e instanceof OpenAI.APIError ? e.status : undefined;
    const timedOut = e instanceof OpenAI.APIConnectionTimeoutError;
    console.error("[inspect-tyre] upstream failure", { model, ms: Date.now() - t0, status, timedOut });
    if (timedOut) return fail(504, "The AI took too long to respond. Please try again.");
    if (status === 429) return fail(503, "The AI service is busy. Please try again shortly.");
    return fail(502, "The AI inspection service is unavailable. Please try again.");
  }
}
