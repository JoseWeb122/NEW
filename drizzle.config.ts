import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same variables the app reads; schema changes prefer the direct (non-pooled) URL.
// `vercel env pull .env.local` fetches them from your Vercel project.
config({ path: [".env.local", ".env"], quiet: true });

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
