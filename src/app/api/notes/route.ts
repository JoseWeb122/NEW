import { db } from "@/db";
import { tutorNotes, students, tutors } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tutorId = url.searchParams.get("tutorId");
  const studentId = url.searchParams.get("studentId");
  let rows = await db.select().from(tutorNotes).orderBy(desc(tutorNotes.createdAt));
  if (tutorId) rows = rows.filter((n) => n.tutorId === Number(tutorId));
  if (studentId) rows = rows.filter((n) => n.studentId === Number(studentId));

  const [sts, tuts] = await Promise.all([db.select().from(students), db.select().from(tutors)]);
  const sMap = new Map(sts.map((s) => [s.id, s]));
  const tMap = new Map(tuts.map((t) => [t.id, t]));
  return Response.json(
    rows.map((n) => ({
      ...n,
      student: sMap.get(n.studentId) ?? null,
      tutor: tMap.get(n.tutorId) ?? null,
    }))
  );
}

export async function POST(req: Request) {
  const b = await req.json();
  const [row] = await db
    .insert(tutorNotes)
    .values({
      tutorId: Number(b.tutorId),
      studentId: Number(b.studentId),
      summary: String(b.summary || "Session note"),
      focus: String(b.focus || ""),
      practice: String(b.practice || ""),
    })
    .returning();
  return Response.json(row, { status: 201 });
}
