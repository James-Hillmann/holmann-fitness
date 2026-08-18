export type MeasurementSiteId = "waist" | "hips" | "chest" | "thigh" | "arm";

export interface MeasurementSite {
  id: MeasurementSiteId;
  label: string;
}

export const MEASUREMENT_SITES: MeasurementSite[] = [
  { id: "waist", label: "Waist" },
  { id: "hips", label: "Hips" },
  { id: "chest", label: "Chest" },
  { id: "thigh", label: "Thigh" },
  { id: "arm", label: "Arm" },
];

export function measurementSite(id: string): MeasurementSite {
  return MEASUREMENT_SITES.find((s) => s.id === id) ?? MEASUREMENT_SITES[0];
}
