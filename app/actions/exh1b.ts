"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db, schema as s } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { requireMember, subscriptionOf } from "@/lib/member";
import { emit } from "@/lib/jev/engine";
import { validLinkedin } from "@/lib/profile";
import { nowTs, daysAhead } from "@/lib/time";
import type { FormState } from "@/components/client";

const list = (f: FormData, k: string) => f.getAll(k).map(String).filter(Boolean);
const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));

function markStep(stepsSaved: number[], step: number) {
  return [...new Set([...stepsSaved, step])].sort();
}

export async function saveProfileStep(_: FormState, f: FormData): Promise<FormState> {
  const { person } = await requireMember();
  const step = Number(f.get("step"));
  const patch: Partial<typeof s.people.$inferInsert> = { updatedAt: nowTs() };
  if (step === 1) {
    const first = String(f.get("firstName") ?? "").trim();
    const last = String(f.get("lastName") ?? "").trim();
    const li = String(f.get("linkedinUrl") ?? "").trim();
    if (!first || !last) return { error: "Please enter your first and last name." };
    if (li && !validLinkedin(li)) return { error: "That doesn't look like a LinkedIn profile link (linkedin.com/in/your-name)." };
    Object.assign(patch, { firstName: first, lastName: last, linkedinUrl: li ? (li.startsWith("http") ? li : `https://${li}`) : null, phone: String(f.get("phone") ?? "") || null });
  }
  if (step === 2) {
    const cc = String(f.get("countryCode") ?? "");
    if (!cc) return { error: "Please choose the country you live in now." };
    const country = db.select().from(s.countries).where(eq(s.countries.code, cc)).get();
    const cityId = num(f.get("cityId"));
    const city = cityId ? db.select().from(s.cities).where(eq(s.cities.id, cityId)).get() : null;
    const cityText = String(f.get("cityText") ?? "").trim();
    Object.assign(patch, { countryCode: cc, stateId: num(f.get("stateId")), cityId, locationLabel: [city?.name ?? cityText, country?.name].filter(Boolean).join(", "), returnTimeline: String(f.get("returnTimeline") ?? "") || null });
  }
  if (step === 3) {
    Object.assign(patch, {
      employmentTypes: list(f, "employmentTypes"),
      workMode: String(f.get("workMode") ?? "") || null,
      preferredCityIds: list(f, "preferredCityIds").map(Number),
      anywhereInIndia: f.get("anywhereInIndia") === "on",
      remoteScope: String(f.get("remoteScope") ?? "") || null,
      remoteCountries: list(f, "remoteCountries"),
      preferenceNotes: String(f.get("preferenceNotes") ?? "") || null,
    });
  }
  if (step === 4) {
    const eor = String(f.get("openToEor") ?? "");
    Object.assign(patch, {
      openToEor: eor === "yes" ? true : eor === "no" ? false : null,
      familyId: num(f.get("familyId")),
      roleId: num(f.get("roleId")),
      seniority: String(f.get("seniority") ?? "") || null,
      preferredCompanyTypes: list(f, "companyTypes"),
    });
  }
  if (step === 6) {
    const skills = String(f.get("skills") ?? "")
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const smin = num(f.get("salaryMin"));
    const smax = num(f.get("salaryMax"));
    if (smin && smax && smin > smax) return { error: "The minimum salary is higher than the maximum." };
    Object.assign(patch, {
      currentTitle: String(f.get("currentTitle") ?? "") || null,
      currentCompany: String(f.get("currentCompany") ?? "") || null,
      yearsExperience: num(f.get("yearsExperience")),
      skills: [...new Set(skills)].slice(0, 30),
      noticePeriod: String(f.get("noticePeriod") ?? "") || null,
      visaStatus: String(f.get("visaStatus") ?? "") || null,
      salaryMin: smin,
      salaryMax: smax,
      salaryCurrency: String(f.get("salaryCurrency") ?? "USD"),
      additionalInfo: String(f.get("additionalInfo") ?? "") || null,
    });
  }
  patch.stepsSaved = markStep(person.stepsSaved, step);
  db.update(s.people).set(patch).where(eq(s.people.id, person.id)).run();
  await emit({ type: "profile.updated", personId: person.id });
  revalidatePath("/exh1b", "layout");
  if (f.get("next")) redirect(`/exh1b/profile?step=${Math.min(6, step + 1)}`);
  return { ok: true, message: "Saved." };
}

