"use client";

import { Plus } from "lucide-react";
import { useApp } from "@/components/app-context";
import { DemoBadge } from "@/components/DemoBadge";
import { TyreCard } from "@/components/TyreCard";
import { Button } from "@/components/ui/button";

// Starting counts for the demo day; inspections saved in this browser are added on top.
const BASE = { ACCEPT: 16, REVIEW: 4, REJECT: 4 };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function DashboardScreen() {
  const { history, go, startNew, setCurrent, settings } = useApp();
  const mine = history.filter((r) => r.user);
  const count = (s: keyof typeof BASE) => BASE[s] + mine.filter((r) => r.result.overallStatus === s).length;
  const rows = [
    { key: "ACCEPT" as const, label: "No rejection seen", n: count("ACCEPT"), bar: "bg-ok" },
    { key: "REVIEW" as const, label: "Manual review", n: count("REVIEW"), bar: "bg-warn" },
    { key: "REJECT" as const, label: "Rejected", n: count("REJECT"), bar: "bg-bad" },
  ];
  const total = rows.reduce((a, r) => a + r.n, 0);

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{greeting()}</p>
          <h1 className="font-display text-3xl font-semibold leading-tight">Tyre Inspector</h1>
        </div>
        {settings.demoMode && <DemoBadge />}
      </div>

      <Button className="mt-5" onClick={() => { startNew(); go("new"); }}>
        <Plus size={18} /> New inspection
      </Button>

      <section className="mt-8" aria-labelledby="today">
        <h2 id="today" className="text-base font-semibold">
          Today <span className="tabular font-normal text-muted">· {total} inspected</span>
        </h2>
        <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full" role="img"
          aria-label={rows.map((r) => `${r.label} ${r.n}`).join(", ")}>
          {rows.map((r) => <span key={r.key} className={r.bar} style={{ width: `${(r.n / total) * 100}%` }} />)}
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
          <button onClick={() => go("history")} className="-mr-2 min-h-11 px-2 text-sm font-medium underline underline-offset-4">
            View all
          </button>
        </div>
        <ul className="border-t border-line">
          {history.slice(0, 3).map((r) => (
            <TyreCard key={r.id} record={r} onClick={() => { setCurrent(r); go("detail"); }} />
          ))}
        </ul>
      </section>
    </div>
  );
}
