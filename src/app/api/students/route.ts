import { db } from "@/db";
import { students, parents } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parentId = url.searchParams.get("parentId");
  const id = url.searchParams.get("id");
  let rows = await db.select().from(students);
  if (id) rows = rows.filter((s) => s.id === Number(id));
  if (parentId) rows = rows.filter((s) => s.guardianId === Number(parentId));
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const hue = 180 + Math.floor(Math.random() * 120);
  const [row] = await db
    .insert(students)
    .values({
      name: String(b.name || "New Student"),
      grade: Number(b.grade ?? 1),
      guardian: String(b.guardian || "—"),
      email: b.email ?? null,
      guardianId: b.guardianId != null ? Number(b.guardianId) : null,
      hue,
    })
    .returning();
  // keep parent list fresh
  void parents; void eq;
  return Response.json(row, { status: 201 });
}
