import { notFound } from "next/navigation";
import { WorkoutFeedItem } from "@/components/workout-feed-item";
import { avatarUrl, UserAvatar } from "@/components/user-avatar";
import { formatDuration, formatRelative } from "@/lib/format";
import {
  getFeed,
  getPublicProfile,
  getWorkoutLeaderboard,
  requireUser,
} from "@/lib/queries";
import { REACTION_EMOJIS } from "@/lib/reactions";
import { workoutType } from "@/lib/workout-types";

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card px-3 py-2.5 text-center">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Public profile: name, avatar and workout activity only. Weigh-ins and
 * measurements are private and must never be fetched here — the boards
 * already expose the only sanctioned aggregates (loss deltas).
 */
export default async function ProfilePage(props: PageProps<"/u/[userId]">) {
  const viewer = await requireUser();
  const { userId } = await props.params;
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const profile = await getPublicProfile(id);
  if (!profile) notFound();

  const [workoutFeed, board] = await Promise.all([
    getFeed(100, id),
    getWorkoutLeaderboard(),
  ]);
  const stats = board.find((e) => e.userId === id);
  const now = new Date();

  return (
    <main className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <UserAvatar
          name={profile.name}
          color={profile.color}
          src={avatarUrl(profile.id, profile.avatarVersion)}
          className="size-16 text-xl"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {profile.name}
            {profile.id === viewer.id && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">(you)</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Joined{" "}
            {profile.createdAt.toLocaleDateString("en-ZA", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </header>

      {stats && (
        <section aria-label="Workout stats" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="This week"
            value={
              stats.minutesThisWeek > 0
                ? `${stats.workoutsThisWeek} · ${formatDuration(stats.minutesThisWeek)}`
                : stats.workoutsThisWeek
            }
          />
          <Stat label="All-time workouts" value={stats.workoutsTotal} />
          <Stat
            label="Streak"
            value={stats.streakDays > 0 ? `🔥 ${stats.streakDays}d` : "—"}
          />
          <Stat
            label="Best streak"
            value={stats.bestStreakDays > 0 ? `${stats.bestStreakDays}d` : "—"}
          />
        </section>
      )}

      <section aria-labelledby="workouts-heading">
        <h2
          id="workouts-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Workouts
        </h2>
        {workoutFeed.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No workouts logged yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {workoutFeed.map((item) => {
              const t = workoutType(item.type);
              return (
                <WorkoutFeedItem
                  key={item.id}
                  id={item.id}
                  userId={item.userId}
                  userName={item.userName}
                  userColor={item.userColor}
                  userAvatarSrc={avatarUrl(item.userId, item.userAvatarVersion)}
                  typeLabel={t.label}
                  typeEmoji={t.emoji}
                  duration={formatDuration(item.durationMinutes)}
                  notes={item.notes}
                  when={formatRelative(item.performedAt, now)}
                  isOwn={item.userId === viewer.id}
                  reactionSummary={REACTION_EMOJIS.map((emoji) => ({
                    emoji,
                    count: item.reactions.filter((r) => r.emoji === emoji).length,
                    mine: item.reactions.some(
                      (r) => r.emoji === emoji && r.userId === viewer.id,
                    ),
                  }))}
                  comments={item.comments.map((c) => ({
                    id: c.id,
                    userName: c.userName,
                    body: c.body,
                    when: formatRelative(c.createdAt, now),
                    isOwn: c.userId === viewer.id,
                  }))}
                />
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
