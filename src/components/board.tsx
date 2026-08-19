import type { ReactNode } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/user-avatar";

export interface BoardRow {
  userId: number;
  name: string;
  color: string;
  /** From avatarUrl(); null shows the initials fallback. */
  avatarSrc: string | null;
  /** Right-aligned primary value. */
  value: ReactNode;
  /** Optional small line under the value. */
  sub?: string;
}

export function Board({
  rows,
  currentUserId,
  empty,
}: {
  rows: BoardRow[];
  currentUserId: number;
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <li key={row.userId}>
          <Link
            href={`/u/${row.userId}`}
            className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5 transition-colors hover:border-primary/50 hover:bg-accent"
          >
            <span className="w-5 text-center text-sm font-bold text-muted-foreground">
              {i + 1}
            </span>
            <UserAvatar
              name={row.name}
              color={row.color}
              src={row.avatarSrc}
              className="size-8 text-xs"
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {row.name}
              {row.userId === currentUserId && (
                <span className="text-muted-foreground"> (you)</span>
              )}
            </span>
            <span className="text-right">
              <span className="block text-sm font-semibold">{row.value}</span>
              {row.sub && (
                <span className="block text-xs text-muted-foreground">{row.sub}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
