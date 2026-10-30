"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { canSeeMandate, canSeePerson, staffBrandIds } from "@/lib/access";
import { audit } from "@/lib/queries";
import { buildShortlist, draftOutreach, emit, slaSweep, suggestTicketReply } from "@/lib/jev/engine";
import { SCOPE_COOKIE } from "@/lib/console";
import { nowTs, daysAhead, addHours } from "@/lib/time";
import { EOR_STEPS, STAGES, type Stage } from "@/lib/db/schema";
import type { FormState } from "@/components/client";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => (f.get(k) === null || f.get(k) === "" ? null : Number(f.get(k)));

function mayBrand(u: Awaited<ReturnType<typeof requireStaff>>, brandId: number) {
  const ids = staffBrandIds(u);
  return !ids || ids.includes(brandId);
}

/* ───── scope ───── */

export async function setScope(slug: string) {
  await requireStaff();
  (await cookies()).set(SCOPE_COOKIE, slug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 90 });
  revalidatePath("/console", "layout");
}

/* ───── people ───── */

export async function addInteraction(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const personId = Number(f.get("personId"));
  if (!canSeePerson(u, personId)) return { error: "You don't have access to this person." };
  const summary = str(f, "summary");
  if (!summary) return { error: "Write a short note first." };
  const kind = (str(f, "kind") || "note") as "note";
  db.insert(s.interactions).values({ personId, userId: u.id, brandId: u.brandId, kind, summary, occurredAt: nowTs() }).run();
  audit(u, "interaction.add", "person", personId, u.brandId, kind);
  revalidatePath(`/console/people/${personId}`);
  return { ok: true, message: "Saved to the record." };
}

export async function addToMandate(personId: number, mandateId: number) {
  const u = await requireStaff();
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m || !canSeeMandate(u, m) || !canSeePerson(u, personId)) return;
  db.insert(s.engagements)
    .values({ mandateId, personId, brandId: m.brandId, stage: "sourced", source: "sourced", notes: `Added by ${u.name}`, createdAt: nowTs(), updatedAt: nowTs() })
    .onConflictDoNothing()
    .run();
  audit(u, "engagement.add", "mandate", mandateId, m.brandId, `person ${personId}`);
  revalidatePath(`/console/mandates/${mandateId}`);
  revalidatePath(`/console/people/${personId}`);
}

/* ───── mandates & pipeline ───── */

export async function createMandate(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const brandId = Number(f.get("brandId"));
  if (!mayBrand(u, brandId)) return { error: "You can't open mandates for that business." };
  const title = str(f, "title");
  if (!title) return { error: "Give the mandate a title." };
  const brand = db.select().from(s.brands).where(eq(s.brands.id, brandId)).get()!;
  const kind = brand.slug === "golden-glove" ? "search" : brand.slug === "trustcircle" ? "outplacement" : brand.slug === "advisory" ? "advisory" : "job";
  const cityId = num(f, "cityId");
  const city = cityId ? db.select().from(s.cities).where(eq(s.cities.id, cityId)).get() : null;
  const skills = str(f, "skills").split(",").map((x) => x.trim()).filter(Boolean);
  const m = db
    .insert(s.mandates)
    .values({
      brandId,
      orgId: num(f, "orgId"),
      kind,
      title,
      familyId: num(f, "familyId"),
      seniority: str(f, "seniority") || null,
      cityId,
      locationLabel: city ? `${city.name}, India` : str(f, "location") || null,
      countryCode: "IN",
      workMode: str(f, "workMode") || "On-site / Hybrid",
      employmentType: "Full-time",
      description: str(f, "description") || null,
      skills,
      minYears: num(f, "minYears"),
      salaryMin: num(f, "salaryMin"),
      salaryMax: num(f, "salaryMax"),
      currency: "INR",
      openings: num(f, "openings") ?? 1,
      status: "open",
      confidential: f.get("confidential") === "on",
      feeModel: kind === "search" ? "retained" : kind === "job" ? "contingent" : "fixed",
      feeAmount: num(f, "feeAmount"),
      feeCurrency: "INR",
      ownerUserId: u.id,
      openedAt: nowTs(),
      targetDate: daysAhead(60),
    })
    .returning()
    .get();
  audit(u, "mandate.create", "mandate", m.id, brandId, title);
  await emit({ type: "mandate.created", mandateId: m.id });
  redirect(`/console/mandates/${m.id}?created=1`);
}

