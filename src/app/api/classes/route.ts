import { db } from "@/db";
import { groupClasses, enrollments, students, payments, tutors } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const grade = url.searchParams.get("grade");
  const level = url.searchParams.get("level");

  const [rows, tuts] = await Promise.all([
    db.select().from(groupClasses),
    db.select().from(tutors),
  ]);
  const map = new Map(tuts.map((t) => [t.id, t]));
  let all = rows.map((r) => ({
    ...r,
    tutor: map.get(r.tutorId)
      ? { ...map.get(r.tutorId)!, rating: Number(map.get(r.tutorId)!.rating) }
      : null,
  }));

  if (subject) all = all.filter((c) => c.subject === subject);
  if (grade != null && grade !== "") all = all.filter((c) => c.grade === Number(grade));
  if (level) {
    const [min, max] =
      level === "elementary" ? [0, 5] : level === "middle" ? [6, 8] : [9, 12];
    all = all.filter((c) => c.grade >= min && c.grade <= max);
  }
  return Response.json(all);
}

export async function POST(req: Request) {
  const b = await req.json();

  if (b.classId != null && b.studentId != null) {
    const [cls] = await db.select().from(groupClasses).where(eq(groupClasses.id, Number(b.classId)));
    if (!cls) return Response.json({ error: "Class not found" }, { status: 404 });
    if (cls.enrolled >= cls.capacity)
      return Response.json({ error: "Class is full" }, { status: 400 });
    const dup = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.classId, cls.id));
    if (dup.some((d) => d.studentId === Number(b.studentId)))
      return Response.json({ ok: false, error: "Student already enrolled" });
    await db.insert(enrollments).values({ classId: cls.id, studentId: Number(b.studentId) });
    await db.update(groupClasses).set({ enrolled: cls.enrolled + 1 }).where(eq(groupClasses.id, cls.id));
    if (cls.fee > 0) {
      await db.insert(payments).values({
        invoiceNo: `INV-${2600 + Math.floor(Math.random() * 900)}`,
        studentId: Number(b.studentId),
        label: `Group class — ${cls.title}`,
        type: "class",
        amount: cls.fee,
        status: "paid",
      });
    }
    const [updated] = await db.select().from(groupClasses).where(eq(groupClasses.id, cls.id));
    return Response.json({ ok: true, class: updated });
  }

  const [row] = await db
    .insert(groupClasses)
    .values({
      title: String(b.title),
      subject: String(b.subject),
      grade: Number(b.grade),
      tutorId: Number(b.tutorId),
      day: String(b.day),
      time: String(b.time),
      durationMin: Number(b.durationMin ?? 45),
      capacity: Number(b.capacity ?? 8),
      enrolled: 0,
      fee: Number(b.fee ?? 0),
      description: String(b.description ?? ""),
    })
    .returning();
  return Response.json(row, { status: 201 });
}
