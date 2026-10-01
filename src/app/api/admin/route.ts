import { db } from "@/db";
import {
  bookings,
  students,
  tutors,
  groupClasses,
  lessons,
  payments,
  lessonProgress,
} from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const [sts, tuts, cls, lsn, bks, pays, lp] = await Promise.all([
    db.select().from(students),
    db.select().from(tutors),
    db.select().from(groupClasses),
    db.select().from(lessons),
    db.select().from(bookings),
    db.select().from(payments),
    db.select().from(lessonProgress),
  ]);

  const sMap = new Map(sts.map((s) => [s.id, s]));
  const tMap = new Map(tuts.map((t) => [t.id, t]));

  const now = new Date();
  const bookingsFull = bks
    .map((b) => ({
      ...b,
      student: sMap.get(b.studentId) ?? null,
      tutor: tMap.get(b.tutorId)
        ? { ...tMap.get(b.tutorId)!, rating: Number(tMap.get(b.tutorId)!.rating) }
        : null,
    }))
    .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  // weekly sessions (next 7 days)
  const weekly: { label: string; value: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const count = bks.filter((b) => {
      const s = new Date(b.scheduledAt);
      return (
        s.toDateString() === d.toDateString() && b.status === "upcoming"
      );
    }).length;
    weekly.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: count,
    });
  }

  // revenue by month (last 5 months incl. current)
  const months: { label: string; value: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = pays
      .filter((p) => {
        const x = new Date(p.date);
        return (
          x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth()
        );
      })
      .reduce((a, p) => a + p.amount, 0);
    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      value: val,
    });
  }

  const bySubject = ["reading", "math", "spelling", "science", "english"]
    .map((s) => ({
      subject: s,
      lessons: lsn.filter((l) => l.subject === s).length,
      sessions: bks.filter((b) => b.subject === s).length,
      revenue: pays.filter((p) => p.label.toLowerCase().includes(s)).reduce((a, p) => a + p.amount, 0),
    }));

  const byLevel = [
    { level: "Elementary", students: sts.filter((s) => s.grade <= 5).length },
    { level: "Middle", students: sts.filter((s) => s.grade >= 6 && s.grade <= 8).length },
    { level: "High", students: sts.filter((s) => s.grade >= 9).length },
  ];

  const classesFull = cls.map((c) => ({
    ...c,
    tutor: tMap.get(c.tutorId) ? { ...tMap.get(c.tutorId)!, rating: Number(tMap.get(c.tutorId)!.rating) } : null,
  }));

  const avgProgress =
    lp.length > 0 ? Math.round(lp.reduce((a, p) => a + p.percent, 0) / lp.length) : 0;

  return Response.json({
    counts: {
      students: sts.length,
      tutors: tuts.length,
      classes: cls.length,
      lessons: lsn.length,
      sessionsWeek: weekly.reduce((a, w) => a + w.value, 0),
      revenueTotal: pays.reduce((a, p) => a + p.amount, 0),
      avgProgress,
    },
    students: sts,
    tutors: tuts.map((t) => ({ ...t, rating: Number(t.rating) })),
    classes: classesFull,
    lessons: lsn,
    bookings: bookingsFull,
    payments: pays.sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    weekly,
    months,
    bySubject,
    byLevel,
  });
}
