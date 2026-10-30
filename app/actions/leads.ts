"use server";

import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { emit } from "@/lib/jev/engine";
import { nowTs } from "@/lib/time";
import type { FormState } from "@/components/client";

const KIND: Record<string, (typeof s.leads.$inferInsert)["kind"]> = {
  group: "enquiry",
  "golden-glove": "search_brief",
  talent: "hiring",
  exh1b: "eor",
  trustcircle: "outplacement",
  advisory: "advisory",
};

/** Every website form in the group writes here: one leads table, routed by Jev. */
export async function submitLead(_: FormState, f: FormData): Promise<FormState> {
  const brandSlug = String(f.get("brand") ?? "group");
  const interest = String(f.get("interest") ?? "");
  const target = interest || brandSlug;
  const brand = db.select().from(s.brands).where(eq(s.brands.slug, target)).get() ?? db.select().from(s.brands).where(eq(s.brands.slug, "group")).get()!;
  const name = String(f.get("name") ?? "").trim();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  if (!name) return { error: "Please tell us your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email address." };
  const kind = (String(f.get("kind") ?? "") as (typeof s.leads.$inferInsert)["kind"]) || KIND[brand.slug] || "enquiry";
  const lead = db
    .insert(s.leads)
    .values({
      brandId: brand.id,
      kind,
      name,
      email,
      phone: String(f.get("phone") ?? "") || null,
      company: String(f.get("company") ?? "") || null,
      roleTitle: String(f.get("role") ?? "") || null,
      message: String(f.get("message") ?? "") || null,
      status: "new",
      source: `website:${brandSlug}`,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    })
    .returning()
    .get();
  await emit({ type: "lead.created", leadId: lead.id });
  return { ok: true, message: brand.slug === "golden-glove" ? "Thank you. A partner will be in touch within one business day." : "Thank you — we'll reply within one business day." };
}
