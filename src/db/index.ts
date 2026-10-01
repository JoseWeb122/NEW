import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { pgConfigFromUrl, resolveDatabaseUrl } from "./config.mjs";
import { autoSetupEnabled, ensureDatabase } from "./setup";

/**
 * PostgreSQL access tuned for Vercel — and identical everywhere else.
 *
 *  • Lazy: nothing connects (or throws) at import time, so `next build` never needs a DB.
 *  • Reads DATABASE_URL, or POSTGRES_URL from the Neon / Supabase / Vercel Postgres integrations.
 *  • SSL is negotiated automatically for remote hosts (see ./config.mjs).
 *  • One pool per instance, attached to Fluid compute so idle clients close before suspension.
 *  • The first query on a fresh database creates the tables and loads demo data (DB_AUTO_SETUP).
 */

class AppPool extends Pool {
  private readonly autoSetup: boolean;
  private ready = false;
  private pending: Promise<void> | null = null;

  constructor(config: PoolConfig, autoSetup: boolean) {
    super(config);
    this.autoSetup = autoSetup;
  }

  /** One-time schema/seed check. Failures are logged and retried on the next query. */
  whenReady(): Promise<void> {
    if (this.ready || !this.autoSetup) return Promise.resolve();
    if (!this.pending) {
      this.pending = ensureDatabase(this).then(
        () => {
          this.ready = true;
        },
        (err: unknown) => {
          console.error(
            "[db] automatic setup failed:",
            err instanceof Error ? err.message : err
          );
          this.pending = null;
        }
      );
    }
    return this.pending;
  }

  // Drizzle routes every non-transactional query through pool.query(); gate it on setup.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override query(...args: any[]): any {
    const run = () =>
      (Pool.prototype.query as (...a: unknown[]) => unknown).apply(this, args);
    if (this.ready || !this.autoSetup) return run();
    return this.whenReady().then(run);
  }
}

function createDrizzle(pool: AppPool) {
  return drizzle(pool);
}

type Database = ReturnType<typeof createDrizzle>;

const globalForDb = globalThis as typeof globalThis & {
  __jsAcademyDb?: { pool: AppPool; db: Database };
};

function connection() {
  if (globalForDb.__jsAcademyDb) return globalForDb.__jsAcademyDb;

  const url = resolveDatabaseUrl(process.env);
  if (!url) {
    throw new Error(
      "No database configured. Set DATABASE_URL (or POSTGRES_URL) to a PostgreSQL connection string. " +
        "On Vercel: Project → Storage → connect Neon or Supabase, then redeploy."
    );
  }

  const onVercel = Boolean(process.env.VERCEL);
  const pool = new AppPool(
    {
      ...pgConfigFromUrl(url, process.env),
      max: Number(process.env.DATABASE_POOL_MAX) || (onVercel ? 5 : 10),
      idleTimeoutMillis: onVercel ? 5_000 : 30_000,
      connectionTimeoutMillis: 10_000,
    },
    autoSetupEnabled()
  );

  // Managed Postgres (e.g. Neon autosuspend) drops idle connections — log, never crash.
  pool.on("error", (err) => console.error("[db] idle client error:", err.message));
  // Releases idle clients before a Fluid compute instance suspends (no-op off Vercel).
  attachDatabasePool(pool);

  globalForDb.__jsAcademyDb = { pool, db: createDrizzle(pool) };
  return globalForDb.__jsAcademyDb;
}

/** Drizzle client — created on first use, so importing it is always safe. */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = connection().db;
    const value: unknown = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** Underlying pg pool (used by the setup utilities). */
export function getPool(): Pool {
  return connection().pool;
}
