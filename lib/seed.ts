import { demoResult } from "@/services/demoInspection";
import type { DemoScenario, InspectionRecord, TyreInfo } from "@/types";

const MIN = 60_000;

type Row = [number, string, string, TyreInfo["type"], DemoScenario, number, string];
// [id, brand, size, type, scenario, minutesAgo, dot]
const ROWS: Row[] = [
  [1024, "MRF", "295/80 R22.5", "Truck", "ACCEPT", 2, "2121"],
  [1023, "Apollo", "11R22.5", "Truck", "SEPARATION", 8, "4520"],
  [1022, "CEAT", "295/80 R22.5", "Truck", "REJECT", 15, "3319"],
  [1021, "JK Tyre", "10.00 R20", "Bus", "ACCEPT", 31, "1821"],
  [1020, "Bridgestone", "12R22.5", "Commercial", "REVIEW", 47, "0920"],
  [1019, "Michelin", "295/80 R22.5", "Truck", "ACCEPT", 64, "4919"],
  [1018, "MRF", "10.00 R20", "Bus", "REJECT", 92, "2618"],
  [1017, "Apollo", "12R22.5", "Truck", "REVIEW", 130, "1121"],
  [1016, "CEAT", "11R22.5", "Commercial", "ACCEPT", 185, "3820"],
  [1015, "JK Tyre", "295/80 R22.5", "Truck", "SEPARATION", 240, "0721"],
];

export function seedRecords(): InspectionRecord[] {
  const now = Date.now();
  return ROWS.map(([n, brand, size, type, scenario, ago, dot]) => ({
    id: `TV-${n}`,
    tyre: { tyreId: `TV-${n}`, brand, size, type, dot, previousRetread: n % 3 === 0 },
    images: {},
    result: demoResult(scenario),
    createdAt: now - ago * MIN,
  }));
}
