import { db } from "@/db";
import { bookings, students, tutors } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type BookingRow = (typeof bookings.$inferSelect);

async function withNames(rows: BookingRow[]) {
  const [st, tu] = await Promise.all([
    db.select().from(students),
    db.select().from(tutors),
  ]);
  const sMap = new Map(st.map((s) => [s.id, s]));
  const tMap = new Map(tu.map((t) => [t.id, t]));
  return rows
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    .map((r) => {
      const t = tMap.get(r.tutorId);
      return {
        ...r,
        student: sMap.get(r.studentId) ?? null,
        tutor: t ? { ...t, rating: Number(t.rating) } : null,
      };
    });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  const tutorId = url.searchParams.get("tutorId");

  let rows = await db.select().from(bookings).orderBy(asc(bookings.scheduledAt));
  if (studentId) rows = rows.filter((b) => b.studentId === Number(studentId));
  if (tutorId) rows = rows.filter((b) => b.tutorId === Number(tutorId));
  if (!studentId && !tutorId) rows = rows.slice(0, 80);
  return Response.json(await withNames(rows));
}

export async function POST(req: Request) {
  const b = await req.json();

  if (b.action === "cancel") {
    const [row] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, Number(b.id)))
      .returning();
    return Response.json(row ? { ok: true, booking: row } : { ok: false });
  }
  if (b.action === "reschedule") {
    const [row] = await db
      .update(bookings)
      .set({ scheduledAt: new Date(b.scheduledAt), status: "upcoming" })
      .where(eq(bookings.id, Number(b.id)))
      .returning();
    return Response.json(row ? { ok: true, booking: row } : { ok: false });
  }

  const ref = `JS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const [row] = await db
    .insert(bookings)
    .values({
      ref,
      studentId: Number(b.studentId),
      tutorId: Number(b.tutorId),
      subject: String(b.subject),
      kind: b.kind === "group" ? "group" : "1on1",
      scheduledAt: new Date(b.scheduledAt),
      durationMin: Number(b.durationMin ?? 30),
      price: Number(b.price ?? 0),
      status: "upcoming",
      notes: b.notes ?? null,
    })
    .returning();
  const full = (await withNames([row]))[0];
  return Response.json(full, { status: 201 });
}
