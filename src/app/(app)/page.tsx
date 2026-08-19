import Link from "next/link";
import { ArrowRight, Flame, Plus } from "lucide-react";
import { Board } from "@/components/board";
import { Button } from "@/components/ui/button";
import { avatarUrl } from "@/components/user-avatar";
import { WorkoutFeedItem } from "@/components/workout-feed-item";
import { formatDuration, formatRelative } from "@/lib/format";
import { getFeed, getWorkoutLeaderboard, requireUser } from "@/lib/queries";
import { REACTION_EMOJIS } from "@/lib/reactions";
import { workoutType } from "@/lib/workout-types";

export default async function DashboardPage() {
  const user = await requireUser();
  const [feed, workoutBoard] = await Promise.all([getFeed(), getWorkoutLeaderboard()]);

  const firstName = user.name.split(" ")[0];
  const myStreak = workoutBoard.find((e) => e.userId === user.id)?.streakDays ?? 0;
  const now = new Date();

  return (
    <main className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hey {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            {now.toLocaleDateString("en-ZA", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {myStreak > 1 && (
              <span className="ml-2 font-medium text-orange-600 dark:text-orange-400">
                🔥 {myStreak}-day streak
              </span>
            )}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/log" />} size="lg" className="font-semibold">
          <Plus className="size-5" /> Log workout
        </Button>
      </header>

      <section aria-labelledby="week-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="week-heading" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Flame className="size-4 text-primary" /> This week
          </h2>
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Full leaderboard <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <Board
          rows={workoutBoard.map((e) => ({
            userId: e.userId,
            name: e.name,
            color: e.color,
            avatarSrc: avatarUrl(e.userId, e.avatarVersion),
            value: (
              <>
                {e.streakDays > 1 && (
                  <span className="mr-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                    🔥 {e.streakDays}d
                  </span>
                )}
                {e.workoutsThisWeek}
                <span className="ml-1 font-normal text-muted-foreground">
                  {e.workoutsThisWeek === 1 ? "workout" : "workouts"}
                </span>
              </>
            ),
            sub: e.minutesThisWeek > 0 ? formatDuration(e.minutesThisWeek) : undefined,
          }))}
          currentUserId={user.id}
          empty="No workouts yet this week — be the first on the board!"
        />
      </section>

      <section aria-labelledby="feed-heading">
        <h2 id="feed-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent activity
        </h2>
        {feed.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <p className="mb-3">No workouts logged yet.</p>
            <Button nativeButton={false} render={<Link href="/log" />} variant="outline">
              Log the first one
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {feed.map((item) => {
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
                  isOwn={item.userId === user.id}
                  reactionSummary={REACTION_EMOJIS.map((emoji) => ({
                    emoji,
                    count: item.reactions.filter((r) => r.emoji === emoji).length,
                    mine: item.reactions.some(
                      (r) => r.emoji === emoji && r.userId === user.id,
                    ),
                  }))}
                  comments={item.comments.map((c) => ({
                    id: c.id,
                    userName: c.userName,
                    body: c.body,
                    when: formatRelative(c.createdAt, now),
                    isOwn: c.userId === user.id,
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
