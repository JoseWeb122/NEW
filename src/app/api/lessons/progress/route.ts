import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = Number(url.searchParams.get("studentId") || 0);
  const rows = await db
    .select()
    .from(lessonProgress)
    .where(eq(lessonProgress.studentId, studentId));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const sid = Number(b.studentId);
  const lid = Number(b.lessonId);
  const percent = Math.min(100, Math.max(0, Number(b.percent ?? 0)));
  const existing = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.studentId, sid), eq(lessonProgress.lessonId, lid)));
  if (existing.length > 0) {
    const [row] = await db
      .update(lessonProgress)
      .set({ percent, updatedAt: new Date() })
      .where(and(eq(lessonProgress.studentId, sid), eq(lessonProgress.lessonId, lid)))
      .returning();
    return Response.json(row);
  }
  const [row] = await db
    .insert(lessonProgress)
    .values({ studentId: sid, lessonId: lid, percent })
    .returning();
  return Response.json(row, { status: 201 });
}
