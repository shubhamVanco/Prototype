import type { InspectionRecord } from "@/types";
import { DISCLAIMER, ROUTING, STATUS_HEADLINE } from "./decision";
import { fullDate } from "./format";

const COLORS = { ACCEPT: "#15803d", REVIEW: "#b45309", REJECT: "#b91c1c" } as const;
const MODE = {
  REAL_AI: "REAL AI ANALYSIS",
  DEMO: "DEMO MODE - SIMULATED RESULT",
  UNAVAILABLE: "AI INSPECTION UNAVAILABLE",
} as const;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const list = (items: string[], empty: string) =>
  items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="muted">${empty}</p>`;

export function reportHtml(r: InspectionRecord): string {
  const res = r.result;
  const mode = res.mode ?? (res.demo ? "DEMO" : "REAL_AI");
  const c = COLORS[res.overallStatus];
  const confirmed = res.defects.filter((d) => d.status !== "POSSIBLE");
  const possible = res.defects.filter((d) => d.status === "POSSIBLE");
  const rows = (ds: typeof confirmed) =>
    ds.length
      ? `<table><tr><th>Defect</th><th>Severity</th><th>Conf.</th><th>Location</th><th>Visual evidence</th></tr>${ds
          .map((d) => `<tr><td>${esc(d.type)}</td><td>${d.severity === "NOT_DETERMINABLE" ? "Not determinable" : d.severity}</td><td>${d.confidence}%</td><td>${esc(d.location)}</td><td>${esc(d.description)}</td></tr>`)
          .join("")}</table>`
      : "";
  const q = res.imageQuality;
  const imgs = Object.values(r.images).filter(Boolean).map((src) => `<img src="${src}"/>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${r.id} - AI pre-screening report</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;margin:32px;max-width:780px}
h1{font-size:22px;margin:0}.sub{font-size:13px;letter-spacing:.12em;color:#555;margin:2px 0 14px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:22px 0 6px}
.mode{display:inline-block;padding:4px 10px;border:1.5px solid #111;border-radius:6px;font-size:12px;font-weight:700;${mode === "DEMO" ? "background:#fef3c7;" : mode === "UNAVAILABLE" ? "background:#fee2e2;" : "background:#ecfeff;"}}
.status{display:inline-block;padding:6px 14px;border-radius:999px;color:#fff;background:${c};font-weight:700}
table{width:100%;border-collapse:collapse;font-size:12.5px}td,th{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
ul{margin:4px 0 0 18px;padding:0;font-size:13px}.muted{color:#666;font-size:13px;margin:4px 0}
img{width:130px;height:100px;object-fit:cover;border-radius:6px;margin:0 8px 8px 0}
.note{margin-top:26px;padding:12px;background:#f4f4f5;border-radius:8px;font-size:12px;color:#444}
</style></head><body>
<h1>TYREVISION AI</h1><div class="sub">AI PRE-SCREENING REPORT</div>
<div><b>Inspection ID:</b> ${esc(r.id)} &nbsp;·&nbsp; ${fullDate(r.createdAt)}</div>
<div style="margin-top:6px"><b>Tyre (operator-entered):</b> ${esc(r.tyre.brand || "NOT_PROVIDED")} / ${esc(r.tyre.type)}</div>
<h2>Analysis mode</h2><span class="mode">${MODE[mode]}</span>
<h2>Overall status</h2><span class="status">${esc(mode === "UNAVAILABLE" ? "MANUAL INSPECTION REQUIRED" : STATUS_HEADLINE[res.overallStatus].toUpperCase())}</span>
<p class="muted">${esc(res.summary)}</p>
<h2>Send to retreading plant?</h2><p><b>${res.mode === "UNAVAILABLE" ? "HOLD" : ROUTING[res.overallStatus].verdict} - ${esc(res.mode === "UNAVAILABLE" ? ROUTING.REVIEW.title : ROUTING[res.overallStatus].title)}</b><br><span class="muted">${esc(res.mode === "UNAVAILABLE" ? ROUTING.REVIEW.note : ROUTING[res.overallStatus].note)}</span></p>
<h2>Image quality</h2>${q ? `<p class="muted">Usable: ${q.usable ? "yes" : "no"} · Score: ${Math.round(q.score * 100)}%</p>${q.issues.length ? list(q.issues, "") : ""}` : `<p class="muted">Not assessed</p>`}
${res.rejectionReasons ? `<h2>${res.overallStatus === "REJECT" ? "Retread rejection reasons" : "Possible rejection conditions (not confirmed)"}</h2>${
  res.rejectionReasons.length
    ? `<table><tr><th>Criterion</th><th>Conf.</th><th>Location</th><th>Visual evidence</th><th>Why it meets the criterion</th></tr>${res.rejectionReasons
        .map((d) => `<tr><td>${esc(d.code)} ${esc(d.name)}</td><td>${d.confidence}%</td><td>${esc(d.location)}</td><td>${esc(d.evidence)}</td><td>${esc(d.why)}</td></tr>`).join("")}</table>`
    : `<p class="muted">No configured retread rejection condition was visibly identified.</p>`}
<h2>Observations (not automatic rejection)</h2>${
  res.observations?.length
    ? `<table><tr><th>Observation</th><th>Location</th><th>Visual evidence</th><th>Why not an automatic rejection</th></tr>${res.observations
        .map((o) => `<tr><td>${esc(o.name)}</td><td>${esc(o.location)}</td><td>${esc(o.evidence)}</td><td>${esc(o.reason)}</td></tr>`).join("")}</table>`
    : `<p class="muted">None.</p>`}`
: `<h2>Detected defects</h2>${confirmed.length ? rows(confirmed) : `<p class="muted">No defects in the supplied image.</p>`}
<h2>Possible observations</h2>${possible.length ? rows(possible) : `<p class="muted">None.</p>`}`}
<h2>Areas not assessed</h2>${list(res.areasNotAssessable ?? ["Internal casing condition cannot be assessed from RGB image"], "None listed.")}
<h2>Recommendation</h2><p>${esc(res.recommendation)}</p>
<h2>Reason</h2><p>${esc(res.reason ?? res.summary)}</p>
${res.followUp?.length ? `<h2>Required follow-up</h2>${list(res.followUp, "")}` : ""}
<h2>Limitations</h2>${list(res.limitations ?? [], "None listed.")}
${imgs ? `<h2>Submitted images</h2>${imgs}` : ""}
<div class="note">${esc(DISCLAIMER)}</div>
</body></html>`;
}

/** Print via a hidden iframe (no popup blockers). Falls back to downloading the HTML. */
export function printReport(r: InspectionRecord) {
  const html = reportHtml(r);
  try {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(frame);
    const doc = frame.contentWindow!.document;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      frame.contentWindow!.focus();
      frame.contentWindow!.print();
      setTimeout(() => frame.remove(), 2000);
    }, 300);
  } catch {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${r.id}-report.html`;
    a.click();
  }
}
