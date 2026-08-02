// tests/global-setup.ts
//
// Runs once before the whole suite. Builds a throwaway database from the real
// schema, then deletes it afterwards. Your dev.db is never touched — the tests
// only ever see prisma/test.db.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "test.db");
const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;

export default function setup() {
  fs.rmSync(dbPath, { force: true });

  // `db push` builds the tables straight from schema.prisma. Preferred over
  // `migrate deploy` here because the test database is disposable — we want the
  // current schema, not a replay of its history.
  //
  // dotenv doesn't overwrite variables that are already set, so the
  // DATABASE_URL passed here wins over the one in .env.
  // (No --skip-generate: Prisma 7 removed that flag, and db push no longer
  // runs generate on its own anyway.)
  execSync("npx prisma db push --force-reset", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  // Returned function runs after the suite finishes.
  return () => {
    fs.rmSync(dbPath, { force: true });
  };
}