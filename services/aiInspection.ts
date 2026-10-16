import { ANGLES, VIDEOS, frameView } from "@/lib/angles";
import type { TyreInspectionResult } from "@/types";
import type { InspectTyreResponse, TyreInspectionResult as ApiResult } from "@/types/tyreInspection";
import type { InspectionInput } from "./tyreInspection";

const ACTION_TEXT = {
  PASS: "Proceed to the plant's next inspection stage.",
  DEFECT: "Do not send. Escalate per your inspection procedure.",
  RETAKE: "Retake the flagged view, then analyze again.",
} as const;

function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: m[1] });
}

/** multipart POST with real upload progress (fetch can't report it). */
function postForm(
  url: string, body: FormData, onProgress?: (f: number) => void,
): Promise<{ ok: boolean; json: InspectTyreResponse | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.upload.onload = () => onProgress?.(1);
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("network"));
    xhr.onload = () => {
      let json: InspectTyreResponse | null = null;
      try { json = JSON.parse(xhr.responseText) as InspectTyreResponse; } catch { /* not JSON */ }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, json });
    };
    xhr.send(body);
  });
}

/** Hard rule: photos without a tyre are REJECTED with a short reason. */
function notATyreResult(error: string, views: { view: string; subject: string; confidence: number }[]): TyreInspectionResult {
  const confidence = views.length ? views.reduce((a, v) => a + v.confidence, 0) / views.length : 1;
  return {
    overallStatus: "REJECT",
    confidence: Math.round(confidence * 100),
    summary: error || "No tyre found in the photo.",
    recommendation: "Upload a clear photo of a tyre.",
    engine: "OpenAI Vision",
    mode: "REAL_AI",
    notATyre: true,
    rejectionReasons: (views.length ? views : [{ view: "Photo", subject: "no tyre", confidence }]).map((v) => ({
      code: "NOT_A_TYRE",
      name: "Not a tyre",
      location: v.view,
      evidence: `The photo shows ${v.subject}.`,
      why: "Only tyre photos can be inspected.",
      confidence: Math.round(v.confidence * 100),
    })),
    observations: [],
  };
}

/** Every view goes up as an "image" part named after its view, which is how the AI refers to it. */
function buildForm(input: InspectionInput): FormData {
  const form = new FormData();
  let views = 0;
  const add = (dataUrl: string | undefined, view: string) => {
    const blob = dataUrl ? dataUrlToBlob(dataUrl) : null;
    if (!blob) return;
    form.append("image", blob, `${view}.${blob.type.split("/")[1]}`);
    views++;
  };
  for (const a of ANGLES) add(input.images[a.key], a.label);
  for (const v of VIDEOS) (input.videos?.[v.key] ?? []).forEach((f, i) => add(f, frameView(v.label, i + 1)));
  if (!views) throw new Error("no-supported-image");
  form.append("tyreId", input.tyre.tyreId);
  form.append("brand", input.tyre.brand);
  form.append("inspectionContext", `Tyre type declared by operator: ${input.tyre.type}`);
  return form;
}

function toResult(o: ApiResult, model: string): TyreInspectionResult {
  const reasons = o.retread_rejection_reasons;
  const t = o.retake;
  const retake = o.reject_type === "RETAKE" && t.reason !== "NONE"
    ? { reason: t.reason, views: t.views, instruction: t.instruction }
    : undefined;
  // Confidence = confidence in the verdict's visual evidence (not a safety probability).
  // DEFECT: the strongest rejection reason. PASS / RETAKE: photo quality.
  const top = reasons.reduce((m, r) => Math.max(m, r.confidence), 0);
  const confidence = o.reject_type === "DEFECT" ? top : o.image_quality.score;
  return {
    engine: `OpenAI Vision (${model})`,
    overallStatus: o.decision === "PASS" ? "ACCEPT" : "REJECT",
    confidence: Math.round(confidence * 100),
    mode: "REAL_AI",
    summary: o.decision_reason,
    recommendation: o.decision === "PASS" ? ACTION_TEXT.PASS : retake ? ACTION_TEXT.RETAKE : ACTION_TEXT.DEFECT,
    retake,
    imageQuality: o.image_quality,
    areasNotAssessable: o.areas_not_assessed,
    limitations: [...new Set([...o.image_quality.issues, ...o.limitations])],
    rejectionReasons: reasons.map((r) => ({
      code: r.criterion_code, name: r.criterion_name, location: r.location,
      evidence: r.visual_evidence, why: r.why_it_meets_rejection_criterion, confidence: Math.round(r.confidence * 100),
    })),
    observations: o.observations_not_automatic_rejection.map((x) => ({
      name: x.name, location: x.location, evidence: x.visual_evidence, reason: x.reason_not_rejection,
    })),
  };
}

/** Vision engine: POSTs the photos and 360° video frames to /api/inspect-tyre (OpenAI runs server-side). */
export async function runAiInspection(input: InspectionInput): Promise<TyreInspectionResult> {
  const { ok, json } = await postForm("/api/inspect-tyre", buildForm(input), input.onUploadProgress);
  if (json && !json.success && json.code === "NOT_A_TYRE") return notATyreResult(json.error, json.notTyre ?? []);
  if (!ok || !json || !json.success) {
    throw new Error(json && !json.success ? json.error : "http-error");
  }
  if (!json.validated) {
    // No verdict could be trusted: this is "no result yet", never a PASS or REJECT.
    return {
      ...toResult(json.inspection, json.model), overallStatus: "REVIEW", confidence: 0, mode: "UNAVAILABLE", retake: undefined,
      summary: "AI output could not be validated.", recommendation: "Analyze again.",
    };
  }
  return toResult(json.inspection, json.model);
}
