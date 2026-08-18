import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM assets that must not be bundled by the server compiler.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
