import "server-only";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  measurements,
  steps,
  users,
  weighIns,
  workoutComments,
  workoutReactions,
  workouts,
  type User,
} from "@/db/schema";
import { getSessionUserId } from "@/lib/session";
import { currentStreak, isoDay, longestStreak, startOfWeek } from "@/lib/streak";

export async function getCurrentUser(): Promise<User | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const db = await getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId));
  return rows[0] ?? null;
}

/**
 * Layouts and pages render in parallel, so every protected page must guard
 * itself rather than rely on the layout's redirect.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Public shape for the login screen: no PIN hashes, no weights. */
export async function getUsersForLogin() {
  const db = await getDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      color: users.color,
      avatarVersion: users.avatarVersion,
      pinLength: users.pinLength,
    })
    .from(users)
    .orderBy(users.name);
}

export interface FeedReaction {
  emoji: string;
  userId: number;
}

export interface FeedComment {
  id: number;
  userId: number;
  userName: string;
  body: string;
  createdAt: Date;
}

export interface FeedItem {
  id: number;
  userId: number;
  userName: string;
  userColor: string;
  userAvatarVersion: number | null;
  type: string;
  durationMinutes: number;
  notes: string | null;
  performedAt: Date;
  reactions: FeedReaction[];
  comments: FeedComment[];
}

export async function getFeed(limit = 50): Promise<FeedItem[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: workouts.id,
      userId: workouts.userId,
      userName: users.name,
      userColor: users.color,
      userAvatarVersion: users.avatarVersion,
      type: workouts.type,
      durationMinutes: workouts.durationMinutes,
      notes: workouts.notes,
      performedAt: workouts.performedAt,
    })
    .from(workouts)
    .innerJoin(users, eq(workouts.userId, users.id))
    .orderBy(desc(workouts.performedAt), desc(workouts.id))
    .limit(limit);

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [reactions, comments] = await Promise.all([
    db
      .select({
        workoutId: workoutReactions.workoutId,
        emoji: workoutReactions.emoji,
        userId: workoutReactions.userId,
      })
      .from(workoutReactions)
      .where(inArray(workoutReactions.workoutId, ids)),
    db
      .select({
        id: workoutComments.id,
        workoutId: workoutComments.workoutId,
        userId: workoutComments.userId,
        userName: users.name,
        body: workoutComments.body,
        createdAt: workoutComments.createdAt,
      })
      .from(workoutComments)
      .innerJoin(users, eq(workoutComments.userId, users.id))
      .where(inArray(workoutComments.workoutId, ids))
      .orderBy(workoutComments.createdAt, workoutComments.id),
  ]);

  return rows.map((r) => ({
    ...r,
    reactions: reactions
      .filter((x) => x.workoutId === r.id)
      .map(({ emoji, userId }) => ({ emoji, userId })),
    comments: comments
      .filter((x) => x.workoutId === r.id)
      .map(({ id, userId, userName, body, createdAt }) => ({
        id,
        userId,
        userName,
        body,
        createdAt,
      })),
  }));
}

export interface StepsEntry {
  userId: number;
  name: string;
  color: string;
  avatarVersion: number | null;
  stepsThisWeek: number;
}

export async function getStepsLeaderboard(): Promise<StepsEntry[]> {
  const db = await getDb();
  const weekStart = startOfWeek(new Date());
  const weekStartIso = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
  const rows = await db
    .select({
      userId: steps.userId,
      name: users.name,
      color: users.color,
      avatarVersion: users.avatarVersion,
      day: steps.day,
      count: steps.count,
    })
    .from(steps)
    .innerJoin(users, eq(steps.userId, users.id))
    .where(gte(steps.day, weekStartIso));

  const byUser = new Map<number, StepsEntry>();
  for (const r of rows) {
    const entry = byUser.get(r.userId) ?? {
      userId: r.userId,
      name: r.name,
      color: r.color,
      avatarVersion: r.avatarVersion,
      stepsThisWeek: 0,
    };
    entry.stepsThisWeek += r.count;
    byUser.set(r.userId, entry);
  }
  return [...byUser.values()].sort((a, b) => b.stepsThisWeek - a.stepsThisWeek);
}

/** The session user's logged steps for a given local day, if any. */
export async function getMyStepsForDay(userId: number, day: string): Promise<number | null> {
  const db = await getDb();
  const row = await db
    .select({ count: steps.count })
    .from(steps)
    .where(and(eq(steps.userId, userId), eq(steps.day, day)));
  return row[0]?.count ?? null;
}

export interface LeaderboardEntry {
  userId: number;
  name: string;
  color: string;
  avatarVersion: number | null;
  workoutsThisWeek: number;
  workoutsTotal: number;
  minutesThisWeek: number;
  /** Consecutive active days (a workout or logged steps) ending today/yesterday. */
  streakDays: number;
  /** Best-ever run of consecutive active days. */
  bestStreakDays: number;
}

export interface WeightLossEntry {
  userId: number;
  name: string;
  color: string;
  avatarVersion: number | null;
  lostKg: number;
  weighInCount: number;
}

