import { db } from "@/db";
import { messages } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json();
  await db.insert(messages).values({
    name: String(b.name || "Visitor"),
    email: String(b.email || ""),
    topic: String(b.topic || "general"),
    body: String(b.message || ""),
  });
  return Response.json({ ok: true });
}
