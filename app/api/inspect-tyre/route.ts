import OpenAI from "openai";
import { NextResponse } from "next/server";
import { debugLog, imageDimensions } from "@/lib/ai/imageInfo";
import { getRetreadCriteria } from "@/lib/ai/retreadCriteria";
import { brief, briefList } from "@/lib/ai/brief";
import { INTERNAL_DEFECT_NOTICE, TYRE_INSPECTION_PROMPT } from "@/lib/ai/tyreInspectionPrompt";
import { TYRE_INSPECTION_SCHEMA } from "@/lib/ai/tyreInspectionSchema";
import { NOT_A_TYRE_CODE, TYRE_GATE_PROMPT, TYRE_GATE_SCHEMA, gateFailures } from "@/lib/ai/tyreGate";
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

type NotTyre = { view: string; subject: string; confidence: number };
/** Hard rule: a photo without a tyre is REJECTED (never sent to manual review), with a short reason. */
const notATyre = (error: string, notTyre: NotTyre[] = []) =>
  NextResponse.json<InspectTyreResponse>({ success: false, code: NOT_A_TYRE_CODE, error, notTyre }, { status: 422 });

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
    image_quality: { usable: false, score: 0, issues: ["AI output could not be validated."] },
    retread_rejection_reasons: [],
    observations_not_automatic_rejection: [],
    areas_not_assessed: ["Internal casing condition"],
    decision_reason: "AI output could not be validated. Manual inspection required.",
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

  const areas = briefList(r.areas_not_assessed, 4);
  if (!areas.some((a) => /internal/i.test(a))) areas.push("Internal casing condition");
  const limitations = briefList(r.limitations, 2);

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
      ? "No rejection condition visible in the photos."
      : decision === "RETREAD_REJECT"
        ? "A retread rejection condition is clearly visible."
        : "Evidence is unclear. A person must inspect this tyre.";
  // If the server changed the model's decision, the model's own explanation no longer fits.
  const reason = decision !== r.decision ? safeReason : brief(sanitize(r.decision_reason, safeReason)) || safeReason;

  // Every text the user sees is kept to 2-3 lines.
  return {
    ...r,
    decision,
    image_quality: { ...r.image_quality, issues: briefList(r.image_quality.issues.map((i) => sanitize(i, "Image issue noted."))) },
    retread_rejection_reasons: reasons.slice(0, 3).map((d) => ({
      ...d,
      criterion_name: brief(d.criterion_name, 60),
      location: brief(d.location, 60),
      visual_evidence: brief(d.visual_evidence),
      why_it_meets_rejection_criterion: brief(d.why_it_meets_rejection_criterion),
    })),
    observations_not_automatic_rejection: r.observations_not_automatic_rejection.slice(0, 3).map((o) => ({
      ...o,
      name: brief(o.name, 60),
      location: brief(o.location, 60),
      visual_evidence: brief(sanitize(o.visual_evidence, "Visible feature; confirm by physical inspection.")),
      reason_not_rejection: brief(o.reason_not_rejection),
    })),
    areas_not_assessed: areas,
    decision_reason: reason,
    required_follow_up: briefList(r.required_follow_up, 2),
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
      ? `${imageParts.length} images are supplied as views of the same tyre. Views, in order: ${views.map((v, i) => `${i + 1}) ${v}`).join(", ")}.`
      : "One image is supplied.";
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4.1";
  const client = new OpenAI({ apiKey, timeout: TIMEOUT_MS, maxRetries: 1 });
  const t0 = Date.now();

  // HARD RULE: only tyres are inspected. Every photo must pass the tyre gate before any result exists.
  try {
    const gate = await client.responses.create({
      model,
      instructions: TYRE_GATE_PROMPT,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: `${imageParts.length} image(s) follow, in order.` },
          ...imageParts.map((p) => ({ ...p, detail: "low" as const })),
        ],
      }],
      text: { format: { type: "json_schema", name: "tyre_gate", strict: true, schema: TYRE_GATE_SCHEMA as unknown as Record<string, unknown> } },
      store: false,
    });
    let verdict: unknown = null;
    try { verdict = JSON.parse(gate.output_text); } catch { /* malformed => every photo fails below */ }
    const failed = gateFailures(verdict, imageParts.length);
    console.info("[inspect-tyre] tyre gate", { model, images: imageParts.length, failed: failed.length, ms: Date.now() - t0 });
    if (failed.length) {
      const notTyre = failed.map((f) => ({ view: views[f.index - 1] || `Photo ${f.index}`, subject: f.subject, confidence: f.confidence }));
      const which = imageParts.length === 1
        ? `No tyre found. The photo shows ${notTyre[0].subject}.`
        : `No tyre found in ${notTyre.map((n) => `${n.view} (${n.subject})`).join(", ")}.`;
      return notATyre(brief(which, 160), notTyre);
    }
  } catch (e) {
    const status = e instanceof OpenAI.APIError ? e.status : undefined;
    const timedOut = e instanceof OpenAI.APIConnectionTimeoutError;
    console.error("[inspect-tyre] tyre gate failure", { model, ms: Date.now() - t0, status, timedOut });
    if (timedOut) return fail(504, "The AI took too long to respond. Please try again.");
    if (status === 429) return fail(503, "The AI service is busy. Please try again shortly.");
    return fail(502, "The AI inspection service is unavailable. Please try again.");
  }
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
        disclaimer: INTERNAL_DEFECT_NOTICE,
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
      return notATyre("No tyre found in the photo.");
    }
    return NextResponse.json<InspectTyreResponse>({
      success: true, inspection, model, validated: true,
      disclaimer: INTERNAL_DEFECT_NOTICE,
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
