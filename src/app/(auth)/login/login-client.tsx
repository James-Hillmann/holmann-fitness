"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PIN_MAX, PIN_MIN, PinDots, PinPad } from "@/components/pin-pad";
import { avatarUrl, UserAvatar } from "@/components/user-avatar";
import { login } from "@/lib/actions";

interface Member {
  id: number;
  name: string;
  color: string;
  avatarVersion: number | null;
}

export function LoginClient({ members }: { members: Member[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Member | null>(null);
  const [pin, setPin] = useState("");
  const [pending, startTransition] = useTransition();

  function submitPin(candidate: string) {
    if (!selected || candidate.length < PIN_MIN) return;
    startTransition(async () => {
      const result = await login({ userId: selected.id, pin: candidate });
      if (result.ok) {
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error);
        setPin("");
      }
    });
  }

  function handlePinChange(next: string) {
    setPin(next);
    // 6 digits is the max, so submit immediately; shorter PINs use the button.
    if (next.length === PIN_MAX) submitPin(next);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Dumbbell className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">HolMann Fitness</h1>
        <p className="text-sm text-muted-foreground">
          {selected ? `Hi ${selected.name.split(" ")[0]} — enter your PIN` : "Who's checking in?"}
        </p>
      </div>

      {!selected ? (
        <div className="w-full max-w-sm">
          {members.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Nobody has joined yet — be the first!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m)}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent active:scale-[0.98]"
                >
                  <UserAvatar name={m.name} color={m.color} src={avatarUrl(m.id, m.avatarVersion)} />
                  <span className="truncate text-sm font-medium">{m.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Button nativeButton={false} render={<Link href="/join" />} variant="outline">
              Join the family
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center justify-center gap-3">
            <UserAvatar
              name={selected.name}
              color={selected.color}
              src={avatarUrl(selected.id, selected.avatarVersion)}
            />
            <span className="font-medium">{selected.name}</span>
          </div>
          <PinDots filled={pin.length} />
          <PinPad value={pin} onChange={handlePinChange} disabled={pending} />
          <Button
            size="lg"
            className="mx-auto w-full max-w-xs font-semibold"
            disabled={pending || pin.length < PIN_MIN}
            onClick={() => submitPin(pin)}
          >
            {pending ? "Checking…" : "Log in"}
          </Button>
          <Button
            variant="ghost"
            className="mx-auto"
            onClick={() => {
              setSelected(null);
              setPin("");
            }}
          >
            <ArrowLeft className="size-4" /> Not you?
          </Button>
        </div>
      )}
    </main>
  );
}
