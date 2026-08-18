"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logSteps } from "@/lib/actions";

export function StepsForm({
  today,
  initialCount,
}: {
  today: string;
  initialCount: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(initialCount !== null ? String(initialCount) : "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(count);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Enter your steps as a number.");
      return;
    }
    startTransition(async () => {
      const result = await logSteps({ day: today, count: parsed });
      if (result.ok) {
        toast.success("Steps saved. 👟");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="mt-8 rounded-xl border p-4">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Footprints className="size-4 text-primary" /> Today&apos;s steps — optional
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        From your phone or watch. Counts toward the weekly steps board; log
        again to update today&apos;s number.
      </p>
      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="steps" className="sr-only">
            Steps today
          </Label>
          <Input
            id="steps"
            type="number"
            inputMode="numeric"
            min="0"
            max="200000"
            step="1"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="e.g. 8500"
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending || count === ""}>
          {initialCount !== null ? "Update" : "Save"}
        </Button>
      </form>
    </section>
  );
}
