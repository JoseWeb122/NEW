import { getPool } from "@/db";
import {
  autoSetupEnabled,
  getDatabaseStatus,
  resetDemoData,
  seedDemoEnabled,
} from "@/db/setup";

export const dynamic = "force-dynamic";

function tokenOk(req: Request, bodyToken?: unknown) {
  const expected = process.env.SETUP_TOKEN?.trim();
  if (!expected) return true; // demo mode — open, like the rest of the prototype
  return (
    req.headers.get("authorization") === `Bearer ${expected}` || bodyToken === expected
  );
}

/** GET /api/setup — connectivity, missing tables and row counts. */
export async function GET() {
  try {
    const status = await getDatabaseStatus(getPool());
    return Response.json({
      ok: true,
      autoSetup: autoSetupEnabled(),
      seedDemo: seedDemoEnabled(),
      resetProtected: Boolean(process.env.SETUP_TOKEN?.trim()),
      ...status,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Database unavailable" },
      { status: 503 }
    );
  }
}

/** POST /api/setup { "action": "reset" } — restore the original demo dataset. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; token?: string };

  if (!tokenOk(req, body.token)) {
    return Response.json(
      { ok: false, error: "A valid setup token is required." },
      { status: 401 }
    );
  }
  if (body.action !== "reset") {
    return Response.json(
      { ok: false, error: 'Unsupported action. Send { "action": "reset" }.' },
      { status: 400 }
    );
  }

  try {
    const counts = await resetDemoData(getPool());
    return Response.json({ ok: true, counts });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Reset failed" },
      { status: 500 }
    );
  }
}
