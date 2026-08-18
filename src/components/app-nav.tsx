"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Ruler, Settings, Trophy } from "lucide-react";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/log", label: "Log", icon: Plus },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/weight", label: "Body", icon: Ruler },
  { href: "/settings", label: "Me", icon: Settings },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around sm:justify-end sm:gap-1 sm:px-4">
        <Link
          href="/"
          className="mr-auto hidden items-center gap-2 py-3 font-semibold tracking-tight sm:flex"
        >
          <span className="text-primary">●</span> HolMann Fitness
        </Link>
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors sm:flex-none sm:flex-row sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5 sm:size-4" />
              {label}
            </Link>
          );
        })}
        <ThemeToggleButton className="my-auto hidden sm:flex" />
      </div>
    </nav>
  );
}
