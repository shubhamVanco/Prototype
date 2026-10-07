"use client";

import { ChevronRight } from "lucide-react";
import type { Defect } from "@/types";
import { SeverityBadge } from "./InspectionStatus";

/** One defect as a list row (not a card). */
export function DefectCard({ defect, onClick }: { defect: Defect; index?: number; onClick?: () => void }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="text-base font-semibold">{defect.type}</span>
            <SeverityBadge severity={defect.severity} />
          </span>
          <span className="mt-0.5 block text-sm text-muted">
            <span className="tabular">{defect.confidence}%</span> confidence · {defect.location}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
      </button>
    </li>
  );
}
