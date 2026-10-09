"use client";

import { Plus, ScanLine } from "lucide-react";
import { useApp } from "@/components/app-context";
import { TyreCard } from "@/components/TyreCard";
import { Button } from "@/components/ui/button";
import { STATUS_HEADLINE } from "@/lib/decision";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const isToday = (t: number) => new Date(t).toDateString() === new Date().toDateString();

export function DashboardScreen() {
  const { history, go, startNew, setCurrent } = useApp();
  // Only inspections actually run and saved in this browser.
  const today = history.filter((r) => isToday(r.createdAt));
  const count = (s: "ACCEPT" | "REVIEW" | "REJECT") => today.filter((r) => r.result.overallStatus === s).length;
  const rows = [
    { key: "ACCEPT" as const, label: STATUS_HEADLINE.ACCEPT, n: count("ACCEPT"), bar: "bg-ok" },
    { key: "REVIEW" as const, label: STATUS_HEADLINE.REVIEW, n: count("REVIEW"), bar: "bg-warn" },
    { key: "REJECT" as const, label: STATUS_HEADLINE.REJECT, n: count("REJECT"), bar: "bg-bad" },
  ];
  const total = today.length;

  return (
    <div className="px-5 pb-6 pt-6">
      <div>
        <p className="text-sm text-muted">{greeting()}</p>
        <h1 className="font-display text-3xl font-semibold leading-tight">Tyre Inspector</h1>
      </div>

      <Button className="mt-5" onClick={() => { startNew(); go("new"); }}>
        <Plus size={18} /> New inspection
      </Button>

      <section className="mt-8" aria-labelledby="today">
        <h2 id="today" className="text-base font-semibold">
          Today <span className="tabular font-normal text-muted">· {total} inspected</span>
        </h2>
        <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-ink/10" role="img"
          aria-label={rows.map((r) => `${r.label} ${r.n}`).join(", ")}>
          {total > 0 && rows.map((r) => <span key={r.key} className={r.bar} style={{ width: `${(r.n / total) * 100}%` }} />)}
        </div>
        <ul className="mt-3 border-y border-line">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
              <span className={`size-2.5 rounded-full ${r.bar}`} aria-hidden="true" />
              <span className="flex-1 text-base">{r.label}</span>
              <span className="tabular text-base font-semibold">{r.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="recent">
        <div className="flex items-center justify-between">
          <h2 id="recent" className="text-base font-semibold">Recent inspections</h2>
          {history.length > 0 && (
            <button onClick={() => go("history")} className="-mr-2 min-h-11 px-2 text-sm font-medium underline underline-offset-4">
              View all
            </button>
          )}
        </div>
        {history.length ? (
          <ul className="border-t border-line">
            {history.slice(0, 3).map((r) => (
              <TyreCard key={r.id + r.createdAt} record={r} onClick={() => { setCurrent(r); go("detail"); }} />
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-line px-4 py-8 text-center">
            <ScanLine size={22} className="mx-auto text-muted" aria-hidden="true" />
            <p className="mt-2 text-base font-medium">No inspections yet</p>
            <p className="text-sm text-muted">Saved inspections appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