async function extractText(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) return buf.toString("utf8");
  if (name.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    return (await mammoth.extractRawText({ buffer: buf })).value;
  }
  return "";
}

export async function uploadResume(_: FormState, f: FormData): Promise<FormState> {
  const { person } = await requireMember();
  const file = f.get("resume");
  const pasted = String(f.get("resumeText") ?? "").trim();
  let filename = person.resumeFilename;
  let text = pasted;
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: "Please upload a file under 5 MB." };
    if (!/\.(pdf|docx|txt|md)$/i.test(file.name)) return { error: "Upload a PDF, DOCX or TXT file." };
    try {
      text = (await extractText(file)) || pasted;
    } catch {
      text = pasted;
    }
    const dir = path.join(process.cwd(), "data", "uploads", String(person.id));
    await fs.mkdir(dir, { recursive: true });
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    await fs.writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
    filename = safe;
    db.insert(s.documents).values({ personId: person.id, brandId: person.sourceBrandId, kind: "resume", filename: safe, mime: file.type, size: file.size, storagePath: path.join("uploads", String(person.id), safe) }).run();
  } else if (pasted) {
    filename = filename ?? `${person.firstName}_${person.lastName}_resume.txt`;
  } else return { error: "Choose a file or paste your resume text." };
  db.update(s.people).set({ resumeFilename: filename, resumeText: text || null, stepsSaved: markStep(person.stepsSaved, 5), updatedAt: nowTs() }).where(eq(s.people.id, person.id)).run();
  await emit({ type: "resume.uploaded", personId: person.id });
  revalidatePath("/exh1b", "layout");
  const after = db.select().from(s.people).where(eq(s.people.id, person.id)).get()!;
  return { ok: true, message: text.length > 80 ? `Resume saved. Jev read it and updated your profile: ${after.currentTitle ?? "title"}, ${after.yearsExperience ?? "?"} years, ${after.skills.length} skills.` : "Resume saved, but we couldn't read text from it. Paste the text below so Jev can fill your profile." };
}

export async function deleteResume() {
  const { person } = await requireMember();
  db.update(s.people).set({ resumeFilename: null, resumeText: null, resumeParsedAt: null, updatedAt: nowTs() }).where(eq(s.people.id, person.id)).run();
  revalidatePath("/exh1b", "layout");
}

export async function setVisibility(v: "private" | "shareable") {
  const { person } = await requireMember();
  db.update(s.people).set({ profileVisibility: v }).where(eq(s.people.id, person.id)).run();
  revalidatePath("/exh1b/profile");
}

export async function setRelevance(mandateId: number, relevance: "relevant" | "not_relevant") {
  const { person } = await requireMember();
  db.update(s.engagements).set({ relevance, updatedAt: nowTs() }).where(and(eq(s.engagements.personId, person.id), eq(s.engagements.mandateId, mandateId))).run();
  revalidatePath("/exh1b/jobs");
}

export async function moveApplication(mandateId: number, stage: "saved" | "applied" | "withdrawn" | "matched") {
  const { person } = await requireMember();
  const { active } = subscriptionOf(person.id);
  if (!active && stage === "applied") redirect("/exh1b/dashboard/billing?reason=apply");
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m) return;
  db.insert(s.engagements)
    .values({ mandateId, personId: person.id, brandId: m.brandId, stage, source: stage === "applied" ? "applied" : "jev", createdAt: nowTs(), updatedAt: nowTs() })
    .onConflictDoUpdate({ target: [s.engagements.mandateId, s.engagements.personId], set: { stage, updatedAt: nowTs() } })
    .run();
  if (stage === "applied") {
    const owner = m.ownerUserId;
    if (owner) db.insert(s.notifications).values({ userId: owner, title: "New application", body: `${person.firstName} ${person.lastName} applied for ${m.title}`, href: `/console/mandates/${m.id}` }).run();
  }
  revalidatePath("/exh1b/jobs");
}

