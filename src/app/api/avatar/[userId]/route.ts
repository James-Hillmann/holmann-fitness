import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { avatars } from "@/db/schema";

// Avatars are visible pre-auth on the login screen (like member names), so
// this endpoint is public. URLs carry an avatarVersion query param and the
// response is immutable: a new upload gets a new URL rather than a new body.
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/avatar/[userId]">,
) {
  const { userId } = await ctx.params;
  const id = Number(userId);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const db = await getDb();
  const [row] = await db.select().from(avatars).where(eq(avatars.userId, id));
  if (!row) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(row.data, "base64"), {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
