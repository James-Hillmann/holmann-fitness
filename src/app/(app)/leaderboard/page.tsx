import { Dumbbell, Flame, Footprints, Ruler, TrendingDown, Trophy } from "lucide-react";
import { Board } from "@/components/board";
import { avatarUrl } from "@/components/user-avatar";
import { formatDuration } from "@/lib/format";
import {
  getCmLossLeaderboard,
  getStepsLeaderboard,
  getWeightLossLeaderboard,
  getWorkoutLeaderboard,
  requireUser,
} from "@/lib/queries";
import { formatLengthBoth, formatWeightBoth, lengthUnitFor } from "@/lib/units";

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: typeof Flame;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
    >
      <Icon className="size-4 text-primary" /> {children}
    </h2>
  );
}

export default async function LeaderboardPage() {
  const user = await requireUser();
  const [workoutBoard, lossBoard, cmBoard, stepsBoard] = await Promise.all([
    getWorkoutLeaderboard(),
    getWeightLossLeaderboard(),
    getCmLossLeaderboard(),
    getStepsLeaderboard(),
  ]);
  const lengthUnit = lengthUnitFor(user.unitPreference);
  const sizeLossLabel = lengthUnit === "cm" ? "Centimeters lost" : "Inches lost";

  const streakRows = [...workoutBoard]
    .sort((a, b) => b.streakDays - a.streakDays || b.bestStreakDays - a.bestStreakDays)
    .map((e) => ({
      userId: e.userId,
      name: e.name,
      color: e.color,
      avatarSrc: avatarUrl(e.userId, e.avatarVersion),
      value:
        e.streakDays > 0 ? (
          <span className="text-orange-600 dark:text-orange-400">
            🔥 {e.streakDays} {e.streakDays === 1 ? "day" : "days"}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      sub: e.bestStreakDays > 0 ? `best ${e.bestStreakDays}` : undefined,
    }));

  return (
    <main className="flex flex-col gap-8">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Trophy className="size-5 text-primary" /> Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Friendly family rivalry, all in one place.
        </p>
      </header>

      <section aria-labelledby="streaks-heading">
        <SectionHeading id="streaks-heading" icon={Flame}>
          Daily streaks
        </SectionHeading>
        <Board
          rows={streakRows}
          currentUserId={user.id}
          empty="No streaks yet — a workout or a step log per day keeps one alive."
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Any day with a workout or logged steps counts. Miss a day and the
          streak resets.
        </p>
      </section>

      <section aria-labelledby="week-heading">
        <SectionHeading id="week-heading" icon={Dumbbell}>
          Workouts this week
        </SectionHeading>
        <Board
          rows={workoutBoard.map((e) => ({
            userId: e.userId,
            name: e.name,
            color: e.color,
            avatarSrc: avatarUrl(e.userId, e.avatarVersion),
            value: `${e.workoutsThisWeek} ${e.workoutsThisWeek === 1 ? "workout" : "workouts"}`,
            sub:
              e.minutesThisWeek > 0
                ? `${formatDuration(e.minutesThisWeek)} · ${e.workoutsTotal} all-time`
                : `${e.workoutsTotal} all-time`,
          }))}
          currentUserId={user.id}
          empty="No workouts yet this week — be the first on the board!"
        />
      </section>

      <section aria-labelledby="loss-heading">
        <SectionHeading id="loss-heading" icon={TrendingDown}>
          Weight lost
        </SectionHeading>
        <Board
          rows={lossBoard.map((e) => ({
            userId: e.userId,
            name: e.name,
            color: e.color,
            avatarSrc: avatarUrl(e.userId, e.avatarVersion),
            value:
              e.weighInCount < 2 ? (
                <span className="font-normal text-muted-foreground">just started</span>
              ) : e.lostKg > 0 ? (
                <span className="text-primary">
                  −{formatWeightBoth(e.lostKg, user.unitPreference)}
                </span>
              ) : e.lostKg < 0 ? (
                `+${formatWeightBoth(-e.lostKg, user.unitPreference)}`
              ) : (
                <span className="font-normal text-muted-foreground">no change</span>
              ),
          }))}
          currentUserId={user.id}
          empty="Nobody is tracking weight yet. Weigh-ins stay private — only the amount lost is shared."
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Actual weights are private — everyone only sees change since their
          first weigh-in.
        </p>
      </section>

      <section aria-labelledby="size-heading">
        <SectionHeading id="size-heading" icon={Ruler}>
          {sizeLossLabel}
        </SectionHeading>
        <Board
          rows={cmBoard.map((e) => ({
            userId: e.userId,
            name: e.name,
            color: e.color,
            avatarSrc: avatarUrl(e.userId, e.avatarVersion),
            value: !e.hasProgress ? (
              <span className="font-normal text-muted-foreground">just started</span>
            ) : e.lostCm > 0 ? (
              <span className="text-primary">−{formatLengthBoth(e.lostCm, lengthUnit)}</span>
            ) : e.lostCm < 0 ? (
              `+${formatLengthBoth(-e.lostCm, lengthUnit)}`
            ) : (
              <span className="font-normal text-muted-foreground">no change</span>
            ),
          }))}
          currentUserId={user.id}
          empty="Nobody is tracking measurements yet. Prefer the tape measure? Add yours under Body → Measurements."
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Tape-measure totals across waist, hips, chest, thigh and arm — actual
          measurements stay private.
        </p>
      </section>

      <section aria-labelledby="steps-heading">
        <SectionHeading id="steps-heading" icon={Footprints}>
          Steps this week
        </SectionHeading>
        <Board
          rows={stepsBoard.map((e) => ({
            userId: e.userId,
            name: e.name,
            color: e.color,
            avatarSrc: avatarUrl(e.userId, e.avatarVersion),
            value: (
              <span className="tabular-nums">
                {e.stepsThisWeek.toLocaleString("en-ZA")}
                <span className="ml-1 font-normal text-muted-foreground">steps</span>
              </span>
            ),
          }))}
          currentUserId={user.id}
          empty="No steps logged this week — add today's count on the Log page."
        />
      </section>
    </main>
  );
}
