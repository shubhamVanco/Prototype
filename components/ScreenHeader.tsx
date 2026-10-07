"use client";

import { ArrowLeft } from "lucide-react";
import { useApp } from "./app-context";

export function ScreenHeader({
  title, subtitle, onBack, right,
}: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  const { back } = useApp();
  return (
    <header className="flex items-center gap-3 px-5 pb-3 pt-5">
      <button
        onClick={onBack ?? back}
        aria-label="Back"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-surface-2"
      >
        <ArrowLeft size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs leading-snug text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