export async function setMandateStatus(mandateId: number, status: "open" | "on_hold" | "filled" | "closed") {
  const u = await requireStaff();
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m || !canSeeMandate(u, m)) return;
  db.update(s.mandates).set({ status, closedAt: ["filled", "closed"].includes(status) ? nowTs() : null }).where(eq(s.mandates.id, mandateId)).run();
  audit(u, "mandate.status", "mandate", mandateId, m.brandId, status);
  revalidatePath(`/console/mandates/${mandateId}`);
}

export async function moveEngagement(engagementId: number, stage: Stage) {
  const u = await requireStaff();
  if (!STAGES.includes(stage)) return;
  const e = db.select().from(s.engagements).where(eq(s.engagements.id, engagementId)).get();
  if (!e) return;
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, e.mandateId)).get()!;
  if (!canSeeMandate(u, m)) return;
  db.update(s.engagements).set({ stage, updatedAt: nowTs(), ...(stage === "shortlisted" && m.kind === "search" ? { clientDecision: "pending" as const } : {}) }).where(eq(s.engagements.id, engagementId)).run();
  db.insert(s.interactions).values({ personId: e.personId, mandateId: m.id, brandId: m.brandId, userId: u.id, kind: "system", summary: `Moved to ${stage} on ${m.title}`, occurredAt: nowTs() }).run();
  audit(u, "engagement.stage", "engagement", engagementId, m.brandId, stage);
  if (stage === "placed") await emit({ type: "engagement.placed", engagementId });
  revalidatePath(`/console/mandates/${m.id}`);
}

/** Jev proposes; a person decides. */
export async function reviewProposal(engagementId: number, approve: boolean) {
  const u = await requireStaff();
  const e = db.select().from(s.engagements).where(eq(s.engagements.id, engagementId)).get();
  if (!e) return;
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, e.mandateId)).get()!;
  if (!canSeeMandate(u, m)) return;
  db.update(s.engagements)
    .set({ stage: approve ? "screening" : "rejected", notes: `${approve ? "Approved" : "Declined"} from Jev longlist by ${u.name}`, updatedAt: nowTs() })
    .where(eq(s.engagements.id, engagementId))
    .run();
  db.insert(s.jevRuns).values({ automationKey: "shortlist-builder", trigger: "human.review", entity: "engagement", entityId: engagementId, brandId: m.brandId, status: "ok", summary: `${u.name} ${approve ? "approved" : "declined"} a Jev proposal for ${m.title}`, engine: "rules", createdAt: nowTs() }).run();
  audit(u, approve ? "jev.approve" : "jev.decline", "engagement", engagementId, m.brandId, m.title);
  revalidatePath(`/console/mandates/${m.id}`);
}

export async function rerunShortlist(mandateId: number) {
  const u = await requireStaff();
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m || !canSeeMandate(u, m)) return;
  buildShortlist(mandateId);
  audit(u, "jev.shortlist", "mandate", mandateId, m.brandId);
  revalidatePath(`/console/mandates/${mandateId}`);
}

export async function outreachDraft(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const personId = Number(f.get("personId"));
  const mandateId = Number(f.get("mandateId"));
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m || !canSeeMandate(u, m)) return { error: "No access." };
  const d = await draftOutreach(personId, mandateId, u.name);
  return { ok: true, message: d.text };
}

/* ───── TrustCircle & Advisory work items ───── */

export async function setSessionStatus(id: number, status: "planned" | "done" | "missed") {
  const u = await requireStaff();
  db.update(s.coachingSessions).set({ status }).where(eq(s.coachingSessions.id, id)).run();
  audit(u, "coaching.status", "coaching_session", id, u.brandId, status);
  revalidatePath("/console", "layout");
}

export async function setDeliverableStatus(id: number, status: "todo" | "doing" | "review" | "done") {
  const u = await requireStaff();
  db.update(s.deliverables).set({ status }).where(eq(s.deliverables.id, id)).run();
  audit(u, "deliverable.status", "deliverable", id, u.brandId, status);
  revalidatePath("/console", "layout");
}

