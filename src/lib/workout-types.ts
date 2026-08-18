export type WorkoutTypeId =
  | "strength"
  | "run"
  | "walk"
  | "cycling"
  | "swimming"
  | "sports"
  | "yoga"
  | "hike"
  | "other";

export interface WorkoutType {
  id: WorkoutTypeId;
  label: string;
  emoji: string;
}

export const WORKOUT_TYPES: WorkoutType[] = [
  { id: "strength", label: "Strength", emoji: "🏋️" },
  { id: "run", label: "Run", emoji: "🏃" },
  { id: "walk", label: "Walk", emoji: "🚶" },
  { id: "cycling", label: "Cycling", emoji: "🚴" },
  { id: "swimming", label: "Swimming", emoji: "🏊" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "hike", label: "Hike", emoji: "🥾" },
  { id: "other", label: "Other", emoji: "💪" },
];

export function workoutType(id: string): WorkoutType {
  return (
    WORKOUT_TYPES.find((t) => t.id === id) ??
    WORKOUT_TYPES[WORKOUT_TYPES.length - 1]
  );
}

export const AVATAR_COLORS = [
  "rose",
  "orange",
  "amber",
  "lime",
  "emerald",
  "teal",
  "sky",
  "violet",
  "fuchsia",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

/** Tailwind classes per avatar color (static strings so Tailwind can see them). */
export const AVATAR_COLOR_CLASSES: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  rose: { bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-400", ring: "ring-rose-500/40" },
  orange: { bg: "bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", ring: "ring-orange-500/40" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-700 dark:text-amber-400", ring: "ring-amber-500/40" },
  lime: { bg: "bg-lime-500/15", text: "text-lime-700 dark:text-lime-400", ring: "ring-lime-500/40" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-500/40" },
  teal: { bg: "bg-teal-500/15", text: "text-teal-700 dark:text-teal-400", ring: "ring-teal-500/40" },
  sky: { bg: "bg-sky-500/15", text: "text-sky-700 dark:text-sky-400", ring: "ring-sky-500/40" },
  violet: { bg: "bg-violet-500/15", text: "text-violet-700 dark:text-violet-400", ring: "ring-violet-500/40" },
  fuchsia: { bg: "bg-fuchsia-500/15", text: "text-fuchsia-700 dark:text-fuchsia-400", ring: "ring-fuchsia-500/40" },
};

export function avatarClasses(color: string) {
  return AVATAR_COLOR_CLASSES[color] ?? AVATAR_COLOR_CLASSES.emerald;
}