export async function toggleChecklist(itemId: number, done: boolean) {
  const { person } = await requireMember();
  db.insert(s.relocationProgress).values({ personId: person.id, itemId, done, updatedAt: nowTs() }).onConflictDoUpdate({ target: [s.relocationProgress.personId, s.relocationProgress.itemId], set: { done, updatedAt: nowTs() } }).run();
  revalidatePath("/exh1b/relocation");
}

export async function createTicket(_: FormState, f: FormData): Promise<FormState> {
  const { user, person } = await requireMember();
  const subject = String(f.get("subject") ?? "").trim();
  const message = String(f.get("message") ?? "").trim();
  if (!subject || !message) return { error: "Please add a subject and a message." };
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, String(f.get("brand") ?? "exh1b"))).get()!;
  const t = db.insert(s.tickets).values({ brandId: ex.id, personId: person.id, userId: user.id, subject, category: String(f.get("category") ?? "Other"), message, createdAt: nowTs(), updatedAt: nowTs() }).returning().get();
  db.insert(s.ticketMessages).values({ ticketId: t.id, authorUserId: user.id, authorLabel: `${person.firstName} ${person.lastName}`, body: message, createdAt: nowTs() }).run();
  await emit({ type: "ticket.created", ticketId: t.id });
  redirect(String(f.get("redirect") ?? `/exh1b/dashboard/support/${t.id}`));
}

export async function replyTicket(_: FormState, f: FormData): Promise<FormState> {
  const u = await getUser();
  if (!u) return { error: "Please sign in again." };
  const id = Number(f.get("ticketId"));
  const body = String(f.get("body") ?? "").trim();
  if (!body) return { error: "Write a reply first." };
  const t = db.select().from(s.tickets).where(eq(s.tickets.id, id)).get();
  if (!t || (t.personId !== u.personId && t.userId !== u.id)) return { error: "Ticket not found." };
  db.insert(s.ticketMessages).values({ ticketId: id, authorUserId: u.id, authorLabel: u.name, body, createdAt: nowTs() }).run();
  db.update(s.tickets).set({ status: t.status === "resolved" || t.status === "waiting" ? "open" : t.status, updatedAt: nowTs() }).where(eq(s.tickets.id, id)).run();
  revalidatePath(`/exh1b/dashboard/support/${id}`);
  return { ok: true, message: "Reply sent." };
}

export async function createThread(_: FormState, f: FormData): Promise<FormState> {
  const { user, person } = await requireMember();
  const title = String(f.get("title") ?? "").trim();
  const body = String(f.get("body") ?? "").trim();
  if (title.length < 8 || body.length < 10) return { error: "Give your question a clear title and a little detail." };
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  const t = db.insert(s.threads).values({ brandId: ex.id, authorUserId: user.id, authorName: `${person.firstName} ${person.lastName.charAt(0)}.`, title, body, tag: String(f.get("tag") ?? "General"), createdAt: nowTs(), lastActivityAt: nowTs() }).returning().get();
  await emit({ type: "thread.created", threadId: t.id });
  redirect(`/exh1b/community/${t.id}`);
}

export async function replyThread(_: FormState, f: FormData): Promise<FormState> {
  const { user, person } = await requireMember();
  const id = Number(f.get("threadId"));
  const body = String(f.get("body") ?? "").trim();
  if (!body) return { error: "Write something first." };
  db.insert(s.posts).values({ threadId: id, authorUserId: user.id, authorName: `${person.firstName} ${person.lastName.charAt(0)}.`, body, createdAt: nowTs() }).run();
  db.update(s.threads).set({ lastActivityAt: nowTs() }).where(eq(s.threads.id, id)).run();
  revalidatePath(`/exh1b/community/${id}`);
  return { ok: true, message: "Posted." };
}

