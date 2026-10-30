"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db, schema as s } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { emit } from "@/lib/jev/engine";
import { extractText } from "@/lib/jev/extract";
import { audit } from "@/lib/queries";
import { addHours, nowTs } from "@/lib/time";
import type { FormState } from "@/components/client";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const validEmail = (e: string) => /^\S+@\S+\.\S+$/.test(e);
const brandId = (slug: string) => db.select({ id: s.brands.id }).from(s.brands).where(eq(s.brands.slug, slug)).get()!.id;

function notify(userId: number | null | undefined, title: string, body: string, href: string) {
  if (userId) db.insert(s.notifications).values({ userId, title, body, href, createdAt: nowTs() }).run();
}

/** Identity resolution: one person per email across the whole group. */
function resolvePerson(email: string, first: string, last: string, source: number, patch: Partial<typeof s.people.$inferInsert> = {}) {
  const existing = db.select().from(s.people).where(eq(s.people.email, email)).get();
  if (existing) {
    const fill: Partial<typeof s.people.$inferInsert> = { updatedAt: nowTs() };
    for (const [k, v] of Object.entries(patch)) if (v != null && v !== "" && (existing as Record<string, unknown>)[k] == null) (fill as Record<string, unknown>)[k] = v;
    db.update(s.people).set(fill).where(eq(s.people.id, existing.id)).run();
    return { person: existing, existed: true };
  }
  const person = db.insert(s.people).values({ firstName: first, lastName: last, email, sourceBrandId: source, ...patch, createdAt: nowTs(), updatedAt: nowTs() }).returning().get();
  return { person, existed: false };
}

/* ───── client decisions on a shortlist (Golden Glove, Talent) ───── */

export async function clientDecision(_: FormState, f: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u || u.role !== "client") return { error: "Please sign in." };
  const e = db.select().from(s.engagements).where(eq(s.engagements.id, Number(f.get("engagementId")))).get();
  const m = e ? db.select().from(s.mandates).where(eq(s.mandates.id, e.mandateId)).get() : null;
  if (!e || !m || m.orgId !== u.orgId) return { error: "You can't change this candidate." };
  const decision = str(f, "decision") as "interested" | "declined";
  const note = str(f, "note");
  db.update(s.engagements)
    .set({ clientDecision: decision, updatedAt: nowTs(), ...(decision === "interested" && e.stage === "shortlisted" ? { stage: "interview" as const } : {}) })
    .where(eq(s.engagements.id, e.id))
    .run();
  const p = db.select().from(s.people).where(eq(s.people.id, e.personId)).get()!;
  db.insert(s.interactions).values({ personId: e.personId, mandateId: m.id, brandId: m.brandId, userId: u.id, kind: "note", summary: `Client ${decision === "interested" ? "wants to meet" : "declined"}${note ? `: “${note}”` : ""}`, occurredAt: nowTs() }).run();
  notify(m.ownerUserId, decision === "interested" ? "Client wants to meet a candidate" : "Client declined a candidate", `${u.name} on ${p.firstName} ${p.lastName} for ${m.title}${note ? ` — “${note}”` : ""}`, `/console/mandates/${m.id}`);
  audit(u, `client.${decision}`, "engagement", e.id, m.brandId, note);
  revalidatePath("/", "layout");
  return { ok: true, message: decision === "interested" ? "Noted. Your partner will set up the meeting." : "Noted. Thank you for the feedback." };
}

