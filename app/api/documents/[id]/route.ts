import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { getUser, isStaff } from "@/lib/auth";
import { canSeePerson } from "@/lib/access";
import { getDataDir } from "@/lib/paths";

/** Serves an uploaded document to its owner or to staff who may see the person. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getUser();
  if (!u) return new Response("Sign in required", { status: 401 });
  const doc = db.select().from(s.documents).where(eq(s.documents.id, Number((await params).id))).get();
  if (!doc || !doc.storagePath) return new Response("Not found", { status: 404 });
  const allowed = doc.personId && (u.personId === doc.personId || (isStaff(u) && canSeePerson(u, doc.personId)));
  if (!allowed) return new Response("Forbidden", { status: 403 });
  const file = await fs.readFile(path.join(getDataDir(), doc.storagePath)).catch(() => null);
  if (!file) return new Response("File missing", { status: 404 });
  return new Response(new Uint8Array(file), { headers: { "content-type": doc.mime || "application/octet-stream", "content-disposition": `inline; filename="${doc.filename}"` } });
}
