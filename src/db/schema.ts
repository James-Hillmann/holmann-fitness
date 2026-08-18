import {
  date,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  unitPreference: text("unit_preference", { enum: ["kg", "lbs"] })
    .notNull()
    .default("kg"),
  color: text("color").notNull().default("emerald"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  notes: text("notes"),
  performedAt: timestamp("performed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Weigh-ins are private: rows must only ever be read back for the session
// user. Other users may only see aggregate loss deltas computed server-side.
export const weighIns = pgTable("weigh_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weightKg: real("weight_kg").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Body measurements share the weigh-in privacy model: raw rows only for the
// session user; others only see computed "cm lost" deltas.
export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  site: text("site").notNull(), // waist | hips | chest | thigh | arm
  valueCm: real("value_cm").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per user per day; upserted when re-logged.
export const steps = pgTable(
  "steps",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(), // yyyy-mm-dd in the user's local time
    count: integer("count").notNull(),
  },
  (t) => [uniqueIndex("steps_user_day_unique").on(t.userId, t.day)],
);

export const workoutReactions = pgTable(
  "workout_reactions",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("reaction_workout_user_emoji_unique").on(
      t.workoutId,
      t.userId,
      t.emoji,
    ),
  ],
);

export const workoutComments = pgTable("workout_comments", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WeighIn = typeof weighIns.$inferSelect;
export type Measurement = typeof measurements.$inferSelect;
