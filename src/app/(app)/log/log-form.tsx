"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { logWorkout } from "@/lib/actions";
import { WORKOUT_TYPES } from "@/lib/workout-types";
import { cn } from "@/lib/utils";

const QUICK_MINUTES = [15, 30, 45, 60, 90];

export function LogForm({ today }: { today: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("30");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) {
      toast.error("Pick a workout type first.");
      return;
    }
    startTransition(async () => {
      const result = await logWorkout({
        type,
        durationMinutes: Number(minutes),
        notes,
        performedOn: date,
      });
      if (result.ok) {
        toast.success("Workout logged — nice one! 💪");
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label>What did you do?</Label>
        <div className="grid grid-cols-3 gap-2">
          {WORKOUT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm font-medium transition-colors active:scale-95",
                type === t.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "bg-card hover:bg-accent",
              )}
            >
              <span className="text-2xl" aria-hidden>
                {t.emoji}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="minutes">How long? (minutes)</Label>
        <div className="flex gap-2">
          {QUICK_MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMinutes(String(m))}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                minutes === String(m)
                  ? "border-primary bg-primary/15 text-primary"
                  : "bg-card hover:bg-accent",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Input
          id="minutes"
          type="number"
          inputMode="numeric"
          min="1"
          max="1440"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">When?</Label>
        <Input
          id="date"
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes — optional</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 5km around the block, felt great"
          maxLength={500}
          rows={3}
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="font-semibold">
        {pending ? "Saving…" : "Save workout"}
      </Button>
    </form>
  );
}
