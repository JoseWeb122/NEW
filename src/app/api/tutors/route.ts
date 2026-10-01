import { db } from "@/db";
import { tutors } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject");
  const level = url.searchParams.get("level");
  const grade = url.searchParams.get("grade");
  const format = url.searchParams.get("format");
  const day = url.searchParams.get("day");
  const q = (url.searchParams.get("q") || "").toLowerCase();
  const sort = url.searchParams.get("sort") || "rating";

  let rows = await db.select().from(tutors);

  if (subject) rows = rows.filter((t) => t.subjects.includes(subject));
  if (level) {
    if (level === "elementary") rows = rows.filter((t) => t.gradeMax >= 0 && t.gradeMin <= 5);
    if (level === "middle") rows = rows.filter((t) => t.gradeMin <= 8 && t.gradeMax >= 6);
    if (level === "high") rows = rows.filter((t) => t.gradeMax >= 9);
  }
  if (grade) {
    const g = Number(grade);
    rows = rows.filter((t) => t.gradeMin <= g && t.gradeMax >= g);
  }
  if (format) rows = rows.filter((t) => t.formats.includes(format));
  if (day) rows = rows.filter((t) => t.days.includes(day));
  if (q) {
    rows = rows.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.includes(q))
    );
  }

  const mapped = rows.map((t) => ({ ...t, rating: Number(t.rating) }));
  mapped.sort((a, b) =>
    sort === "experience" ? b.experienceYears - a.experienceYears : b.rating - a.rating
  );
  return Response.json(mapped);
}

export async function POST(req: Request) {
  const b = await req.json();
  const [row] = await db
    .insert(tutors)
    .values({
      name: String(b.name || "New Tutor"),
      slug: String(b.slug || b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: String(b.title || "Academy Tutor"),
      photo: b.photo ?? null,
      subjects: b.subjects || ["math"],
      gradeMin: Number(b.gradeMin ?? 0),
      gradeMax: Number(b.gradeMax ?? 12),
      bio: String(b.bio || "Newly joined the JS Tutoring Academy team."),
      approach: String(b.approach || "Structured, encouraging, and student-centered."),
      qualifications: b.qualifications || ["Academy trained"],
      experienceYears: Number(b.experienceYears ?? 1),
      rating: "4.5",
      reviewCount: 0,
      rate30: Number(b.rate30 ?? 26),
      rate60: Number(b.rate60 ?? 48),
      formats: b.formats || ["1on1"],
      days: b.days || ["Mon", "Tue", "Wed"],
      slotStart: 15,
      slotEnd: 20,
    })
    .returning();
  return Response.json(row, { status: 201 });
}
