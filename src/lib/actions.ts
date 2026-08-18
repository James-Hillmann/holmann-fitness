"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  avatars,
  measurements,
  steps,
  users,
  weighIns,
  workoutComments,
  workoutReactions,
  workouts,
} from "@/db/schema";
import { MEASUREMENT_SITES } from "@/lib/measurement-sites";
import { REACTION_EMOJIS } from "@/lib/reactions";
import { createSession, destroySession, getSessionUserId } from "@/lib/session";
import { toCm, toKg, type LengthUnit, type Unit } from "@/lib/units";
import { AVATAR_COLORS, WORKOUT_TYPES } from "@/lib/workout-types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ok: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ ok: false, error });

function validPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export async function join(input: {
  name: string;
  pin: string;
  unit: Unit;
  color?: string;
  startingWeight?: number | null;
}): Promise<ActionResult> {
  const name = input.name.trim();

  if (name.length < 2 || name.length > 30) return fail("Name must be 2–30 characters.");
  if (!validPin(input.pin)) return fail("PIN must be 4–6 digits.");
  if (input.unit !== "kg" && input.unit !== "lbs") return fail("Pick kg or lbs.");

  const db = await getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.name, name));
  if (existing.length > 0) return fail("That name is already taken — add a last initial?");

  const color =
    input.color && (AVATAR_COLORS as readonly string[]).includes(input.color)
      ? input.color
      : AVATAR_COLORS[name.length % AVATAR_COLORS.length];

  const pinHash = await bcrypt.hash(input.pin, 10);
  const [user] = await db
    .insert(users)
    .values({
      name,
      pinHash,
      pinLength: input.pin.length,
      unitPreference: input.unit,
      color,
    })
    .returning({ id: users.id });

  if (input.startingWeight && input.startingWeight > 0) {
    const weightKg = toKg(input.startingWeight, input.unit);
    if (weightKg < 20 || weightKg > 400) return fail("That starting weight doesn't look right.");
    await db.insert(weighIns).values({ userId: user.id, weightKg });
  }

  await createSession(user.id);
  return ok;
}

export async function login(input: { userId: number; pin: string }): Promise<ActionResult> {
  if (!validPin(input.pin)) return fail("PIN must be 4–6 digits.");
  const db = await getDb();
  const [user] = await db
    .select({ id: users.id, pinHash: users.pinHash, pinLength: users.pinLength })
    .from(users)
    .where(eq(users.id, input.userId));
  if (!user) return fail("Account not found.");
  const match = await bcrypt.compare(input.pin, user.pinHash);
  if (!match) return fail("Wrong PIN — try again.");
  // Backfill for accounts whose PIN predates the pin_length column, so
  // auto-submit kicks in from their next login.
  if (user.pinLength !== input.pin.length) {
    await db.update(users).set({ pinLength: input.pin.length }).where(eq(users.id, user.id));
  }
  await createSession(user.id);
  return ok;
}

export async function logout(): Promise<ActionResult> {
  await destroySession();
  return ok;
}

export async function logWorkout(input: {
  type: string;
  durationMinutes: number;
  notes?: string;
  performedOn: string; // yyyy-mm-dd from a date input
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  if (!WORKOUT_TYPES.some((t) => t.id === input.type)) return fail("Pick a workout type.");
  const minutes = Math.round(input.durationMinutes);
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 24 * 60)
    return fail("Duration must be between 1 minute and 24 hours.");

  const [y, m, d] = input.performedOn.split("-").map(Number);
  if (!y || !m || !d) return fail("Pick a date.");
  const now = new Date();
  const performedAt = new Date(y, m - 1, d, now.getHours(), now.getMinutes());
  if (performedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000)
    return fail("That date is in the future.");

  const notes = input.notes?.trim().slice(0, 500) || null;
  const db = await getDb();
  await db.insert(workouts).values({
    userId,
    type: input.type,
    durationMinutes: minutes,
    notes,
    performedAt,
  });
  revalidatePath("/");
  return ok;
}

export async function deleteWorkout(id: number): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const db = await getDb();
  await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
  revalidatePath("/");
  return ok;
}

export async function addWeighIn(input: { weight: number; unit: Unit }): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const weightKg = toKg(input.weight, input.unit);
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400)
    return fail("That weight doesn't look right.");
  const db = await getDb();
  await db.insert(weighIns).values({ userId, weightKg });
  revalidatePath("/weight");
  revalidatePath("/");
  return ok;
}

export async function deleteWeighIn(id: number): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const db = await getDb();
  await db.delete(weighIns).where(and(eq(weighIns.id, id), eq(weighIns.userId, userId)));
  revalidatePath("/weight");
  revalidatePath("/");
  return ok;
}

export async function addMeasurement(input: {
  site: string;
  value: number;
  unit: LengthUnit;
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  if (!MEASUREMENT_SITES.some((s) => s.id === input.site))
    return fail("Pick a measurement site.");
  const valueCm = toCm(input.value, input.unit);
  if (!Number.isFinite(valueCm) || valueCm < 10 || valueCm > 300)
    return fail("That measurement doesn't look right.");
  const db = await getDb();
  await db.insert(measurements).values({ userId, site: input.site, valueCm });
  revalidatePath("/weight");
  revalidatePath("/");
  return ok;
}

export async function deleteMeasurement(id: number): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const db = await getDb();
  await db
    .delete(measurements)
    .where(and(eq(measurements.id, id), eq(measurements.userId, userId)));
  revalidatePath("/weight");
  revalidatePath("/");
  return ok;
}

