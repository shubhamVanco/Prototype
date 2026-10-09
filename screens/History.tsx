"use client";

import { useMemo, useState } from "react";
import { SearchX, Search } from "lucide-react";
import { useApp } from "@/components/app-context";
import { TyreCard } from "@/components/TyreCard";
import { cn } from "@/lib/cn";
import { STATUS_LABEL } from "@/lib/decision";
import type { OverallStatus } from "@/types";

const FILTERS: { key: "ALL" | OverallStatus; label: string }[] = [
  { key: "ALL", label: "All" }, { key: "ACCEPT", label: STATUS_LABEL.ACCEPT },
  { key: "REVIEW", label: STATUS_LABEL.REVIEW }, { key: "REJECT", label: STATUS_LABEL.REJECT },
];

export function HistoryScreen() {
  const { history, go, setCurrent } = useApp();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | OverallStatus>("ALL");

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return history.filter(
      (r) =>
        (filter === "ALL" || r.result.overallStatus === filter) &&
        (!n || `${r.id} ${r.tyre.brand} ${r.tyre.type}`.toLowerCase().includes(n)),
    );
  }, [history, q, filter]);

  return (
    <div className="px-5 pb-6 pt-6">
      <h1 className="font-display text-3xl font-semibold leading-tight">Inspection history</h1>
      <p className="text-sm text-muted tabular">{history.length} inspections</p>

      <div className="relative mt-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search ID, brand or type"
          aria-label="Search inspections"
          className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base outline-none focus:border-ink"
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "min-h-11 rounded-full border px-1 text-[13px] transition-colors",
              filter === f.key ? "border-ink bg-ink font-semibold text-bg" : "border-line text-muted hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 border-t border-line">
        {list.map((r) => (
          <TyreCard key={r.id} record={r} showConfidence onClick={() => { setCurrent(r); go("detail"); }} />
        ))}
      </ul>
      {!list.length && (
        <div className="py-14 text-center">
          <SearchX size={24} className="mx-auto text-muted" aria-hidden="true" />
          <p className="mt-2 text-base font-medium">No inspections found</p>
          <p className="text-sm text-muted">Try a different search or filter.</p>
        </div>
      )}
    </div>
  );
}
