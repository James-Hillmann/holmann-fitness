import { describe, expect, it } from "vitest";
import { computeStreak, currentStreak, isoDay, longestStreak, startOfWeek } from "./streak";

const day = (offset: number, base = new Date(2026, 7, 10, 12)) => {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
};

describe("computeStreak", () => {
  const now = new Date(2026, 7, 10, 18); // Mon 10 Aug 2026

  it("is zero with no workouts", () => {
    expect(computeStreak([], now)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak([day(0), day(-1), day(-2)], now)).toBe(3);
  });

  it("survives if the last workout was yesterday", () => {
    expect(computeStreak([day(-1), day(-2)], now)).toBe(2);
  });

  it("breaks after a missed day", () => {
    expect(computeStreak([day(-2), day(-3)], now)).toBe(0);
    expect(computeStreak([day(0), day(-2)], now)).toBe(1);
  });

  it("ignores duplicate workouts on the same day", () => {
    expect(computeStreak([day(0), day(0), day(-1)], now)).toBe(2);
  });
});

describe("currentStreak with mixed day sources", () => {
  const now = new Date(2026, 7, 16, 18); // Sun 16 Aug 2026

  it("counts steps-only days toward the streak", () => {
    const days = new Set(["2026-08-16", "2026-08-15", "2026-08-14"]);
    expect(currentStreak(days, now)).toBe(3);
  });

  it("isoDay pads correctly", () => {
    expect(isoDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("longestStreak", () => {
  it("is zero for no days", () => {
    expect(longestStreak(new Set())).toBe(0);
  });

  it("finds the best historical run even if broken since", () => {
    const days = new Set([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-10",
      "2026-08-11",
    ]);
    expect(longestStreak(days)).toBe(4);
  });

  it("handles a single day", () => {
    expect(longestStreak(new Set(["2026-08-10"]))).toBe(1);
  });

  it("spans month boundaries", () => {
    expect(longestStreak(new Set(["2026-07-31", "2026-08-01"]))).toBe(2);
  });
});

describe("startOfWeek", () => {
  it("returns Monday for any day of the week", () => {
    // 2026-08-10 is a Monday
    expect(startOfWeek(new Date(2026, 7, 10, 15)).getDate()).toBe(10);
    expect(startOfWeek(new Date(2026, 7, 13, 9)).getDate()).toBe(10);
    expect(startOfWeek(new Date(2026, 7, 16, 23)).getDate()).toBe(10);
  });
});
