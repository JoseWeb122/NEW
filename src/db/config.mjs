// Shared database connection helpers.
// Plain ESM on purpose: imported by the Next.js app (src/db/index.ts) AND by the
// Node CLI scripts in /scripts, which run without a TypeScript loader.

/** Advisory-lock key that serializes schema setup / seeding across serverless instances. */
export const DB_LOCK_KEY = 72731001;

/** Every application table. All of them use a serial `id` primary key. */
export const APP_TABLES = [
  "tutors",
  "reviews",
  "parents",
  "students",
  "group_classes",
  "enrollments",
  "lessons",
  "lesson_progress",
  "bookings",
  "payments",
  "assignments",
  "tutor_notes",
  "messages",
];

// Variables injected by the Vercel Marketplace integrations (Neon, Supabase,
// legacy Vercel Postgres) plus a plain DATABASE_URL — in priority order.
const POOLED_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];
const DIRECT_KEYS = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
];

/**
 * Returns the first configured Postgres connection string, or undefined.
 * `preferDirect` favours non-pooled URLs (recommended for migrations / DDL tooling).
 */
export function resolveDatabaseUrl(env = process.env, { preferDirect = false } = {}) {
  for (const key of preferDirect ? DIRECT_KEYS : POOLED_KEYS) {
    const value = env[key] && env[key].trim();
    if (value) return value;
  }
  return undefined;
}

const LOCAL_HOSTS = new Set([
  "",
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "host.docker.internal",
  "postgres",
  "db",
]);

function stripParam(url, name) {
  return url.replace(new RegExp(`([?&])${name}=[^&#]*&?`), "$1").replace(/[?&]$/, "");
}

/**
 * Builds `pg` connection options from a URL.
 *
 * SSL is switched on automatically for remote hosts (Neon, Supabase, RDS, …) and
 * off for local databases. Override with DATABASE_SSL = auto | require | strict | disable.
 * A `sslmode` query parameter is honoured, then removed so that pg's own URL parser
 * can't silently override the options computed here.
 */
export function pgConfigFromUrl(url, env = process.env) {
  let host = "";
  let sslmode = null;
  try {
    const parsed = new URL(url);
    host = parsed.hostname.toLowerCase();
    sslmode = parsed.searchParams.get("sslmode");
  } catch {
    // Not URL-shaped — hand it to pg untouched.
  }
  const connectionString = sslmode === null ? url : stripParam(url, "sslmode");

  const mode = (env.DATABASE_SSL || "auto").trim().toLowerCase();
  let ssl;
  if (mode === "disable" || mode === "false" || mode === "off" || sslmode === "disable") {
    ssl = false;
  } else if (
    mode === "strict" ||
    mode === "verify" ||
    sslmode === "verify-full" ||
    sslmode === "verify-ca"
  ) {
    ssl = { rejectUnauthorized: true };
  } else if (
    mode === "require" ||
    mode === "true" ||
    mode === "on" ||
    sslmode === "require" ||
    !LOCAL_HOSTS.has(host)
  ) {
    // Encrypted without CA pinning: works with every managed provider (some poolers
    // use a private CA). Set DATABASE_SSL=strict to enforce certificate verification.
    ssl = { rejectUnauthorized: false };
  } else {
    ssl = false;
  }

  return { connectionString, ssl };
}
