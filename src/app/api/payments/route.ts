import { db } from "@/db";
import { payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  let rows = await db.select().from(payments).orderBy(desc(payments.date));
  if (studentId) rows = rows.filter((p) => p.studentId === Number(studentId));
  if (!studentId) rows = rows.slice(0, 100);
  return Response.json(rows);
}

export async function POST(req: Request) {
  const b = await req.json();
  const [row] = await db
    .insert(payments)
    .values({
      invoiceNo: b.invoiceNo
        ? String(b.invoiceNo)
        : `INV-${2600 + Math.floor(Math.random() * 900)}`,
      studentId: Number(b.studentId),
      label: String(b.label || "Tutoring session"),
      type: String(b.type ?? "session"),
      amount: Number(b.amount ?? 0),
      status: "paid",
    })
    .returning();
  void eq;
  return Response.json(row, { status: 201 });
}
