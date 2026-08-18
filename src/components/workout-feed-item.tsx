"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { addComment, deleteComment, deleteWorkout, toggleReaction } from "@/lib/actions";
import { REACTION_EMOJIS } from "@/lib/reactions";
import { cn } from "@/lib/utils";

export interface FeedItemComment {
  id: number;
  userName: string;
  body: string;
  when: string;
  isOwn: boolean;
}

export interface FeedItemProps {
  id: number;
  userName: string;
  userColor: string;
  /** From avatarUrl(); null shows the initials fallback. */
  userAvatarSrc: string | null;
  typeLabel: string;
  typeEmoji: string;
  duration: string;
  notes: string | null;
  when: string;
  isOwn: boolean;
  /** Per-emoji totals plus whether the viewer reacted. */
  reactionSummary: { emoji: string; count: number; mine: boolean }[];
  comments: FeedItemComment[];
}

export function WorkoutFeedItem(props: FeedItemProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      const result = await deleteWorkout(props.id);
      if (result.ok) {
        toast.success("Workout deleted.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function react(emoji: string) {
    startTransition(async () => {
      const result = await toggleReaction({ workoutId: props.id, emoji });
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (draft.trim().length === 0) return;
    startTransition(async () => {
      const result = await addComment({ workoutId: props.id, body: draft });
      if (result.ok) {
        setDraft("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function removeComment(id: number) {
    startTransition(async () => {
      const result = await deleteComment(id);
      if (result.ok) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <li className="rounded-xl border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <UserAvatar name={props.userName} color={props.userColor} src={props.userAvatarSrc} />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold">{props.userName}</span>{" "}
            <span className="text-muted-foreground">logged</span>{" "}
            <span className="font-medium">
              {props.typeEmoji} {props.typeLabel}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {props.duration} · {props.when}
          </p>
          {props.notes && (
            <p className="mt-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-sm text-foreground/90">
              {props.notes}
            </p>
          )}
        </div>
        {props.isOwn && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={handleDelete}
            className={confirming ? "text-destructive" : "text-muted-foreground"}
          >
            {confirming ? "Sure?" : <Trash2 className="size-4" />}
          </Button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-13">
        {props.reactionSummary.map(({ emoji, count, mine }) => (
          <button
            key={emoji}
            type="button"
            disabled={pending}
            onClick={() => react(emoji)}
            aria-label={`React with ${emoji}${count > 0 ? `, ${count} so far` : ""}`}
            aria-pressed={mine}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors active:scale-95",
              mine
                ? "border-primary bg-primary/15"
                : "border-transparent bg-secondary/60 hover:border-border",
            )}
          >
            <span aria-hidden>{emoji}</span>
            {count > 0 && (
              <span className={cn("text-xs tabular-nums", mine ? "text-primary" : "text-muted-foreground")}>
                {count}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className={cn(
            "ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
            showComments || props.comments.length > 0
              ? "text-foreground"
              : "text-muted-foreground",
            "hover:bg-secondary/60",
          )}
        >
          <MessageCircle className="size-3.5" />
          {props.comments.length > 0 ? props.comments.length : "Comment"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 flex flex-col gap-2 border-t pt-3 pl-13">
          {props.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <p className="min-w-0 flex-1">
                <span className="font-semibold">{c.userName}</span>{" "}
                <span className="text-foreground/90">{c.body}</span>{" "}
                <span className="text-xs text-muted-foreground">{c.when}</span>
              </p>
              {c.isOwn && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => removeComment(c.id)}
                  aria-label="Delete comment"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          <form onSubmit={sendComment} className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something nice…"
              maxLength={300}
              className="h-8 text-sm"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={pending || draft.trim().length === 0}
              aria-label="Send comment"
            >
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </li>
  );
}
