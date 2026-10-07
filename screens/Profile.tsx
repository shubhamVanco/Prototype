"use client";

import { Factory, MapPin, Moon, Sun } from "lucide-react";
import { useApp } from "@/components/app-context";
import { cn } from "@/lib/cn";

export function ProfileScreen() {
  const { settings, updateSettings } = useApp();
  const light = settings.theme === "light";

  return (
    <div className="px-5 pb-6 pt-6">
      <h1 className="font-display text-3xl font-semibold leading-tight">Profile</h1>

      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Factory size={16} className="text-muted" />
          <span className="text-sm text-muted">Plant</span>
          <span className="ml-auto text-right text-sm font-medium">Tyre Retreading Unit</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <MapPin size={16} className="text-muted" />
          <span className="text-sm text-muted">Location</span>
          <span className="ml-auto text-right text-sm font-medium">Demo Facility</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5">
        <div className="flex items-center gap-3">
          {light ? <Sun size={18} className="text-warn" /> : <Moon size={18} className="text-brand" />}
          <div>
            <div className="text-sm font-medium">{light ? "Light mode" : "Dark mode"}</div>
            <div className="text-xs text-muted">Switch the app appearance</div>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={light}
          aria-label="Light mode"
          onClick={() => updateSettings({ theme: light ? "dark" : "light" })}
          className="-my-2 -mr-2 flex size-11 min-w-14 items-center justify-center"
        >
          <span className={cn("relative h-7 w-12 rounded-full transition-colors", light ? "bg-brand" : "bg-ink/20")}>
            <span className={cn("absolute top-1 size-5 rounded-full bg-bg transition-all", light ? "left-6" : "left-1")} />
          </span>
        </button>
      </div>
    </div>
  );
}
