import { describe, expect, it } from "vitest";
import {
  cmToIn,
  formatLength,
  formatLengthBoth,
  formatWeight,
  formatWeightBoth,
  fromCm,
  fromKg,
  inToCm,
  kgToLbs,
  lbsToKg,
  lengthUnitFor,
  toCm,
  toKg,
} from "./units";

describe("unit conversion", () => {
  it("converts kg to lbs with the exact avoirdupois factor", () => {
    expect(kgToLbs(1)).toBeCloseTo(2.20462262, 6);
    expect(kgToLbs(80)).toBeCloseTo(176.3698, 3);
  });

  it("converts lbs to kg", () => {
    expect(lbsToKg(2.20462262)).toBeCloseTo(1, 6);
    expect(lbsToKg(180)).toBeCloseTo(81.6466, 3);
  });

  it("round-trips without drift", () => {
    for (const kg of [20, 55.5, 82.3, 150, 399.9]) {
      expect(lbsToKg(kgToLbs(kg))).toBeCloseTo(kg, 9);
    }
  });

  it("toKg/fromKg respect the unit argument", () => {
    expect(toKg(100, "kg")).toBe(100);
    expect(toKg(100, "lbs")).toBeCloseTo(45.359237, 6);
    expect(fromKg(100, "kg")).toBe(100);
    expect(fromKg(45.359237, "lbs")).toBeCloseTo(100, 6);
  });

  it("formats in the viewer's unit", () => {
    expect(formatWeight(80, "kg")).toBe("80.0 kg");
    expect(formatWeight(80, "lbs")).toBe("176.4 lbs");
  });

  it("shows both units with the preferred one first", () => {
    expect(formatWeightBoth(4.5, "kg")).toBe("4.5 kg (9.9 lbs)");
    expect(formatWeightBoth(4.5, "lbs")).toBe("9.9 lbs (4.5 kg)");
  });
});

describe("length conversion", () => {
  it("maps weight preference to length unit", () => {
    expect(lengthUnitFor("kg")).toBe("cm");
    expect(lengthUnitFor("lbs")).toBe("in");
  });

  it("converts with the exact 2.54 factor", () => {
    expect(inToCm(1)).toBe(2.54);
    expect(cmToIn(2.54)).toBe(1);
    expect(cmToIn(84)).toBeCloseTo(33.0709, 3);
  });

  it("round-trips without drift", () => {
    for (const cm of [15, 60.5, 84.3, 120, 299.9]) {
      expect(inToCm(cmToIn(cm))).toBeCloseTo(cm, 9);
    }
  });

  it("toCm/fromCm respect the unit argument", () => {
    expect(toCm(84, "cm")).toBe(84);
    expect(toCm(33, "in")).toBeCloseTo(83.82, 6);
    expect(fromCm(84, "cm")).toBe(84);
    expect(fromCm(83.82, "in")).toBeCloseTo(33, 6);
  });

  it("formats in the viewer's unit, preferred first", () => {
    expect(formatLength(84, "cm")).toBe("84.0 cm");
    expect(formatLength(84, "in")).toBe("33.1 in");
    expect(formatLengthBoth(7.5, "cm")).toBe("7.5 cm (3.0 in)");
    expect(formatLengthBoth(7.5, "in")).toBe("3.0 in (7.5 cm)");
  });
});
