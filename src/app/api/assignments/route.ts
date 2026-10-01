import { db } from "@/db";
import { assignments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  let rows = await db.select().from(assignments);
  if (studentId) rows = rows.filter((a) => a.studentId === Number(studentId));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  if (b.action === "complete") {
    const [row] = await db
      .update(assignments)
      .set({ status: "done" })
      .where(eq(assignments.id, Number(b.id)))
      .returning();
    return Response.json(row ? { ok: true, assignment: row } : { ok: false });
  }
  const [row] = await db
    .insert(assignments)
    .values({
      studentId: Number(b.studentId),
      title: String(b.title),
      subject: String(b.subject),
      kind: String(b.kind ?? "worksheet"),
      dueAt: new Date(b.dueAt ?? Date.now()),
      status: "todo",
      score: null,
      feedback: null,
    })
    .returning();
  return Response.json(row, { status: 201 });
}
