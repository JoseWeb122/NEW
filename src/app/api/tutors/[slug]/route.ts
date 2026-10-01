import { db } from "@/db";
import { tutors, reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const [tutor] = await db.select().from(tutors).where(eq(tutors.slug, slug));
  if (!tutor) return Response.json({ error: "Tutor not found" }, { status: 404 });
  const list = await db
    .select()
    .from(reviews)
    .where(eq(reviews.tutorId, tutor.id));
  return Response.json({
    tutor: { ...tutor, rating: Number(tutor.rating) },
    reviews: list,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const b = await req.json();
  const fields: Record<string, unknown> = {};
  const allowed = [
    "name", "title", "bio", "approach", "subjects", "qualifications",
    "gradeMin", "gradeMax", "experienceYears", "rate30", "rate60",
    "formats", "days", "slotStart", "slotEnd", "photo",
  ] as const;
  for (const k of allowed) {
    if (k in b) fields[k] = b[k];
  }
  const [row] = await db.update(tutors).set(fields).where(eq(tutors.slug, slug)).returning();
  if (!row) return Response.json({ error: "Tutor not found" }, { status: 404 });
  return Response.json({ ...row, rating: Number(row.rating) });
}
