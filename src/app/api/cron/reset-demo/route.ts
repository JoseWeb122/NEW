import { getPool } from "@/db";
import { resetDemoData } from "@/db/setup";

export const dynamic = "force-dynamic";

/**
 * Daily demo refresh — scheduled in vercel.json ("crons").
 *
 * Opt-in: data is only reset when DEMO_AUTO_RESET=true, so the schedule is harmless
 * for real deployments. When CRON_SECRET is set, Vercel sends it as a Bearer token
 * and any other caller is rejected.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.DEMO_AUTO_RESET?.trim().toLowerCase() !== "true") {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "Set DEMO_AUTO_RESET=true to refresh the demo dataset daily.",
    });
  }

  try {
    const counts = await resetDemoData(getPool());
    return Response.json({ ok: true, reset: true, counts });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Reset failed" },
      { status: 500 }
    );
  }
}
