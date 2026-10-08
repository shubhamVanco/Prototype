"use client";

import { useApp } from "@/components/app-context";
import { Button } from "@/components/ui/button";

/** First-run screen: one drawn tyre, then the promise and two actions. */
export function WelcomeScreen() {
  const { go, updateSettings, startNew } = useApp();
  const enter = () => updateSettings({ welcomed: true });

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-10">
      <div>
        <p className="font-display text-xl font-semibold">TyreVision AI</p>
        <p className="text-sm text-muted">AI-powered tyre pre-inspection</p>
      </div>

      <div className="relative my-8 flex flex-1 items-center justify-center" aria-hidden="true">
        <div className="relative aspect-square w-[72%] max-w-[280px]">
          <svg viewBox="0 0 200 200" className="size-full text-ink">
            <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="14" opacity="0.9" />
            <circle cx="100" cy="100" r="94" fill="none" stroke="var(--color-bg)" strokeWidth="14" strokeDasharray="9 7" opacity="0.55" />
            <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
            <circle cx="100" cy="100" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
            <circle cx="100" cy="100" r="9" fill="currentColor" />
          </svg>
        </div>
      </div>

      <h1 className="font-display text-[44px] font-bold leading-[0.95] tracking-tight">
        Screen smarter.
        <br />
        Retread better.
      </h1>
      <p className="mt-3 max-w-[32ch] text-base leading-relaxed text-muted">
        Detect visible tyre defects before they reach the retreading plant.
      </p>

      <div className="mt-7 space-y-3">
        <Button onClick={() => { enter(); startNew(); go("dashboard"); go("new"); }}>Start inspection</Button>
        <Button variant="secondary" onClick={() => { enter(); go("dashboard"); }}>Open dashboard</Button>
      </div>
    </div>
  );
}
