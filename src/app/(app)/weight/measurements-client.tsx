"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendChart } from "@/components/trend-chart";
import { addMeasurement, deleteMeasurement } from "@/lib/actions";
import { MEASUREMENT_SITES, measurementSite } from "@/lib/measurement-sites";
import type { LengthUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

interface Entry {
  id: number;
  site: string;
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

export function MeasurementsClient({
  entries,
  unit,
}: {
  entries: Entry[];
  unit: LengthUnit;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const firstSiteWithData = entries[0]?.site ?? "waist";
  const [site, setSite] = useState(firstSiteWithData);
  const [value, setValue] = useState("");

  const siteEntries = useMemo(
    () => entries.filter((e) => e.site === site),
    [entries, site],
  );
  const latest = siteEntries.at(-1);
  const first = siteEntries[0];
  const lost = first && latest ? first.value - latest.value : 0;

  const countBySite = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) map.set(e.site, (map.get(e.site) ?? 0) + 1);
    return map;
  }, [entries]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter the measurement as a number.");
      return;
    }
    startTransition(async () => {
      const result = await addMeasurement({ site, value: parsed, unit });
      if (result.ok) {
        toast.success(`${measurementSite(site).label} measurement saved.`);
        setValue("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      const result = await deleteMeasurement(id);
      if (result.ok) {
        toast.success("Measurement removed.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label>Where did you measure?</Label>
        <div className="flex flex-wrap gap-2">
          {MEASUREMENT_SITES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSite(s.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                site === s.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "bg-card hover:bg-accent",
              )}
            >
              {s.label}
              {(countBySite.get(s.id) ?? 0) > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {countBySite.get(s.id)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="measurement">
            {measurementSite(site).label} today ({unit})
          </Label>
          <Input
            id="measurement"
            type="number"
            step="0.1"
            min="1"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={unit === "cm" ? "e.g. 84.5" : "e.g. 33.5"}
          />
        </div>
        <Button type="submit" disabled={pending} className="font-semibold">
          Save
        </Button>
      </form>

      {siteEntries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No {measurementSite(site).label.toLowerCase()} measurements yet. Add
          your first one above — it becomes your starting point, and the family
          only ever sees how much you&apos;ve lost.
        </p>
      ) : (
        <>
          <div className="flex gap-3">
            <StatTile
              label={`Current ${measurementSite(site).label.toLowerCase()}`}
              value={`${latest!.value.toFixed(1)} ${unit}`}
            />
            <StatTile
              label="Change"
              accent={lost > 0}
              value={
                siteEntries.length < 2
                  ? "—"
                  : `${lost > 0 ? "−" : lost < 0 ? "+" : ""}${Math.abs(lost).toFixed(1)} ${unit}`
              }
            />
          </div>

          {siteEntries.length >= 2 && (
            <div className="rounded-xl border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">
                {measurementSite(site).label} over time ({unit})
              </p>
              <TrendChart data={siteEntries} unitLabel={unit} />
            </div>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {measurementSite(site).label} history
            </h2>
            <ul className="flex flex-col gap-1.5">
              {[...siteEntries].reverse().map((e) => (
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
                      aria-label={`Delete measurement from ${e.fullDate}`}
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