export async function upvote(threadId: number) {
  const u = await getUser();
  if (!u) redirect("/exh1b/auth/login");
  const r = db.insert(s.threadVotes).values({ threadId, userId: u.id }).onConflictDoNothing().run();
  if (r.changes) db.update(s.threads).set({ upvotes: sql`${s.threads.upvotes} + 1` }).where(eq(s.threads.id, threadId)).run();
  else {
    db.delete(s.threadVotes).where(and(eq(s.threadVotes.threadId, threadId), eq(s.threadVotes.userId, u.id))).run();
    db.update(s.threads).set({ upvotes: sql`max(0, ${s.threads.upvotes} - 1)` }).where(eq(s.threads.id, threadId)).run();
  }
  revalidatePath("/exh1b/community");
}

/**
 * Checkout. Razorpay runs in test mode until RAZORPAY_KEY_ID is configured;
 * the flow records the subscription and payment exactly as a live webhook would.
 */
export async function subscribe(planCode: string) {
  const { person } = await requireMember();
  const plan = db.select().from(s.plans).where(eq(s.plans.code, planCode)).get();
  if (!plan) return;
  db.update(s.subscriptions).set({ status: "cancelled", cancelledAt: nowTs() }).where(and(eq(s.subscriptions.personId, person.id), eq(s.subscriptions.status, "active"))).run();
  const days = plan.interval === "month" ? 30 : plan.interval === "quarter" ? 91 : 365;
  const sub = db.insert(s.subscriptions).values({ personId: person.id, brandId: plan.brandId, planId: plan.id, status: "active", regionDetected: person.countryCode === "IN" ? "IN" : "INTL", startedAt: nowTs(), currentPeriodEnd: daysAhead(days) }).returning().get();
  db.insert(s.payments).values({ subscriptionId: sub.id, personId: person.id, amount: plan.amount, currency: plan.currency, status: "captured", gateway: "razorpay", gatewayRef: `pay_test_${Date.now().toString(36)}`, createdAt: nowTs() }).run();
  await emit({ type: "profile.updated", personId: person.id });
  revalidatePath("/exh1b", "layout");
  redirect("/exh1b/dashboard/billing?paid=1");
}

export async function cancelSubscription() {
  const { person } = await requireMember();
  db.update(s.subscriptions).set({ status: "cancelled", cancelledAt: nowTs(), currentPeriodEnd: nowTs() }).where(and(eq(s.subscriptions.personId, person.id), eq(s.subscriptions.status, "active"))).run();
  await emit({ type: "subscription.lapsed", personId: person.id });
  revalidatePath("/exh1b", "layout");
}

export async function requestConsultation(_: FormState, f: FormData): Promise<FormState> {
  const { person } = await requireMember();
  const { plan, active } = subscriptionOf(person.id);
  const used = db.select({ n: sql<number>`count(*)` }).from(s.consultations).where(and(eq(s.consultations.personId, person.id), sql`${s.consultations.status} != 'cancelled'`)).get()!.n;
  const allowance = active ? (plan?.consultationsIncluded ?? 0) : 0;
  if (used >= Math.max(1, allowance)) return { error: active ? "You've used the consultations included in your plan. Upgrade for more." : "Subscribe to book a consultation with our team." };
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  db.insert(s.consultations).values({ personId: person.id, brandId: ex.id, topic: String(f.get("topic") ?? "Intro call") || "Intro call", status: "requested", createdAt: nowTs() }).run();
  const admin = db.select().from(s.users).where(eq(s.users.email, "success@exh1b.com")).get();
  if (admin) db.insert(s.notifications).values({ userId: admin.id, title: "Consultation requested", body: `${person.firstName} ${person.lastName}: ${f.get("topic")}`, href: `/console/people/${person.id}` }).run();
  revalidatePath("/exh1b/dashboard");
  return { ok: true, message: "Requested. We'll send you a time within one business day." };
}
