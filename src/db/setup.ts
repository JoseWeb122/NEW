import type { Pool, PoolClient } from "pg";
import { APP_TABLES, DB_LOCK_KEY } from "./config.mjs";
import { SCHEMA_SQL } from "./sql/schema.mjs";
import { RESET_SQL, SEED_SQL } from "./sql/seed.mjs";

/** Create missing tables automatically on first use (default on). Disable: DB_AUTO_SETUP=false */
export const autoSetupEnabled = () =>
  process.env.DB_AUTO_SETUP?.trim().toLowerCase() !== "false";

/** Load the demo dataset into an empty database (default on). Disable: DB_SEED_DEMO=false */
export const seedDemoEnabled = () =>
  process.env.DB_SEED_DEMO?.trim().toLowerCase() !== "false";

export type TableCounts = Record<string, number>;

async function missingTables(client: PoolClient): Promise<string[]> {
  // Query pg_class directly (snapshot-consistent) rather than to_regclass(), whose
  // per-connection name cache can report tables as missing right after another
  // instance created them while we waited for the advisory lock.
  const { rows } = await client.query<{ t: string }>(
    `SELECT t FROM unnest($1::text[]) AS t
     WHERE NOT EXISTS (
       SELECT 1 FROM pg_catalog.pg_class c
       JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relname = t
         AND c.relkind IN ('r', 'p')
         AND n.nspname = ANY (current_schemas(false))
     )`,
    [APP_TABLES]
  );
  return rows.map((r) => r.t);
}

async function isEmpty(client: PoolClient): Promise<boolean> {
  const { rows } = await client.query<{ empty: boolean }>(
    "SELECT NOT EXISTS (SELECT 1 FROM tutors) AS empty"
  );
  return rows[0]?.empty ?? true;
}

async function countRows(client: PoolClient, tables: readonly string[]): Promise<TableCounts> {
  if (tables.length === 0) return {};
  // Table names come from the APP_TABLES constant, never from user input.
  const sql = tables
    .map((t) => `SELECT '${t}' AS t, COUNT(*)::int AS n FROM "${t}"`)
    .join(" UNION ALL ");
  const { rows } = await client.query<{ t: string; n: number }>(sql);
  return Object.fromEntries(rows.map((r) => [r.t, r.n]));
}

async function inLockedTransaction<T>(client: PoolClient, fn: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");
  try {
    // Serializes setup across every serverless instance hitting a fresh database at once.
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [DB_LOCK_KEY]);
    const result = await fn();
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  }
}

/**
 * Ensures every table exists and — on a brand-new database — loads the demo data.
 * Fast path: two cheap reads. Slow path: idempotent DDL + seed inside an
 * advisory-locked transaction, so concurrent cold starts can't race each other.
 */
export async function ensureDatabase(
  pool: Pool
): Promise<{ createdTables: string[]; seeded: boolean }> {
  const client = await pool.connect();
  try {
    const missing = await missingTables(client);
    if (missing.length === 0 && (!seedDemoEnabled() || !(await isEmpty(client)))) {
      return { createdTables: [], seeded: false };
    }

    const result = await inLockedTransaction(client, async () => {
      const stillMissing = await missingTables(client);
      if (stillMissing.length > 0) await client.query(SCHEMA_SQL);
      const seeded = seedDemoEnabled() && (await isEmpty(client));
      if (seeded) await client.query(SEED_SQL);
      return { createdTables: stillMissing, seeded };
    });

    if (result.createdTables.length > 0 || result.seeded) {
      console.info(
        `[db] auto-setup complete — created ${result.createdTables.length} table(s)` +
          (result.seeded ? ", loaded demo data" : "")
      );
    }
    return result;
  } finally {
    client.release();
  }
}

/** Wipes all data and reloads the demo dataset (creating tables first if needed). */
export async function resetDemoData(pool: Pool): Promise<TableCounts> {
  const client = await pool.connect();
  try {
    return await inLockedTransaction(client, async () => {
      await client.query(SCHEMA_SQL);
      await client.query(RESET_SQL);
      return countRows(client, APP_TABLES);
    });
  } finally {
    client.release();
  }
}

/** Read-only status report used by GET /api/setup. */
export async function getDatabaseStatus(pool: Pool) {
  const client = await pool.connect();
  try {
    const missing = await missingTables(client);
    const present = APP_TABLES.filter((t) => !missing.includes(t));
    const { rows } = await client.query<{ version: string }>(
      "SELECT current_setting('server_version') AS version"
    );
    return {
      ready: missing.length === 0,
      missingTables: missing,
      counts: await countRows(client, present),
      serverVersion: rows[0]?.version ?? null,
    };
  } finally {
    client.release();
  }
}
