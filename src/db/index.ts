import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Both drivers expose the same Drizzle query API; we normalize on the
// neon-http type so call sites don't deal with a union.
export type Db = NeonHttpDatabase<typeof schema>;

async function createDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const [{ neon }, { drizzle }] = await Promise.all([
      import("@neondatabase/serverless"),
      import("drizzle-orm/neon-http"),
    ]);
    return drizzle(neon(process.env.DATABASE_URL), { schema });
  }

  // Local development: zero-setup embedded Postgres persisted to .pglite/
  const [{ PGlite }, { drizzle }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
  ]);
  const client = new PGlite("./.pglite/data");
  return drizzle(client, { schema }) as unknown as Db;
}

// Cached on globalThis so dev hot-reload doesn't open multiple PGlite handles.
const g = globalThis as { __holmannDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  g.__holmannDb ??= createDb();
  return g.__holmannDb;
}