export async function getWorkoutLeaderboard(): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  const [allUsers, allWorkouts, allSteps] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        color: users.color,
        avatarVersion: users.avatarVersion,
      })
      .from(users),
    db
      .select({
        userId: workouts.userId,
        performedAt: workouts.performedAt,
        durationMinutes: workouts.durationMinutes,
      })
      .from(workouts),
    db.select({ userId: steps.userId, day: steps.day, count: steps.count }).from(steps),
  ]);

  const weekStart = startOfWeek(new Date());
  return allUsers
    .map((u) => {
      const mine = allWorkouts.filter((w) => w.userId === u.id);
      const thisWeek = mine.filter((w) => w.performedAt >= weekStart);
      // Streaks count any active day: a workout OR a non-zero step log.
      const activeDays = new Set<string>(mine.map((w) => isoDay(w.performedAt)));
      for (const s of allSteps) {
        if (s.userId === u.id && s.count > 0) activeDays.add(s.day);
      }
      return {
        userId: u.id,
        name: u.name,
        color: u.color,
        avatarVersion: u.avatarVersion,
        workoutsThisWeek: thisWeek.length,
        workoutsTotal: mine.length,
        minutesThisWeek: thisWeek.reduce((s, w) => s + w.durationMinutes, 0),
        streakDays: currentStreak(activeDays),
        bestStreakDays: longestStreak(activeDays),
      };
    })
    .sort(
      (a, b) =>
        b.workoutsThisWeek - a.workoutsThisWeek ||
        b.minutesThisWeek - a.minutesThisWeek ||
        a.name.localeCompare(b.name),
    );
}

/**
 * Privacy boundary: returns only computed loss (first minus latest weigh-in)
 * per user — never raw weights.
 */
export async function getWeightLossLeaderboard(): Promise<WeightLossEntry[]> {
  const db = await getDb();
  const [allUsers, allWeighIns] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        color: users.color,
        avatarVersion: users.avatarVersion,
      })
      .from(users),
    db
      .select({
        userId: weighIns.userId,
        weightKg: weighIns.weightKg,
        recordedAt: weighIns.recordedAt,
      })
      .from(weighIns)
      .orderBy(weighIns.recordedAt, weighIns.id),
  ]);

  return allUsers
    .map((u) => {
      const mine = allWeighIns.filter((w) => w.userId === u.id);
      if (mine.length === 0) return null;
      const first = mine[0].weightKg;
      const latest = mine[mine.length - 1].weightKg;
      return {
        userId: u.id,
        name: u.name,
        color: u.color,
        avatarVersion: u.avatarVersion,
        lostKg: first - latest,
        weighInCount: mine.length,
      };
    })
    .filter((e): e is WeightLossEntry => e !== null && e.weighInCount >= 1)
    .sort((a, b) => b.lostKg - a.lostKg);
}

/** Private: only ever call with the session user's id. */
export async function getMyWeighIns(userId: number) {
  const db = await getDb();
  return db
    .select()
    .from(weighIns)
    .where(eq(weighIns.userId, userId))
    .orderBy(weighIns.recordedAt, weighIns.id);
}

/** Private: only ever call with the session user's id. */
export async function getMyMeasurements(userId: number) {
  const db = await getDb();
  return db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(measurements.recordedAt, measurements.id);
}

export interface CmLossEntry {
  userId: number;
  name: string;
  color: string;
  avatarVersion: number | null;
  /** Sum over sites of (first reading − latest reading). */
  lostCm: number;
  /** True once any site has at least two readings. */
  hasProgress: boolean;
}

/**
 * Privacy boundary: like the weight board, this only ever exposes computed
 * losses summed across measurement sites — never raw circumferences.
 */
export async function getCmLossLeaderboard(): Promise<CmLossEntry[]> {
  const db = await getDb();
  const [allUsers, allMeasurements] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        color: users.color,
        avatarVersion: users.avatarVersion,
      })
      .from(users),
    db
      .select({
        userId: measurements.userId,
        site: measurements.site,
        valueCm: measurements.valueCm,
      })
      .from(measurements)
      .orderBy(measurements.recordedAt, measurements.id),
  ]);

  return allUsers
    .map((u) => {
      const mine = allMeasurements.filter((m) => m.userId === u.id);
      if (mine.length === 0) return null;
      const bySite = new Map<string, number[]>();
      for (const m of mine) {
        const list = bySite.get(m.site) ?? [];
        list.push(m.valueCm);
        bySite.set(m.site, list);
      }
      let lostCm = 0;
      let hasProgress = false;
      for (const values of bySite.values()) {
        if (values.length >= 2) {
          hasProgress = true;
          lostCm += values[0] - values[values.length - 1];
        }
      }
      return {
        userId: u.id,
        name: u.name,
        color: u.color,
        avatarVersion: u.avatarVersion,
        lostCm,
        hasProgress,
      };
    })
    .filter((e): e is CmLossEntry => e !== null)
    .sort((a, b) => b.lostCm - a.lostCm);
}
