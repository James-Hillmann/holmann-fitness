export type Unit = "kg" | "lbs";

// Exact international avoirdupois definition: 1 lb = 0.45359237 kg
export const KG_PER_LB = 0.45359237;

export function kgToLbs(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}

export function toKg(value: number, unit: Unit): number {
  return unit === "kg" ? value : lbsToKg(value);
}

export function fromKg(kg: number, unit: Unit): number {
  return unit === "kg" ? kg : kgToLbs(kg);
}

export function formatWeight(kg: number, unit: Unit, decimals = 1): string {
  return `${fromKg(kg, unit).toFixed(decimals)} ${unit}`;
}

/** "4.5 kg (9.9 lbs)" with the viewer's preferred unit first. */
export function formatWeightBoth(kg: number, primary: Unit): string {
  const secondary: Unit = primary === "kg" ? "lbs" : "kg";
  return `${formatWeight(kg, primary)} (${formatWeight(kg, secondary)})`;
}

// --- Lengths (body measurements) ---

export type LengthUnit = "cm" | "in";

// Exact international definition: 1 in = 2.54 cm
export const CM_PER_IN = 2.54;

/** Metric (kg) viewers measure in cm; imperial (lbs) viewers in inches. */
export function lengthUnitFor(unit: Unit): LengthUnit {
  return unit === "kg" ? "cm" : "in";
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function toCm(value: number, unit: LengthUnit): number {
  return unit === "cm" ? value : inToCm(value);
}

export function fromCm(cm: number, unit: LengthUnit): number {
  return unit === "cm" ? cm : cmToIn(cm);
}

export function formatLength(cm: number, unit: LengthUnit, decimals = 1): string {
  return `${fromCm(cm, unit).toFixed(decimals)} ${unit}`;
}

/** "7.5 cm (3.0 in)" with the viewer's preferred unit first. */
export function formatLengthBoth(cm: number, primary: LengthUnit): string {
  const secondary: LengthUnit = primary === "cm" ? "in" : "cm";
  return `${formatLength(cm, primary)} (${formatLength(cm, secondary)})`;
}
