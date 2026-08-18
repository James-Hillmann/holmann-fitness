"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { MonitorSmartphone, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/** False during SSR/hydration, true after — without effect-driven re-renders. */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/** Icon button for the nav. Renders a stable placeholder until mounted. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/** Light/System/Dark segmented control for the settings page. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const current = mounted ? theme : undefined;
  return (
    <div className="grid grid-cols-3 gap-2">
      {(
        [
          { id: "light", label: "Light", icon: Sun },
          { id: "system", label: "Auto", icon: MonitorSmartphone },
          { id: "dark", label: "Dark", icon: Moon },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors",
            current === id
              ? "border-primary bg-primary/15 text-primary"
              : "bg-card hover:bg-accent",
          )}
        >
          <Icon className="size-4" /> {label}
        </button>
      ))}
    </div>
  );
}
