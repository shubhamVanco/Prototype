import type { InspectionRecord } from "@/types";
import { DISCLAIMER, NOT_A_TYRE_ROUTING, ROUTING, STATUS_HEADLINE } from "./decision";
import { fullDate } from "./format";

const COLORS = { ACCEPT: "#15803d", REVIEW: "#b45309", REJECT: "#b91c1c" } as const;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const list = (items: string[], empty: string) =>
  items.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="muted">${empty}</p>`;

export function reportHtml(r: InspectionRecord): string {
  const res = r.result;
  const mode = res.mode === "UNAVAILABLE" ? "UNAVAILABLE" : "REAL_AI";
  const c = COLORS[res.overallStatus];
  const unavailable = mode === "UNAVAILABLE";
  const route = res.notATyre ? NOT_A_TYRE_ROUTING : ROUTING[unavailable ? "REVIEW" : res.overallStatus];
  const headline = unavailable ? "MANUAL INSPECTION REQUIRED" : res.notATyre ? "NOT A TYRE" : STATUS_HEADLINE[res.overallStatus].toUpperCase();
  const reasons = res.rejectionReasons ?? [];
  const q = res.imageQuality;
  const imgs = Object.values(r.images).filter(Boolean).map((src) => `<img src="${src}"/>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${r.id} - AI pre-screening report</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;margin:32px;max-width:780px}
h1{font-size:22px;margin:0}.sub{font-size:13px;letter-spacing:.12em;color:#555;margin:2px 0 14px}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:22px 0 6px}
.mode{display:inline-block;padding:4px 10px;border:1.5px solid #111;border-radius:6px;font-size:12px;font-weight:700;${unavailable ? "background:#fee2e2;" : "background:#ecfeff;"}}
.status{display:inline-block;padding:6px 14px;border-radius:999px;color:#fff;background:${c};font-weight:700}
table{width:100%;border-collapse:collapse;font-size:12.5px}td,th{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
ul{margin:4px 0 0 18px;padding:0;font-size:13px}.muted{color:#666;font-size:13px;margin:4px 0}
img{width:130px;height:100px;object-fit:cover;border-radius:6px;margin:0 8px 8px 0}
.note{margin-top:26px;padding:12px;background:#f4f4f5;border-radius:8px;font-size:12px;color:#444}
</style></head><body>
<h1>TYREVISION AI</h1><div class="sub">AI PRE-SCREENING REPORT</div>
<div><b>Inspection ID:</b> ${esc(r.id)} &nbsp;·&nbsp; ${fullDate(r.createdAt)}</div>
<div style="margin-top:6px"><b>Tyre (operator-entered):</b> ${esc(r.tyre.brand || "NOT_PROVIDED")} / ${esc(r.tyre.type)}</div>
${unavailable ? `<h2>Analysis</h2><span class="mode">AI INSPECTION UNAVAILABLE</span>` : ""}
<h2>Overall status</h2><span class="status">${esc(headline)}</span>
<p class="muted">${esc(res.summary)}</p>
<h2>Send to retreading plant?</h2><p><b>${route.verdict} - ${esc(route.title)}</b><br><span class="muted">${esc(route.note)}</span></p>
<h2>Image quality</h2>${q ? `<p class="muted">Usable: ${q.usable ? "yes" : "no"} · Score: ${Math.round(q.score * 100)}%</p>${q.issues.length ? list(q.issues, "") : ""}` : `<p class="muted">Not assessed</p>`}
<h2>${res.overallStatus === "REJECT" ? "Rejection reasons" : "Possible rejection conditions (not confirmed)"}</h2>${
  reasons.length
    ? `<table><tr><th>Criterion</th><th>Conf.</th><th>Location</th><th>Visual evidence</th><th>Why</th></tr>${reasons
        .map((d) => `<tr><td>${esc(d.code)} ${esc(d.name)}</td><td>${d.confidence}%</td><td>${esc(d.location)}</td><td>${esc(d.evidence)}</td><td>${esc(d.why)}</td></tr>`).join("")}</table>`
    : `<p class="muted">No rejection condition visible.</p>`}
${res.notATyre ? "" : `<h2>Observations (not automatic rejection)</h2>${
  res.observations?.length
    ? `<table><tr><th>Observation</th><th>Location</th><th>Visual evidence</th><th>Why not an automatic rejection</th></tr>${res.observations
        .map((o) => `<tr><td>${esc(o.name)}</td><td>${esc(o.location)}</td><td>${esc(o.evidence)}</td><td>${esc(o.reason)}</td></tr>`).join("")}</table>`
    : `<p class="muted">None.</p>`}
<h2>Areas not assessed</h2>${list(res.areasNotAssessable ?? ["Internal casing condition"], "None listed.")}`}
<h2>Recommendation</h2><p>${esc(res.recommendation)}</p>
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
