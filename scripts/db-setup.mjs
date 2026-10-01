#!/usr/bin/env node
/**
 * Database setup CLI — works with any Postgres (local, Neon, Supabase, Vercel Postgres).
 *
 *   node scripts/db-setup.mjs                create missing tables, seed demo data if empty
 *   node scripts/db-setup.mjs --reset        wipe everything and reload the demo data
 *   node scripts/db-setup.mjs --schema-only  create missing tables only
 *
 * Reads DATABASE_URL (or POSTGRES_URL, …) from the environment, .env.local or .env.
 * Tip: `vercel env pull .env.local` downloads your Vercel project's variables.
 *
 * Note: the deployed app performs the same setup automatically on its first request,
 * so running this script is optional.
 */
import { config } from "dotenv";
import pg from "pg";
import {
  APP_TABLES,
  DB_LOCK_KEY,
  pgConfigFromUrl,
  resolveDatabaseUrl,
} from "../src/db/config.mjs";
import { SCHEMA_SQL } from "../src/db/sql/schema.mjs";
import { RESET_SQL, SEED_SQL } from "../src/db/sql/seed.mjs";

config({ path: [".env.local", ".env"], quiet: true });

const args = new Set(process.argv.slice(2));
const reset = args.has("--reset");
const schemaOnly = args.has("--schema-only");

const url = resolveDatabaseUrl(process.env, { preferDirect: true });
if (!url) {
  console.error(
    "✖ No database URL found. Set DATABASE_URL in .env.local (or run `vercel env pull .env.local`)."
  );
  process.exit(1);
}

let host = "database";
try {
  host = new URL(url).host;
} catch {
  /* keep generic label */
}

const client = new pg.Client(pgConfigFromUrl(url, process.env));

try {
  await client.connect();
  console.log(`→ Connected to ${host}`);

  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [DB_LOCK_KEY]);
  await client.query(SCHEMA_SQL);
  console.log("✓ Schema is up to date");

  if (reset) {
    await client.query(RESET_SQL);
    console.log("✓ Demo data reset");
  } else if (!schemaOnly) {
    const { rows } = await client.query("SELECT NOT EXISTS (SELECT 1 FROM tutors) AS empty");
    if (rows[0].empty) {
      await client.query(SEED_SQL);
      console.log("✓ Demo data loaded");
    } else {
      console.log("• Data already present — seeding skipped (use --reset to reload)");
    }
  }
  await client.query("COMMIT");

  const counts = await client.query(
    APP_TABLES.map((t) => `SELECT '${t}' AS t, COUNT(*)::int AS n FROM "${t}"`).join(" UNION ALL ")
  );
  console.table(Object.fromEntries(counts.rows.map((r) => [r.t, r.n])));
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("✖ Database setup failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
