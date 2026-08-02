// vitest.config.ts  (project root, next to package.json)

import path from "node:path";
import { defineConfig } from "vitest/config";

// Absolute path, forward slashes. Relative "file:./x.db" URLs are ambiguous —
// the Prisma CLI resolves them against the schema directory while the
// better-sqlite3 adapter resolves them against the working directory, so the
// migration and the app can end up pointing at two different files. An absolute
// path removes the question entirely, and matters more on Windows.
export const TEST_DATABASE_URL = `file:${path
  .join(process.cwd(), "prisma", "test.db")
  .replace(/\\/g, "/")}`;

export default defineConfig({
  // Mirrors the "@/*" path alias from tsconfig.json so imports resolve in tests.
  resolve: {
    alias: { "@": process.cwd() },
  },
  test: {
    environment: "node",

    // Points lib/prisma.ts at the throwaway database instead of dev.db.
    // Read at import time, so it must be set before any test module loads.
    env: { DATABASE_URL: TEST_DATABASE_URL },

    globalSetup: ["./tests/global-setup.ts"],

    // One SQLite file, so run test files one at a time. Concurrent writers
    // would produce intermittent "database is locked" failures — the exact
    // opposite of deterministic.
    fileParallelism: false,
  },
});