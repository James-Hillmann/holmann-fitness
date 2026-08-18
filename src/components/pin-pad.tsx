"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export const PIN_MIN = 4;
export const PIN_MAX = 6;

export function PinDots({ filled }: { filled: number }) {
  // PINs are 4-6 digits; show extra dots as they're typed.
  const total = Math.min(Math.max(PIN_MIN, filled), PIN_MAX);
  return (
    <div className="flex items-center justify-center gap-3" aria-label={`${filled} PIN digits entered`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-3.5 rounded-full border border-muted-foreground/40 transition-colors",
            i < filled && "border-primary bg-primary",
          )}
        />
      ))}
    </div>
  );
}

export function PinPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  function press(key: string) {
    if (disabled) return;
    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key !== "" && value.length < PIN_MAX) {
      onChange(value + key);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2">
      {KEYS.map((key, i) =>
        key === "" ? (
          <span key={i} />
        ) : (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            aria-label={key === "⌫" ? "Delete digit" : key}
            className={cn(
              "flex h-14 items-center justify-center rounded-xl bg-secondary text-xl font-medium transition-colors",
              "hover:bg-accent active:scale-95 active:bg-primary/20 disabled:opacity-50",
            )}
          >
            {key === "⌫" ? <Delete className="size-5" /> : key}
          </button>
        ),
      )}
    </div>
  );
}
