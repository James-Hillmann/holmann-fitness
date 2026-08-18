"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendChart } from "@/components/trend-chart";
import { addWeighIn, deleteWeighIn } from "@/lib/actions";
import type { Unit } from "@/lib/units";

interface Entry {
  id: number;
  value: number;
  dateLabel: string;
  fullDate: string;
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex-1 rounded-xl border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}

export function WeightClient({ entries, unit }: { entries: Entry[]; unit: Unit }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [weight, setWeight] = useState("");

  const latest = entries.at(-1);
  const first = entries[0];
  const lost = first && latest ? first.value - latest.value : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(weight);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter your weight as a number.");
      return;
    }
    startTransition(async () => {
      const result = await addWeighIn({ weight: value, unit });
      if (result.ok) {
        toast.success("Weigh-in saved.");
        setWeight("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      const result = await deleteWeighIn(id);
      if (result.ok) {
        toast.success("Weigh-in removed.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="weigh-in">Today&apos;s weight ({unit})</Label>
          <Input
            id="weigh-in"
            type="number"
            step="0.1"
            min="1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={unit === "kg" ? "e.g. 82.5" : "e.g. 180"}
          />
        </div>
        <Button type="submit" disabled={pending} className="font-semibold">
          Save
        </Button>
      </form>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No weigh-ins yet. Add your first one above — it becomes your starting
          point for the family leaderboard. Prefer tape-measure tracking? Use
          the Measurements tab instead.
        </p>
      ) : (
        <>
          <div className="flex gap-3">
            <StatTile label="Current" value={`${latest!.value.toFixed(1)} ${unit}`} />
            <StatTile
              label="Change"
              accent={lost > 0}
              value={
                entries.length < 2
                  ? "—"
                  : `${lost > 0 ? "−" : lost < 0 ? "+" : ""}${Math.abs(lost).toFixed(1)} ${unit}`
              }
            />
          </div>

          {entries.length >= 2 && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">Weight over time ({unit})</p>
              <TrendChart data={entries} unitLabel={unit} />
            </div>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              History
            </h2>
            <ul className="flex flex-col gap-1.5">
              {[...entries].reverse().map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-3.5 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{e.fullDate}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">
                      {e.value.toFixed(1)} {unit}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => remove(e.id)}
                      aria-label={`Delete weigh-in from ${e.fullDate}`}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
