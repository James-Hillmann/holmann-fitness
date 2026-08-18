import { cn } from "@/lib/utils";
import { avatarClasses } from "@/lib/workout-types";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

export function UserAvatar({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  const c = avatarClasses(color);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1",
        c.bg,
        c.text,
        c.ring,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
