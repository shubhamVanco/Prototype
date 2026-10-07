import { ANGLES } from "@/lib/demoImages";
import type { ImageAngle, OverallStatus, TyreInspectionResult } from "@/types";
import type { InspectTyreResponse, RetreadDecision } from "@/types/tyreInspection";
import type { InspectionInput } from "./tyreInspection";

const STATUS: Record<RetreadDecision, OverallStatus> = {
  NO_VISIBLE_RETREAD_REJECTION: "ACCEPT",
  MANUAL_REVIEW: "REVIEW",
  RETREAD_REJECT: "REJECT",
};

const ACTION_TEXT: Record<RetreadDecision, string> = {
  NO_VISIBLE_RETREAD_REJECTION:
    "No configured retreading rejection condition was visibly identified from the supplied image. Proceed to the next approved inspection stage.",
  MANUAL_REVIEW: "Manual inspection required.",
  RETREAD_REJECT:
    "Do not proceed directly through normal intake. Escalate according to the organization's approved tyre inspection procedure.",
};

function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null; // e.g. SVG placeholders can't be inspected
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

/** Vision engine: POSTs the photos to /api/inspect-tyre (OpenAI runs server-side). */
export async function runLlmInspection(input: InspectionInput): Promise<TyreInspectionResult> {
  const form = new FormData();
  const angles: ImageAngle[] = [];
  for (const a of ANGLES) {
    const url = input.images[a.key];
    const blob = url ? dataUrlToBlob(url) : null;
    if (blob) {
      form.append("image", blob, `${a.label}.${blob.type.split("/")[1]}`);
      angles.push(a.key);
    }
  }
  if (!angles.length) throw new Error("no-supported-image");
  form.append("tyreId", input.tyre.tyreId);
  form.append("brand", input.tyre.brand);
  form.append("inspectionContext", `Tyre type declared by operator: ${input.tyre.type}`);

  const { ok, json } = await postForm("/api/inspect-tyre", form, input.onUploadProgress);
  if (!ok || !json || !json.success) {
    throw new Error(json && !json.success ? json.error : "http-error");
  }

  const o = json.inspection;
  const reasons = o.retread_rejection_reasons;
  // Confidence = confidence in the visual observations (not a safety probability).
  const confidence = reasons.length
    ? reasons.reduce((a, r) => a + r.confidence, 0) / reasons.length
    : o.image_quality.score;

  const base = {
    // New-style findings are rendered from rejectionReasons / observations, not from `defects`.
    defects: [],
    engine: `OpenAI Vision (${json.model})`,
    demo: false,
    imageQuality: o.image_quality,
    areasNotAssessable: o.areas_not_assessed,
    followUp: o.required_follow_up,
    limitations: [...new Set([...o.image_quality.issues, ...o.limitations])],
    rejectionReasons: reasons.map((r) => ({
      code: r.criterion_code, name: r.criterion_name, location: r.location,
      evidence: r.visual_evidence, why: r.why_it_meets_rejection_criterion, confidence: Math.round(r.confidence * 100),
    })),
    observations: o.observations_not_automatic_rejection.map((x) => ({
      name: x.name, location: x.location, evidence: x.visual_evidence, reason: x.reason_not_rejection,
    })),
  };

  if (!json.validated) {
    return {
      ...base, overallStatus: "REVIEW", confidence: 0, mode: "UNAVAILABLE",
      summary: "AI output could not be validated reliably.", recommendation: "Manual inspection required.",
    };
  }
  return {
    ...base,
    overallStatus: STATUS[o.decision],
    confidence: Math.round(confidence * 100),
    mode: "REAL_AI",
    summary: o.decision_reason.replace(/\s*Final retreadability must be determined through the organization's approved physical inspection process\.?/i, "").trim(),
    recommendation: ACTION_TEXT[o.decision],
  };
}
