"use client";

import { useState } from "react";
import { useApp } from "@/components/app-context";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import type { TyreInfo } from "@/types";

const BRANDS = ["MRF", "Apollo", "CEAT", "JK Tyre", "Bridgestone", "Michelin", "Other"];
const TYPES: TyreInfo["type"][] = ["Truck", "Bus", "Commercial", "Passenger"];

export function NewInspectionScreen() {
  const { draft, setTyre, go, back, notify } = useApp();
  const t = draft.tyre;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (p: Partial<TyreInfo>) => setTyre({ ...t, ...p });

  const next = () => {
    const e: Record<string, string> = {};
    if (!t.tyreId.trim()) e.tyreId = "Enter a tyre ID";
    if (!t.brand) e.brand = "Select a brand";
    setErrors(e);
    if (Object.keys(e).length) return notify("Please complete the highlighted fields", "warn");
    go("capture");
  };

  return (
    <div className="pb-8">
      <ScreenHeader title="New Inspection" onBack={back} />
      <div className="px-5">
        <ProgressSteps step={1} />
        <h2 className="mb-4 mt-5 text-xl font-semibold">Identify the tyre</h2>

        <div className="space-y-4">
          <Field label="Tyre ID" error={errors.tyreId}>
            <Input
              value={t.tyreId}
              invalid={!!errors.tyreId}
              onChange={(e) => set({ tyreId: e.target.value.toUpperCase() })}
              placeholder="TV-1025"
            />
          </Field>

          <Field label="Brand" error={errors.brand}>
            <Select value={t.brand} onChange={(e) => set({ brand: e.target.value })}>
              <option value="">Select brand</option>
              {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>

          <Field label="Tyre type">
            <Select value={t.type} onChange={(e) => set({ type: e.target.value as TyreInfo["type"] })}>
              {TYPES.map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
        </div>

        <Button className="mt-7" onClick={next}>Continue</Button>
      </div>
    </div>
  );
}