export async function clientMessage(_: FormState, f: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u || (u.role !== "client" && u.role !== "participant")) return { error: "Please sign in." };
  const body = str(f, "body");
  if (!body) return { error: "Write a message first." };
  const mandateId = Number(f.get("mandateId")) || null;
  const m = mandateId ? db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get() : null;
  if (m && u.role === "client" && m.orgId !== u.orgId) return { error: "No access." };
  const t = db
    .insert(s.tickets)
    .values({ brandId: u.brandId!, personId: u.personId, userId: u.id, subject: str(f, "subject") || (m ? `Message about ${m.title}` : "Message from portal"), category: u.role === "client" ? "Client" : "Participant", message: body, status: "open", priority: "normal", createdAt: nowTs(), updatedAt: nowTs() })
    .returning()
    .get();
  await emit({ type: "ticket.created", ticketId: t.id });
  if (m) notify(m.ownerUserId, `Message from ${u.name}`, body.slice(0, 120), `/console/tickets?id=${t.id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Sent. You'll get a reply within one business day." };
}

/* ───── Golden Glove: register in confidence ───── */

export async function registerExecutive(_: FormState, f: FormData): Promise<FormState> {
  const first = str(f, "firstName");
  const last = str(f, "lastName");
  const email = str(f, "email").toLowerCase();
  if (!first || !last || !validEmail(email)) return { error: "Please give your name and a valid email." };
  if (f.get("consent") !== "on") return { error: "Please confirm we may hold your details in confidence." };
  const gg = brandId("golden-glove");
  const { person, existed } = resolvePerson(email, first, last, gg, {
    phone: str(f, "phone") || null,
    currentTitle: str(f, "title") || null,
    currentCompany: str(f, "company") || null,
    linkedinUrl: str(f, "linkedin") || null,
    seniority: str(f, "seniority") || "Leadership",
    yearsExperience: Number(f.get("years")) || null,
    additionalInfo: str(f, "note") || null,
    isExecutive: true,
    locationLabel: str(f, "city") || null,
    countryCode: "IN",
    profileVisibility: "private",
  });
  db.update(s.people).set({ isExecutive: true }).where(eq(s.people.id, person.id)).run();
  db.insert(s.personBrands).values({ personId: person.id, brandId: gg, relationship: "executive", since: nowTs() }).onConflictDoNothing().run();
  db.insert(s.consents).values([
    { personId: person.id, purpose: "ai_matching", granted: true, source: "golden glove confidential registration", capturedAt: nowTs() },
    { personId: person.id, purpose: "group_sharing", granted: f.get("share") === "on", source: "golden glove confidential registration", capturedAt: nowTs() },
  ]).run();
  const fam = str(f, "familyId");
  if (fam) db.update(s.people).set({ familyId: Number(fam) }).where(eq(s.people.id, person.id)).run();
  const partner = db.select().from(s.users).where(eq(s.users.email, "partner@goldenglove.in")).get();
  db.insert(s.interactions).values({ personId: person.id, brandId: gg, userId: null, kind: "system", summary: "Registered in confidence on the Golden Glove website", occurredAt: nowTs() }).run();
  notify(partner?.id, "Executive registered in confidence", `${first} ${last}${str(f, "title") ? `, ${str(f, "title")}` : ""}`, `/console/people/${person.id}`);
  await emit({ type: "profile.updated", personId: person.id });
  return { ok: true, message: `Thank you, ${first}. Your details are held privately by Golden Glove's partners${existed ? " and linked to your existing Benchmark record" : ""}. We'll be in touch only about roles that fit.` };
}

/* ───── Benchmark Talent: apply to a role ───── */

export async function applyToRole(_: FormState, f: FormData): Promise<FormState> {
  const mandateId = Number(f.get("mandateId"));
  const m = db.select().from(s.mandates).where(and(eq(s.mandates.id, mandateId), eq(s.mandates.status, "open"))).get();
  if (!m) return { error: "This role is no longer open." };
  const first = str(f, "firstName");
  const last = str(f, "lastName");
  const email = str(f, "email").toLowerCase();
  if (!first || !last || !validEmail(email)) return { error: "Please give your name and a valid email." };
  const tal = brandId("talent");
  const file = f.get("resume") as File | null;
  let resume: { filename: string; text: string; storage: string; mime: string; size: number } | null = null;
  if (file && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "Please keep the CV under 5 MB." };
    const buf = Buffer.from(await file.arrayBuffer());
    const safe = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    await fs.mkdir(path.join(process.cwd(), "data", "uploads"), { recursive: true });
    await fs.writeFile(path.join(process.cwd(), "data", "uploads", safe), buf);
    resume = { filename: file.name, text: await extractText(buf, file.name, file.type), storage: `uploads/${safe}`, mime: file.type, size: file.size };
  }
  const { person, existed } = resolvePerson(email, first, last, tal, {
    phone: str(f, "phone") || null,
    currentTitle: str(f, "title") || null,
    currentCompany: str(f, "company") || null,
    linkedinUrl: str(f, "linkedin") || null,
    noticePeriod: str(f, "notice") || null,
    countryCode: "IN",
  });
  if (resume) {
    db.update(s.people).set({ resumeFilename: resume.filename, resumeText: resume.text, updatedAt: nowTs() }).where(eq(s.people.id, person.id)).run();
    db.insert(s.documents).values({ personId: person.id, brandId: tal, kind: "resume", filename: resume.filename, mime: resume.mime, size: resume.size, storagePath: resume.storage }).run();
  }
  db.insert(s.personBrands).values({ personId: person.id, brandId: tal, relationship: "candidate", since: nowTs() }).onConflictDoNothing().run();
  db.insert(s.consents).values({ personId: person.id, purpose: "ai_matching", granted: true, source: "talent application", capturedAt: nowTs() }).run();
  if (f.get("share") === "on") db.insert(s.consents).values({ personId: person.id, purpose: "group_sharing", granted: true, source: "talent application", capturedAt: nowTs() }).run();
  const res = db.insert(s.engagements).values({ mandateId, personId: person.id, brandId: m.brandId, stage: "applied", source: "applied", notes: str(f, "note") || null, createdAt: nowTs(), updatedAt: nowTs() }).onConflictDoNothing().run();
  if (!res.changes) return { ok: true, message: "You've already applied to this role. We'll be in touch." };
  if (resume) await emit({ type: "resume.uploaded", personId: person.id });
  else await emit({ type: "profile.updated", personId: person.id });
  // score the application so the recruiter sees fit at a glance
  const { scoreMatch } = await import("@/lib/jev/match");
  const { asMatchPerson, asMatchMandate } = await import("@/lib/jev/engine");
  const fresh = db.select().from(s.people).where(eq(s.people.id, person.id)).get()!;
  const sc = scoreMatch(asMatchPerson(fresh), asMatchMandate(m));
  db.update(s.engagements).set({ matchScore: sc.score, matchReasons: { reasons: sc.reasons, gaps: sc.gaps } }).where(and(eq(s.engagements.mandateId, mandateId), eq(s.engagements.personId, person.id))).run();
  notify(m.ownerUserId, "New application", `${first} ${last} for ${m.title} · Jev fit ${sc.score}%`, `/console/mandates/${m.id}`);
  audit({ name: `${first} ${last}` }, "talent.apply", "mandate", m.id, m.brandId, existed ? "existing person" : "new person");
  return { ok: true, message: `Thanks, ${first}. Your application is in${existed ? " and linked to your existing Benchmark profile" : ""}. A recruiter will reply within three business days.` };
}

/* ───── TrustCircle participant: express interest in a matched opening ───── */

export async function participantInterest(mandateId: number) {
  const u = await getUser();
  if (!u || u.role !== "participant" || !u.personId) return;
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m) return;
  db.insert(s.engagements)
    .values({ mandateId, personId: u.personId, brandId: m.brandId, stage: "applied", source: "referral", notes: "Referred from TrustCircle programme", createdAt: nowTs(), updatedAt: nowTs() })
    .onConflictDoUpdate({ target: [s.engagements.mandateId, s.engagements.personId], set: { stage: "applied", source: "referral", updatedAt: nowTs() } })
    .run();
  notify(m.ownerUserId, "TrustCircle referral", `${u.name} is interested in ${m.title}`, `/console/mandates/${m.id}`);
  const coach = db.select().from(s.users).where(eq(s.users.email, "coach@trustcircle.in")).get();
  notify(coach?.id, "Participant applied", `${u.name} → ${m.title}`, `/console/people/${u.personId}`);
  revalidatePath("/trustcircle/portal");
}

export async function requestSession(_: FormState, f: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u || u.role !== "participant" || !u.personId) return { error: "Please sign in." };
  const topic = str(f, "topic") || "Extra coaching session";
  const coach = db.select().from(s.users).where(eq(s.users.email, "coach@trustcircle.in")).get();
  const mandate = db.select().from(s.engagements).where(and(eq(s.engagements.personId, u.personId), eq(s.engagements.stage, "enrolled"))).get();
  db.insert(s.coachingSessions).values({ personId: u.personId, mandateId: mandate?.mandateId ?? null, coachUserId: coach?.id, topic, scheduledAt: addHours(72), status: "planned", notes: str(f, "note") || null }).run();
  notify(coach?.id, "Session requested", `${u.name}: ${topic}`, `/console/coaching`);
  revalidatePath("/trustcircle/portal");
  return { ok: true, message: "Requested. Your coach will confirm a time within a day." };
}
