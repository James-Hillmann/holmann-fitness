"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemePicker } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { logout, updateSettings } from "@/lib/actions";
import type { Unit } from "@/lib/units";
import { AVATAR_COLORS, avatarClasses } from "@/lib/workout-types";
import { cn } from "@/lib/utils";

export function SettingsForm(props: {
  name: string;
  unitPreference: Unit;
  color: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(props.name);
  const [unit, setUnit] = useState<Unit>(props.unitPreference);
  const [color, setColor] = useState(props.color);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  function saveProfile() {
    startTransition(async () => {
      const result = await updateSettings({ name, unitPreference: unit, color });
      if (result.ok) {
        toast.success("Saved.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function changePin(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettings({ currentPin, newPin });
      if (result.ok) {
        toast.success("PIN changed.");
        setCurrentPin("");
        setNewPin("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logout();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-center gap-4">
        <UserAvatar name={name || props.name} color={color} className="size-14 text-lg" />
        <div>
          <p className="font-semibold">{name || props.name}</p>
          <p className="text-sm text-muted-foreground">
            Prefers {unit === "kg" ? "metric (kg, cm)" : "imperial (lbs, in)"}
          </p>
        </div>
      </section>

      <section className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 30))}
          maxLength={30}
          autoComplete="name"
        />
        <p className="text-xs text-muted-foreground">
          This is how you show up on the leaderboard and feed.
        </p>
      </section>

      <section className="grid gap-2">
        <Label>Appearance</Label>
        <ThemePicker />
      </section>

      <section className="grid gap-2">
        <Label>Units</Label>
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
        <p className="text-xs text-muted-foreground">
          Everything — including other people&apos;s losses — is shown in the
          unit you pick here.
        </p>
      </section>

      <section className="grid gap-2">
        <Label>Avatar color</Label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => {
            const cls = avatarClasses(c);
            return (
              <button
                key={c}
                type="button"
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                className={cn(
                  "size-9 rounded-full ring-2 transition-transform",
                  cls.bg,
                  cls.ring,
                  color === c ? "scale-110 ring-primary" : "hover:scale-105",
                )}
              />
            );
          })}
        </div>
      </section>

      <Button onClick={saveProfile} disabled={pending} className="font-semibold">
        Save profile
      </Button>

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-semibold">Change PIN</h2>
        <form onSubmit={changePin} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="current-pin">Current PIN</Label>
            <Input
              id="current-pin"
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-pin">New PIN (4–6 digits)</Label>
            <Input
              id="new-pin"
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            Change PIN
          </Button>
        </form>
      </section>

      <Button variant="ghost" onClick={handleLogout} disabled={pending} className="text-muted-foreground">
        <LogOut className="size-4" /> Log out
      </Button>
    </div>
  );
}