export async function toggleReaction(input: {
  workoutId: number;
  emoji: string;
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  if (!REACTION_EMOJIS.includes(input.emoji)) return fail("Pick a valid reaction.");
  const db = await getDb();
  const existing = await db
    .select({ id: workoutReactions.id })
    .from(workoutReactions)
    .where(
      and(
        eq(workoutReactions.workoutId, input.workoutId),
        eq(workoutReactions.userId, userId),
        eq(workoutReactions.emoji, input.emoji),
      ),
    );
  if (existing.length > 0) {
    await db.delete(workoutReactions).where(eq(workoutReactions.id, existing[0].id));
  } else {
    await db
      .insert(workoutReactions)
      .values({ workoutId: input.workoutId, userId, emoji: input.emoji })
      .onConflictDoNothing();
  }
  revalidatePath("/");
  return ok;
}

export async function addComment(input: {
  workoutId: number;
  body: string;
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const body = input.body.trim().slice(0, 300);
  if (body.length === 0) return fail("Write something first.");
  const db = await getDb();
  await db.insert(workoutComments).values({ workoutId: input.workoutId, userId, body });
  revalidatePath("/");
  return ok;
}

export async function deleteComment(id: number): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const db = await getDb();
  await db
    .delete(workoutComments)
    .where(and(eq(workoutComments.id, id), eq(workoutComments.userId, userId)));
  revalidatePath("/");
  return ok;
}

export async function logSteps(input: {
  day: string; // yyyy-mm-dd from a date input
  count: number;
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day)) return fail("Pick a date.");
  const count = Math.round(input.count);
  if (!Number.isFinite(count) || count < 0 || count > 200_000)
    return fail("That step count doesn't look right.");
  const db = await getDb();
  await db
    .insert(steps)
    .values({ userId, day: input.day, count })
    .onConflictDoUpdate({
      target: [steps.userId, steps.day],
      set: { count },
    });
  revalidatePath("/");
  revalidatePath("/log");
  return ok;
}

// The client resizes to ~256px before uploading, so anything bigger than
// this is either a bug or someone bypassing the form.
const MAX_AVATAR_BYTES = 300 * 1024;
const AVATAR_MIME_TYPES = ["image/webp", "image/jpeg", "image/png"];

export async function uploadAvatar(formData: FormData): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Pick a photo first.");
  if (!AVATAR_MIME_TYPES.includes(file.type)) return fail("That file isn't an image we support.");
  if (file.size > MAX_AVATAR_BYTES) return fail("That photo is too large — try a smaller one.");

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const db = await getDb();
  await db
    .insert(avatars)
    .values({ userId, data, mimeType: file.type, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: avatars.userId,
      set: { data, mimeType: file.type, updatedAt: new Date() },
    });
  await db.update(users).set({ avatarVersion: Date.now() }).where(eq(users.id, userId));
  revalidatePath("/", "layout");
  return ok;
}

export async function removeAvatar(): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const db = await getDb();
  await db.delete(avatars).where(eq(avatars.userId, userId));
  await db.update(users).set({ avatarVersion: null }).where(eq(users.id, userId));
  revalidatePath("/", "layout");
  return ok;
}

export async function updateSettings(input: {
  name?: string;
  unitPreference?: Unit;
  color?: string;
  currentPin?: string;
  newPin?: string;
}): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You're not logged in.");
  const db = await getDb();

  const updates: Partial<typeof users.$inferInsert> = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 30) return fail("Name must be 2–30 characters.");
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.name, name));
    if (existing.length > 0 && existing[0].id !== userId)
      return fail("That name is already taken — add a last initial?");
    updates.name = name;
  }

  if (input.unitPreference) {
    if (input.unitPreference !== "kg" && input.unitPreference !== "lbs")
      return fail("Pick kg or lbs.");
    updates.unitPreference = input.unitPreference;
  }

  if (input.color) {
    if (!(AVATAR_COLORS as readonly string[]).includes(input.color))
      return fail("Pick a valid color.");
    updates.color = input.color;
  }

  if (input.newPin) {
    if (!validPin(input.newPin)) return fail("New PIN must be 4–6 digits.");
    const [user] = await db
      .select({ pinHash: users.pinHash })
      .from(users)
      .where(eq(users.id, userId));
    if (!user || !input.currentPin || !(await bcrypt.compare(input.currentPin, user.pinHash)))
      return fail("Current PIN is wrong.");
    updates.pinHash = await bcrypt.hash(input.newPin, 10);
    updates.pinLength = input.newPin.length;
  }

  if (Object.keys(updates).length === 0) return fail("Nothing to update.");
  await db.update(users).set(updates).where(eq(users.id, userId));
  revalidatePath("/", "layout");
  return ok;
}