export async function enrolParticipant(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const mandateId = Number(f.get("mandateId"));
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m || !canSeeMandate(u, m)) return { error: "No access." };
  const email = str(f, "email").toLowerCase();
  const first = str(f, "firstName");
  const last = str(f, "lastName");
  if (!first || !last || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Name and a valid email are needed." };
  let p = db.select().from(s.people).where(eq(s.people.email, email)).get();
  const existed = !!p;
  if (!p) p = db.insert(s.people).values({ firstName: first, lastName: last, email, currentTitle: str(f, "title") || null, currentCompany: null, sourceBrandId: m.brandId, familyId: m.familyId, seniority: m.seniority, countryCode: "IN", createdAt: nowTs(), updatedAt: nowTs() }).returning().get();
  db.insert(s.personBrands).values({ personId: p.id, brandId: m.brandId, relationship: "participant", since: nowTs() }).onConflictDoNothing().run();
  db.insert(s.consents).values({ personId: p.id, purpose: "ai_matching", granted: true, source: "trustcircle enrolment", capturedAt: nowTs() }).run();
  db.insert(s.engagements).values({ mandateId, personId: p.id, brandId: m.brandId, stage: "enrolled", source: "enrolled", createdAt: nowTs(), updatedAt: nowTs() }).onConflictDoNothing().run();
  audit(u, "outplacement.enrol", "mandate", mandateId, m.brandId, email);
  await emit({ type: "outplacement.enrolled", personId: p.id, mandateId });
  revalidatePath(`/console/mandates/${mandateId}`);
  return { ok: true, message: `${first} enrolled${existed ? " (linked to their existing group record)" : ""}. Jev planned their first five sessions.` };
}

/* ───── leads ───── */

export async function updateLead(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const id = Number(f.get("id"));
  const l = db.select().from(s.leads).where(eq(s.leads.id, id)).get();
  if (!l || !mayBrand(u, l.brandId)) return { error: "No access." };
  const status = str(f, "status") as typeof l.status;
  const owner = num(f, "ownerUserId");
  const note = str(f, "note");
  db.update(s.leads).set({ status, ownerUserId: owner ?? l.ownerUserId, updatedAt: nowTs() }).where(eq(s.leads.id, id)).run();
  if (note) db.insert(s.interactions).values({ brandId: l.brandId, personId: l.personId, orgId: l.orgId, userId: u.id, kind: "note", summary: `Lead #${id}: ${note}`, occurredAt: nowTs() }).run();
  audit(u, "lead.update", "lead", id, l.brandId, `${l.status} → ${status}`);
  revalidatePath("/console/leads");
  return { ok: true, message: "Lead updated." };
}

/* ───── tickets ───── */

export async function staffReply(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const id = Number(f.get("ticketId"));
  const t = db.select().from(s.tickets).where(eq(s.tickets.id, id)).get();
  if (!t || !mayBrand(u, t.brandId)) return { error: "No access." };
  const body = str(f, "body");
  const internal = f.get("internal") === "on";
  const status = (str(f, "status") || t.status) as typeof t.status;
  if (!body && status === t.status) return { error: "Write a reply or change the status." };
  if (body) db.insert(s.ticketMessages).values({ ticketId: id, authorUserId: u.id, authorLabel: `${u.name}${internal ? " · internal note" : ""}`, body, internal, createdAt: nowTs() }).run();
  db.update(s.tickets)
    .set({
      status,
      assigneeUserId: t.assigneeUserId ?? u.id,
      updatedAt: nowTs(),
      ...(body && !internal && !t.firstResponseAt ? { firstResponseAt: nowTs() } : {}),
      ...(["resolved", "closed"].includes(status) && !t.resolvedAt ? { resolvedAt: nowTs() } : {}),
    })
    .where(eq(s.tickets.id, id))
    .run();
  if (body && !internal && t.userId) db.insert(s.notifications).values({ userId: t.userId, title: "Reply on your support ticket", body: t.subject, href: `/exh1b/dashboard/support/${id}`, createdAt: nowTs() }).run();
  audit(u, "ticket.reply", "ticket", id, t.brandId, internal ? "internal" : status);
  revalidatePath("/console/tickets");
  return { ok: true, message: internal ? "Internal note added." : "Reply sent to the member." };
}

export async function jevTicketDraft(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const d = await suggestTicketReply(Number(f.get("ticketId")), u.name);
  return { ok: true, message: d.text };
}

