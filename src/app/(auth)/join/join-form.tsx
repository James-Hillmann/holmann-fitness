"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { join } from "@/lib/actions";
import type { Unit } from "@/lib/units";
import { cn } from "@/lib/utils";

export function JoinForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [startingWeight, setStartingWeight] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const weight = startingWeight.trim() === "" ? null : Number(startingWeight);
      if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
        toast.error("Starting weight must be a number.");
        return;
      }
      const result = await join({ name, pin, unit, startingWeight: weight });
      if (result.ok) {
        toast.success(`Welcome, ${name.trim()}!`);
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Dumbbell className="size-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Join the family</h1>
          <p className="text-sm text-muted-foreground">
            One minute of setup, then you&apos;re in for good.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ouma Marie"
            autoComplete="off"
            required
          />
          <p className="text-xs text-muted-foreground">
            This is how everyone will see you — and how you&apos;ll log in.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="pin">Choose a PIN (4–6 digits)</Label>
          <Input
            id="pin"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            type="password"
            inputMode="numeric"
            placeholder="••••"
            autoComplete="new-password"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label>Preferred units</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["kg", "lbs"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                  unit === u
                    ? "border-primary bg-primary/15 text-primary"
                    : "bg-card hover:bg-accent",
                )}
              >
                {u === "kg" ? "Metric (kg, cm)" : "Imperial (lbs, in)"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="weight">Starting weight ({unit}) — optional</Label>
          <Input
            id="weight"
            value={startingWeight}
            onChange={(e) => setStartingWeight(e.target.value)}
            type="number"
            step="0.1"
            min="1"
            inputMode="decimal"
            placeholder={unit === "kg" ? "e.g. 82.5" : "e.g. 180"}
          />
          <p className="text-xs text-muted-foreground">
            Kept private. Others only ever see how much you&apos;ve lost — never your weight.
          </p>
        </div>

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Creating your account…" : "Join"}
        </Button>
        <Button nativeButton={false} render={<Link href="/login" />} variant="ghost">
          <ArrowLeft className="size-4" /> Back to login
        </Button>
      </form>
    </main>
  );
}
