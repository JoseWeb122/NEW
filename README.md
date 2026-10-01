# JS Tutoring Academy

A premium K–12 tutoring platform — public website, booking & checkout, live session room,
group classes, recorded-lesson library, and dedicated **Student, Parent, Tutor and Admin** portals.

**Stack:** Next.js 16 (App Router) · React 19 · PostgreSQL · Drizzle ORM · Tailwind CSS v4 · TypeScript

---

## ▲ Deploy to Vercel

The project is zero-config on Vercel. The only thing it needs is a PostgreSQL database.

1. **Push to Git.** Commit this folder to GitHub, GitLab or Bitbucket. The local `.env` is git-ignored.
2. **Import.** Go to [vercel.com/new](https://vercel.com/new) and import the repository.
   The framework is detected as **Next.js**. Leave the build settings at their defaults.
3. **Add a database.** Open the project, go to **Storage → Create / Connect Database**, choose **Neon** (Postgres)
   and link it to all environments. This injects `DATABASE_URL` automatically.
   - Prefer another provider? Add `DATABASE_URL` yourself under **Settings → Environment Variables**.
     Supabase, Vercel Postgres, RDS and others all work.
4. **Deploy.** If you connected the database after the first deploy, click **Redeploy**.
5. **Open the site.** On the first request the app **creates every table and loads the demo dataset
   automatically**. No migrations or seed commands are needed.

**Verify the deployment:**

| URL | Expected |
| --- | --- |
| `/api/health` | `{ "ok": true }` |
| `/api/setup` | `ready: true` plus row counts per table |
| `/login` | Demo accounts for all four portals |

### Prefer the CLI?

```bash
npm i -g vercel
vercel link                     # create / link the project
vercel env add DATABASE_URL     # paste your Postgres URL (or connect Neon in the dashboard)
vercel --prod                   # deploy
```

---

## Environment variables

| Variable | Required | Default | Purpose |
| --- | :---: | --- | --- |
| `DATABASE_URL` | ✅ | — | Postgres connection string. `POSTGRES_URL`, `POSTGRES_PRISMA_URL` and `DATABASE_URL_UNPOOLED` are also detected. |
| `DATABASE_URL_UNPOOLED` | | — | Direct connection, preferred by `drizzle-kit` and `scripts/db-setup.mjs`. Neon sets it automatically. |
| `DATABASE_SSL` | | `auto` | `auto` (SSL on for remote hosts, off for localhost) · `require` · `strict` (verify certificates) · `disable` |
| `DATABASE_POOL_MAX` | | `5` on Vercel / `10` local | Max connections per server instance |
| `DB_AUTO_SETUP` | | `true` | Create missing tables on the first request |
| `DB_SEED_DEMO` | | `true` | Load the demo dataset when the database is empty |
| `SETUP_TOKEN` | | — | If set, `POST /api/setup` (reset demo data) requires `Authorization: Bearer <token>` |
| `DEMO_AUTO_RESET` | | `false` | `true` = the daily Vercel Cron job restores fresh demo data |
| `CRON_SECRET` | | — | Vercel sends it to cron endpoints; any other caller gets `401` |
| `NEXT_PUBLIC_SITE_URL` | | Vercel production URL | Canonical origin for metadata / Open Graph |

The full template lives in [`.env.example`](./.env.example).

---

## What makes it Vercel-friendly

- **No database needed at build time.** The DB client is created lazily, so `next build` succeeds
  even before a database is attached. Database-backed pages render on demand.
- **Serverless-safe connections** (`src/db/index.ts`):
  - one cached `pg` pool per instance, attached with
    [`attachDatabasePool`](https://vercel.com/kb/guide/efficiently-manage-database-connection-pools-with-fluid-compute)
    so Fluid compute closes idle clients before suspending;
  - an `error` listener, so connections dropped by Neon's autosuspend never crash a function;
  - automatic SSL for managed providers;
  - a small pool size.
- **Zero-touch setup** (`src/db/setup.ts`). The first query on a fresh database runs idempotent DDL
  (`CREATE … IF NOT EXISTS`) and seeds the demo data. This happens inside a transaction guarded by a
  Postgres **advisory lock**, so simultaneous cold starts can't race each other. Once the
  database is ready, the check is two cheap reads per instance.
- **Fresh demo data on demand.** The seeded dates are relative to *now*, so upcoming sessions and due
  assignments always look current right after seeding. You can refresh them three ways:
  - **Admin portal → Reset demo data**
  - `POST /api/setup {"action":"reset"}`
  - the opt-in **daily Vercel Cron** in `vercel.json` (enable it with `DEMO_AUTO_RESET=true`)
- **`vercel.json`** pins functions to `iad1`, next to Neon's default `us-east-1` region.
  Change `regions` if your database lives elsewhere.
- **Safe uploads.** `.gitignore` and `.vercelignore` keep local `.env` files out of Git and out of CLI uploads.

---

## Local development

Requires Node.js 20.9+ (Vercel uses 22.x; see `.nvmrc`) and any PostgreSQL database.

```bash
npm install
cp .env.example .env.local       # point DATABASE_URL at your database
# or pull your Vercel variables:  vercel env pull .env.local
npm run dev                      # http://localhost:3000 — tables + demo data are created on first request
```

### Database commands

| Command | What it does |
| --- | --- |
| `node scripts/db-setup.mjs` | Create missing tables; seed demo data if the database is empty |
| `node scripts/db-setup.mjs --reset` | Wipe all tables and reload the demo dataset |
| `node scripts/db-setup.mjs --schema-only` | Create missing tables only |
| `npx drizzle-kit push` | Sync `src/db/schema.ts` to the database (uses `drizzle.config.ts`) |
| `node scripts/sync-schema-sql.mjs` | Regenerate the bootstrap SQL after editing `src/db/schema.ts` |

> **Changing the schema?** Edit `src/db/schema.ts`, then run `npx drizzle-kit push` to update existing
> databases. Then run `node scripts/sync-schema-sql.mjs` so fresh deployments create the same tables.

---

## Demo accounts

Open `/login` and pick a role. No password is needed; sessions are stored in the browser for this prototype.

| Role | Account | Highlights |
| --- | --- | --- |
| Student | Emma Rivera · Grade 4 | Sessions, assignments, lesson progress, live room |
| Parent | Maria Rivera | Child switcher (Emma G4 / James G8), bookings, invoices, progress |
| Tutor | Sarah Johnson | Today's sessions, student notes, calendar, availability & rates |
| Admin | Academy Admin | KPIs, CRUD for students/tutors/classes/lessons, bookings, payments, reports, demo reset |

---

## Project structure

```
src/
  app/                    Routes (public site, /book, /live, /portal/*, /api/*)
    api/setup/            DB status + demo reset endpoint
    api/cron/reset-demo/  Optional daily demo refresh (Vercel Cron)
  components/             Design system (ui, cards, site chrome, portal shell)
  db/
    schema.ts             Drizzle schema (source of truth)
    index.ts              Lazy, serverless-safe Drizzle client
    setup.ts              Auto-setup, reset and status helpers
    config.mjs            Connection-string + SSL resolution (shared with CLI scripts)
    sql/schema.mjs        Generated idempotent DDL
    sql/seed.mjs          Demo dataset
  lib/                    Constants, client helpers, formatters
scripts/                  db-setup.mjs, sync-schema-sql.mjs
vercel.json               Region + cron configuration
drizzle.config.ts         drizzle-kit config (reads DATABASE_URL from env / .env.local)
```

`drizzle.config.json` is only a local fallback for the original sandbox tooling. `drizzle-kit`
uses `drizzle.config.ts` whenever both files are present.