export async function assignTicket(ticketId: number, assignee: number | string) {
  const u = await requireStaff();
  const userId = Number(assignee) || null;
  const t = db.select().from(s.tickets).where(eq(s.tickets.id, ticketId)).get();
  if (!t || !mayBrand(u, t.brandId)) return;
  db.update(s.tickets).set({ assigneeUserId: userId, updatedAt: nowTs() }).where(eq(s.tickets.id, ticketId)).run();
  audit(u, "ticket.assign", "ticket", ticketId, t.brandId, String(userId));
  revalidatePath("/console/tickets");
}

export async function runSlaSweep() {
  const u = await requireStaff();
  const n = slaSweep();
  audit(u, "jev.sla_sweep", "ticket", null, null, `${n} escalated`);
  revalidatePath("/console", "layout");
}

/* ───── EOR ───── */

export async function moveEor(caseId: number, dir: 1 | -1) {
  const u = await requireStaff();
  const c = db.select().from(s.eorCases).where(eq(s.eorCases.id, caseId)).get();
  if (!c) return;
  const step = Math.max(0, Math.min(EOR_STEPS.length - 1, c.step + dir));
  db.update(s.eorCases).set({ step, ...(EOR_STEPS[step] === "Active" && !c.startDate ? { startDate: nowTs() } : {}) }).where(eq(s.eorCases.id, caseId)).run();
  if (c.leadId && EOR_STEPS[step] === "Active") db.update(s.leads).set({ status: "won", updatedAt: nowTs() }).where(eq(s.leads.id, c.leadId)).run();
  db.insert(s.interactions).values({ personId: c.personId, userId: u.id, kind: "system", summary: `EOR case moved to “${EOR_STEPS[step]}”`, occurredAt: nowTs() }).run();
  audit(u, "eor.step", "eor_case", caseId, null, EOR_STEPS[step]);
  revalidatePath("/console/eor");
}

/* ───── billing ───── */

export async function setInvoiceStatus(id: number, status: "sent" | "paid") {
  const u = await requireStaff();
  const inv = db.select().from(s.invoices).where(eq(s.invoices.id, id)).get();
  if (!inv || !mayBrand(u, inv.brandId)) return;
  db.update(s.invoices)
    .set({ status, ...(status === "sent" ? { issuedAt: nowTs(), dueAt: addHours(24 * 30) } : { paidAt: nowTs() }) })
    .where(eq(s.invoices.id, id))
    .run();
  audit(u, `invoice.${status}`, "invoice", id, inv.brandId, inv.number);
  revalidatePath("/console/billing");
}

/* ───── community ───── */

export async function moderatorReply(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireStaff();
  const threadId = Number(f.get("threadId"));
  const body = str(f, "body");
  if (!body) return { error: "Write the reply first." };
  const t = db.select().from(s.threads).where(eq(s.threads.id, threadId)).get();
  if (!t || !mayBrand(u, t.brandId)) return { error: "No access." };
  db.insert(s.posts).values({ threadId, authorUserId: u.id, authorName: u.name, isExpert: true, body, createdAt: nowTs() }).run();
  db.update(s.threads).set({ lastActivityAt: nowTs() }).where(eq(s.threads.id, threadId)).run();
  audit(u, "community.reply", "thread", threadId, t.brandId);
  revalidatePath("/console/community");
  return { ok: true, message: "Posted to the community as an ExH1B expert." };
}

export async function togglePin(threadId: number) {
  const u = await requireStaff();
  const t = db.select().from(s.threads).where(eq(s.threads.id, threadId)).get();
  if (!t || !mayBrand(u, t.brandId)) return;
  db.update(s.threads).set({ pinned: !t.pinned }).where(eq(s.threads.id, threadId)).run();
  revalidatePath("/console/community");
}

/* ───── Jev ───── */

export async function toggleAutomation(key: string) {
  const u = await requireStaff();
  if (u.role !== "group_admin") return;
  db.update(s.jevAutomations).set({ enabled: sql`not ${s.jevAutomations.enabled}` }).where(eq(s.jevAutomations.key, key)).run();
  audit(u, "jev.toggle", "automation", null, null, key);
  revalidatePath("/console/jev");
}

export async function markAllRead() {
  const u = await requireStaff();
  db.update(s.notifications).set({ read: true }).where(and(eq(s.notifications.userId, u.id), eq(s.notifications.read, false))).run();
  revalidatePath("/console", "layout");
}
