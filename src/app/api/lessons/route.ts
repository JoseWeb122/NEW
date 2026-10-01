import { db } from "@/db";
import { lessons, lessonProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const grade = url.searchParams.get("grade");
  const difficulty = url.searchParams.get("difficulty");
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const studentId = url.searchParams.get("studentId");

  let rows = await db.select().from(lessons);

  if (subject) rows = rows.filter((l) => l.subject === subject);
  if (grade != null && grade !== "") rows = rows.filter((l) => l.grade === Number(grade));
  if (difficulty) rows = rows.filter((l) => l.difficulty === difficulty);
  if (q)
    rows = rows.filter(
      (l) => l.title.toLowerCase().includes(q) || l.topic.toLowerCase().includes(q)
    );

  let progress: Record<number, number> = {};
  if (studentId) {
    const rows2 = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.studentId, Number(studentId)));
    progress = Object.fromEntries(rows2.map((p) => [p.lessonId, p.percent]));
  }

  return Response.json(
    rows.map((l) => ({
      ...l,
      percent: progress[l.id] ?? 0,
      addedAt: l.addedAt,
    }))
  );
}

export async function POST(req: Request) {
  const b = await req.json();
  const [row] = await db
    .insert(lessons)
    .values({
      title: String(b.title),
      subject: String(b.subject),
      grade: Number(b.grade),
      topic: String(b.topic || b.title),
      difficulty: String(b.difficulty || "Beginner"),
      durationMin: Number(b.durationMin ?? 15),
      description: String(b.description || ""),
      popularity: Number(b.popularity ?? 20),
    })
    .returning();
  return Response.json(row, { status: 201 });
}
