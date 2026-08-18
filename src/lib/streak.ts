/** Local-time yyyy-mm-dd, matching the format stored in steps.day. */
export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(now: Date): Date {
  // Monday-start week
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

/**
 * Consecutive active days ending today or yesterday. A day is "active" when
 * it appears in the set — callers decide what counts (workouts, steps, …).
 */
export function currentStreak(days: Set<string>, now = new Date()): number {
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(isoDay(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(isoDay(cursor))) return 0;
  }
  while (days.has(isoDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** The longest run of consecutive active days anywhere in history. */
export function longestStreak(days: Set<string>): number {
  if (days.size === 0) return 0;
  const sorted = [...days].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    // ISO days parse as UTC midnights, so whole-day diffs are exact.
    const diff = Math.round(
      (Date.parse(sorted[i]) - Date.parse(sorted[i - 1])) / 86_400_000,
    );
    if (diff === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

/** Convenience wrapper for date lists (used by tests and workout-only callers). */
export function computeStreak(dates: Date[], now = new Date()): number {
  return currentStreak(new Set(dates.map(isoDay)), now);
}
