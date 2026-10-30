"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { signIn, homeFor } from "@/lib/auth";
import { db, schema as s } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { nowTs } from "@/lib/time";
import type { FormState } from "@/components/client";

export async function loginAction(_: FormState, f: FormData): Promise<FormState> {
  const email = String(f.get("email") ?? "");
  const password = String(f.get("password") ?? "");
  const next = String(f.get("next") ?? "");
  const remember = f.get("rememberShown") ? f.get("remember") === "on" : true;
  const u = await signIn(email, password, remember);
  if (!u) return { error: "That email and password don't match an account." };
  const brand = u.brandId ? db.select().from(s.brands).where(eq(s.brands.id, u.brandId)).get() : null;
  redirect(next && next.startsWith("/") ? next : homeFor({ role: u.role, brandSlug: brand?.slug }));
}

/**
 * ExH1B sign-up with identity resolution: if this email already exists in the
 * group database (e.g. a Benchmark Talent applicant), the new member account
 * links to that same person instead of creating a duplicate.
 */
export async function exh1bSignupAction(_: FormState, f: FormData): Promise<FormState> {
  const first = String(f.get("firstName") ?? "").trim();
  const last = String(f.get("lastName") ?? "").trim();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const password = String(f.get("password") ?? "");
  const consentShare = f.get("groupSharing") === "on";
  const consentAi = f.get("aiMatching") === "on";
  if (!first || !last || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter your name and a valid email." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  if (db.select().from(s.users).where(eq(s.users.email, email)).get()) return { error: "An account with this email already exists. Sign in instead." };
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  let person = db.select().from(s.people).where(eq(s.people.email, email)).get();
  if (!person) {
    person = db.insert(s.people).values({ firstName: first, lastName: last, email, sourceBrandId: ex.id, stepsSaved: [], createdAt: nowTs(), updatedAt: nowTs() }).returning().get();
  }
  db.insert(s.personBrands).values({ personId: person.id, brandId: ex.id, relationship: "member", since: nowTs() }).onConflictDoNothing().run();
  db.insert(s.consents).values([
    { personId: person.id, purpose: "ai_matching", granted: consentAi, source: "exh1b signup", capturedAt: nowTs() },
    { personId: person.id, purpose: "group_sharing", granted: consentShare, source: "exh1b signup", capturedAt: nowTs() },
  ]).run();
  db.insert(s.users).values({ email, name: `${first} ${last}`, passwordHash: hashPassword(password), role: "candidate", brandId: ex.id, personId: person.id }).run();
  await signIn(email, password);
  redirect("/exh1b/profile?step=1&welcome=1");
}
