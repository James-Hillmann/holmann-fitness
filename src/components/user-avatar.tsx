import { cn } from "@/lib/utils";
import { avatarClasses } from "@/lib/workout-types";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

/** Versioned, immutable image URL — or null for the initials fallback. */
export function avatarUrl(
  userId: number,
  avatarVersion: number | null,
): string | null {
  return avatarVersion == null ? null : `/api/avatar/${userId}?v=${avatarVersion}`;
}

export function UserAvatar({
  name,
  color,
  src,
  className,
}: {
  name: string;
  color: string;
  /** From avatarUrl(); falls back to initials when null/absent. */
  src?: string | null;
  className?: string;
}) {
  const c = avatarClasses(color);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold ring-1",
        c.bg,
        c.text,
        c.ring,
        className,
      )}
    >
      {src ? (
        // next/image's optimizer adds nothing for these tiny 256px uploads.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
