import { defineConfig } from "drizzle-kit";

// With DATABASE_URL set (Neon in production) push targets that database;
// otherwise it targets the local PGlite directory used by `next dev`.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  ...(process.env.DATABASE_URL
    ? { dbCredentials: { url: process.env.DATABASE_URL } }
    : { driver: "pglite", dbCredentials: { url: "./.pglite/data" } }),
});
