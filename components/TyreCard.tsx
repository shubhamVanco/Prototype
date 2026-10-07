"use client";

import { ChevronRight } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { InspectionRecord } from "@/types";
import { InspectionStatus } from "./InspectionStatus";

/** One inspection as a list row. */
export function TyreCard({
  record, onClick, showConfidence,
}: { record: InspectionRecord; onClick: () => void; index?: number; showConfidence?: boolean }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" onClick={onClick} className="flex min-h-[72px] w-full items-center gap-3 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold">{record.id}</span>
            <InspectionStatus status={record.result.overallStatus} />
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">{record.tyre.brand} · {record.tyre.type}</span>
          <span className="mt-0.5 block text-sm text-muted">
            {timeAgo(record.createdAt)}
            {showConfidence && <> · <span className="tabular">{record.result.confidence}%</span> confidence</>}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
      </button>
    </li>
  );
}
