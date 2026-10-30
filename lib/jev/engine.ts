import "server-only";
import { and, desc, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { db, schema as s } from "../db";
import { JOB_FAMILIES, SENIORITY, allSkills } from "../content/taxonomy";
import { RELOCATION_ITEMS } from "../content/relocation";
import { addHours, nowTs, daysAhead } from "../time";
import { scoreMatch } from "./match";
import { parseResume, type ParsedResume } from "./parse";
import { claude, claudeJson, jevEngine } from "./llm";
import { peopleCond } from "../access";
import type { SessionUser } from "../auth";

type Person = typeof s.people.$inferSelect;
type Mandate = typeof s.mandates.$inferSelect;

/* ───────────── plumbing ───────────── */

function enabled(key: string) {
  return !!db.select({ e: s.jevAutomations.enabled }).from(s.jevAutomations).where(eq(s.jevAutomations.key, key)).get()?.e;
}

function log(key: string, trigger: string, entity: string, entityId: number | null, brandId: number | null, status: "ok" | "skipped" | "error", summary: string, engine: "claude" | "rules" = "rules") {
  db.insert(s.jevRuns).values({ automationKey: key, trigger, entity, entityId, brandId, status, summary, engine, createdAt: nowTs() }).run();
  db.update(s.jevAutomations).set({ runs: sql`${s.jevAutomations.runs} + 1`, lastRunAt: nowTs() }).where(eq(s.jevAutomations.key, key)).run();
}

const brandIdOf = (slug: string) => db.select({ id: s.brands.id }).from(s.brands).where(eq(s.brands.slug, slug)).get()!.id;
const brandAdmin = (brandId: number) =>
  db.select().from(s.users).where(and(eq(s.users.brandId, brandId), eq(s.users.role, "brand_admin"))).get();
const notify = (userId: number | null | undefined, title: string, body: string, href: string) => {
  if (userId) db.insert(s.notifications).values({ userId, title, body, href, createdAt: nowTs() }).run();
};

export const asMatchPerson = (p: Person) => ({
  skills: p.skills, familyId: p.familyId, seniority: p.seniority, yearsExperience: p.yearsExperience, cityId: p.cityId,
  preferredCityIds: p.preferredCityIds, anywhereInIndia: p.anywhereInIndia, workMode: p.workMode, salaryMin: p.salaryMin, salaryCurrency: p.salaryCurrency,
});
export const asMatchMandate = (m: Mandate) => ({
  skills: m.skills, familyId: m.familyId, seniority: m.seniority, minYears: m.minYears, cityId: m.cityId, countryCode: m.countryCode,
  workMode: m.workMode, salaryMax: m.salaryMax, currency: m.currency, locationLabel: m.locationLabel,
});

/* ───────────── events ───────────── */

export type JevEvent =
  | { type: "resume.uploaded"; personId: number }
  | { type: "profile.updated"; personId: number }
  | { type: "ticket.created"; ticketId: number }
  | { type: "mandate.created"; mandateId: number }
  | { type: "lead.created"; leadId: number }
  | { type: "engagement.placed"; engagementId: number }
  | { type: "outplacement.enrolled"; personId: number; mandateId: number }
  | { type: "subscription.lapsed"; personId: number }
  | { type: "thread.created"; threadId: number }
  | { type: "schedule.hourly" };

export async function emit(ev: JevEvent): Promise<void> {
  try {
    switch (ev.type) {
      case "resume.uploaded":
        if (enabled("resume-parse")) await resumeToProfile(ev.personId);
        await emit({ type: "profile.updated", personId: ev.personId });
        break;
      case "profile.updated":
        if (enabled("match-refresh")) refreshMatches(ev.personId);
        if (enabled("eor-lead")) captureEorLead(ev.personId);
        break;
      case "ticket.created":
        if (enabled("ticket-triage")) await triageTicket(ev.ticketId);
        break;
      case "mandate.created":
        if (enabled("shortlist-builder")) buildShortlist(ev.mandateId);
        break;
      case "lead.created":
        if (enabled("lead-router")) routeLead(ev.leadId);
        break;
      case "engagement.placed":
        if (enabled("placement-invoice")) draftPlacementInvoice(ev.engagementId);
        break;
      case "outplacement.enrolled":
        if (enabled("transition-plan")) transitionPlan(ev.personId, ev.mandateId);
        break;
      case "subscription.lapsed":
        if (enabled("winback")) winback(ev.personId);
        break;
      case "thread.created":
        if (enabled("community-concierge")) await communityConcierge(ev.threadId);
        break;
      case "schedule.hourly":
        if (enabled("sla-sweep")) slaSweep();
        break;
    }
  } catch (e) {
    console.error("[jev] automation failed", ev, e);
    log("platform", ev.type, "event", null, null, "error", String(e));
  }
}

/* ───────────── resume → profile ───────────── */

export async function extractResume(text: string): Promise<{ parsed: ParsedResume; engine: "claude" | "rules" }> {
  const rules = parseResume(text);
  if (jevEngine() !== "claude") return { parsed: rules, engine: "rules" };
  const families = Object.entries(JOB_FAMILIES).map(([k, v]) => `${k} (${v.name})`).join(", ");
  const ai = await claudeJson<Partial<ParsedResume>>(
    `You extract structured fields from resumes for a recruitment platform. Fields: currentTitle (string|null), currentCompany (string|null), yearsExperience (number|null, total professional years), skills (array of up to 20 short skill names), familySlug (one of: ${families}), seniority (one of ${SENIORITY.join(", ")}), linkedinUrl (string|null). Only use facts present in the text.`,
    text.slice(0, 15000),
  );
  if (!ai) return { parsed: rules, engine: "rules" };
  return {
    parsed: {
      currentTitle: ai.currentTitle ?? rules.currentTitle,
      currentCompany: ai.currentCompany ?? rules.currentCompany,
      yearsExperience: typeof ai.yearsExperience === "number" ? ai.yearsExperience : rules.yearsExperience,
      skills: Array.isArray(ai.skills) && ai.skills.length ? ai.skills.slice(0, 20) : rules.skills,
      familySlug: ai.familySlug && JOB_FAMILIES[ai.familySlug] ? ai.familySlug : rules.familySlug,
      seniority: ai.seniority && SENIORITY.includes(ai.seniority as (typeof SENIORITY)[number]) ? ai.seniority : rules.seniority,
      linkedinUrl: ai.linkedinUrl ?? rules.linkedinUrl,
    },
    engine: "claude",
  };
}

async function resumeToProfile(personId: number) {
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get();
  if (!p) return;
  if (!p.resumeText || p.resumeText.trim().length < 80) {
    log("resume-parse", "resume.uploaded", "person", personId, p.sourceBrandId, "skipped", "No readable text in the resume (scanned image?). Asked the member to upload a text-based PDF or DOCX.");
    return;
  }
  const { parsed, engine } = await extractResume(p.resumeText);
  const fam = parsed.familySlug ? db.select({ id: s.jobFamilies.id }).from(s.jobFamilies).where(eq(s.jobFamilies.slug, parsed.familySlug)).get()?.id : null;
  const patch: Partial<typeof s.people.$inferInsert> = { resumeParsedAt: nowTs(), updatedAt: nowTs() };
  const filled: string[] = [];
  if (!p.currentTitle && parsed.currentTitle) (patch.currentTitle = parsed.currentTitle), filled.push("title");
  if (!p.currentCompany && parsed.currentCompany) (patch.currentCompany = parsed.currentCompany), filled.push("company");
  if (p.yearsExperience == null && parsed.yearsExperience != null) (patch.yearsExperience = parsed.yearsExperience), filled.push("years");
  const mergedSkills = [...new Set([...(p.skills ?? []), ...parsed.skills])];
  if (mergedSkills.length > (p.skills?.length ?? 0)) (patch.skills = mergedSkills.slice(0, 25)), filled.push(`${mergedSkills.length - (p.skills?.length ?? 0)} skills`);
  if (!p.familyId && fam) (patch.familyId = fam), filled.push("job family");
  if (!p.seniority && parsed.seniority) (patch.seniority = parsed.seniority), filled.push("seniority");
  if (!p.linkedinUrl && parsed.linkedinUrl) (patch.linkedinUrl = parsed.linkedinUrl), filled.push("LinkedIn");
  db.update(s.people).set(patch).where(eq(s.people.id, personId)).run();
  log("resume-parse", "resume.uploaded", "person", personId, p.sourceBrandId, "ok", filled.length ? `Filled ${filled.join(", ")} from the resume` : "Resume read; profile already had these details", engine);
}

/* ───────────── matches ───────────── */

export function topMatchesFor(p: Person, limit = 8, brandSlugs = ["exh1b", "talent"]) {
  const bIds = db.select({ id: s.brands.id }).from(s.brands).where(inArray(s.brands.slug, brandSlugs)).all().map((b) => b.id);
  const open = db.select().from(s.mandates).where(and(eq(s.mandates.status, "open"), eq(s.mandates.kind, "job"), inArray(s.mandates.brandId, bIds))).all();
  return open
    .map((m) => ({ m, ...scoreMatch(asMatchPerson(p), asMatchMandate(m)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function refreshMatches(personId: number) {
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get();
  if (!p) return;
  const consent = db.select().from(s.consents).where(and(eq(s.consents.personId, personId), eq(s.consents.purpose, "ai_matching"))).get();
  if (consent && !consent.granted) {
    log("match-refresh", "profile.updated", "person", personId, p.sourceBrandId, "skipped", "Member has not consented to AI matching");
    return;
  }
  const top = topMatchesFor(p, 8);
  // drop stale untouched suggestions, keep anything the member acted on
  db.delete(s.engagements).where(and(eq(s.engagements.personId, personId), eq(s.engagements.stage, "matched"), isNull(s.engagements.relevance))).run();
  for (const t of top) {
    db.insert(s.engagements)
      .values({ mandateId: t.m.id, personId, brandId: t.m.brandId, stage: "matched", source: "jev", matchScore: t.score, matchReasons: { reasons: t.reasons, gaps: t.gaps }, createdAt: nowTs(), updatedAt: nowTs() })
      .onConflictDoUpdate({ target: [s.engagements.mandateId, s.engagements.personId], set: { matchScore: t.score, matchReasons: { reasons: t.reasons, gaps: t.gaps }, updatedAt: nowTs() } })
      .run();
  }
  log("match-refresh", "profile.updated", "person", personId, p.sourceBrandId, "ok", `${top.length} matches refreshed; top match ${top[0]?.score ?? 0}%`);
}

/* ───────────── EOR lead capture ───────────── */

function captureEorLead(personId: number) {
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get();
  if (!p || !p.openToEor) return;
  const exists = db.select().from(s.leads).where(and(eq(s.leads.personId, personId), eq(s.leads.kind, "eor"))).get();
  if (exists) return;
  const ex = brandIdOf("exh1b");
  const owner = db.select().from(s.users).where(eq(s.users.email, "employers@exh1b.com")).get() ?? brandAdmin(ex);
  const org = p.currentCompany ? db.select().from(s.organisations).where(eq(s.organisations.name, p.currentCompany)).get() : null;
  const lead = db
    .insert(s.leads)
    .values({ brandId: ex, kind: "eor", name: `${p.firstName} ${p.lastName}`, email: p.email, company: p.currentCompany, roleTitle: p.currentTitle, message: "Said Yes to continuing with current employer from India (profile step 4).", personId, orgId: org?.id ?? null, status: "new", ownerUserId: owner?.id, score: 75, source: "exh1b_profile", respondBy: addHours(24), createdAt: nowTs(), updatedAt: nowTs() })
    .returning()
    .get();
  db.insert(s.eorCases).values({ personId, employerOrgId: org?.id ?? null, leadId: lead.id, step: 0, originCountry: p.countryCode, createdAt: nowTs() }).run();
  notify(owner?.id, "New EOR lead", `${p.firstName} ${p.lastName}${p.currentCompany ? ` (${p.currentCompany})` : ""} wants to keep their employer from India. Reply within 1 business day.`, `/console/leads?id=${lead.id}`);
  log("eor-lead", "profile.updated", "lead", lead.id, ex, "ok", `EOR lead opened${p.currentCompany ? ` for ${p.currentCompany}` : ""}; assigned to ${owner?.name ?? "ExH1B team"}`);
}

/* ───────────── tickets ───────────── */

const URGENT = /(charged twice|double charg|duplicate charge|payroll|visa (?:expir|stamp)|deadline|urgent|asap|immediately|locked out|can'?t log ?in)/i;
const HIGH = /(offer|interview|refund|eor|employer of record|start date|contract)/i;
const CAT_HINTS: [RegExp, string][] = [
  [/(same employer|eor|employer of record|work from india)/i, "Work from India with same employer"],
  [/(refund|charge|invoice|gst|payment|billing|401|tax)/i, "Finance"],
  [/(oci|visa|school|lease|rent|movers|relocat|pet)/i, "Relocation"],
  [/(job|role|match|interview|recruiter|application)/i, "Job Opportunities"],
  [/(profile|resume|linkedin|strength)/i, "Profile"],
  [/(login|upload|bug|error|page|app|platform)/i, "ExH1B Platform"],
];

export async function triageTicket(ticketId: number) {
  const t = db.select().from(s.tickets).where(eq(s.tickets.id, ticketId)).get();
  if (!t) return;
  const text = `${t.subject}\n${t.message}`;
  let category = t.category;
  if (category === "Other") category = CAT_HINTS.find(([re]) => re.test(text))?.[1] ?? "Other";
  let priority: "low" | "normal" | "high" | "urgent" = URGENT.test(text) ? "urgent" : HIGH.test(text) ? "high" : "normal";
  // priority support for annual members
  const annual = t.personId
    ? db.select({ code: s.plans.code }).from(s.subscriptions).innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId)).where(and(eq(s.subscriptions.personId, t.personId), eq(s.subscriptions.status, "active"))).get()
    : null;
  let sla = { urgent: 4, high: 8, normal: 24, low: 48 }[priority];
  if (annual?.code.endsWith("year")) sla = Math.min(sla, 4);
  const exEmployer = db.select().from(s.users).where(eq(s.users.email, "employers@exh1b.com")).get();
  const exSupport = db.select().from(s.users).where(eq(s.users.email, "support@exh1b.com")).get();
  const admin = brandAdmin(t.brandId);
  const assignee = category === "Work from India with same employer" ? exEmployer : category === "Relocation" || category === "ExH1B Platform" || category === "Profile" ? exSupport : admin;
  const due = addHours(sla, new Date(t.createdAt.replace(" ", "T") + "Z"));
  db.update(s.tickets).set({ category, priority, slaHours: sla, slaDueAt: due, assigneeUserId: assignee?.id ?? admin?.id ?? null, updatedAt: nowTs() }).where(eq(s.tickets.id, ticketId)).run();

  let ack = `Thanks, we've received this. ${assignee?.name ?? "Our team"} will reply within ${sla} hours${annual?.code.endsWith("year") ? " (priority support on your annual plan)" : ""}.`;
  let engine: "claude" | "rules" = "rules";
  const ai = await claude(
    `You are Jev, the assistant for ${db.select().from(s.brands).where(eq(s.brands.id, t.brandId)).get()?.name ?? "Benchmark HR Group"} (part of Benchmark HR Group). Write a 2-3 sentence acknowledgement to a ${t.category === "Client" ? "client's message" : "member's support ticket"}. Be warm and specific to their question, do not give legal or tax advice, do not promise outcomes, and say a named teammate will follow up within the stated time.`,
    `Ticket subject: ${t.subject}\nMessage: ${t.message}\nAssigned teammate: ${assignee?.name ?? "our team"}\nResponse time: ${sla} hours`,
    250,
  );
  if (ai) {
    ack = ai.trim();
    engine = "claude";
  }
  db.insert(s.ticketMessages).values({ ticketId, authorLabel: "Jev · automated acknowledgement", body: ack, createdAt: nowTs() }).run();
  notify(assignee?.id, `New ${priority} ticket`, `${t.subject} — respond within ${sla}h`, `/console/tickets?id=${ticketId}`);
  log("ticket-triage", "ticket.created", "ticket", ticketId, t.brandId, "ok", `Category ${category}; priority ${priority}; SLA ${sla}h; assigned to ${assignee?.name ?? "brand lead"}`, engine);
}

export function slaSweep() {
  const late = db
    .select()
    .from(s.tickets)
    .where(and(isNull(s.tickets.firstResponseAt), inArray(s.tickets.status, ["open", "in_progress"]), lt(s.tickets.slaDueAt, nowTs()), eq(s.tickets.escalated, false)))
    .all();
  for (const t of late) {
    db.update(s.tickets).set({ escalated: true, priority: t.priority === "urgent" ? "urgent" : "high" }).where(eq(s.tickets.id, t.id)).run();
    notify(brandAdmin(t.brandId)?.id, "Ticket past its response target", t.subject, `/console/tickets?id=${t.id}`);
  }
  log("sla-sweep", "schedule.hourly", "ticket", null, null, "ok", late.length ? `${late.length} ticket${late.length > 1 ? "s" : ""} past SLA escalated` : "All tickets within SLA");
  return late.length;
}

/* ───────────── shortlist builder ───────────── */

export function candidatePool(m: Mandate) {
  // People who agreed to AI matching AND either belong to this brand or agreed to group sharing.
  return db
    .select()
    .from(s.people)
    .where(
      and(
        sql`exists (select 1 from consents c where c.person_id = ${s.people.id} and c.purpose = 'ai_matching' and c.granted = 1)`,
        sql`(exists (select 1 from person_brands pb where pb.person_id = ${s.people.id} and pb.brand_id = ${m.brandId}) or exists (select 1 from consents c2 where c2.person_id = ${s.people.id} and c2.purpose = 'group_sharing' and c2.granted = 1))`,
        sql`not exists (select 1 from person_brands pb3 where pb3.person_id = ${s.people.id} and pb3.relationship = 'client_contact')`,
      ),
    )
    .all();
}

export function rankForMandate(m: Mandate, limit = 10) {
  // Retained searches: never propose someone more than one level below the role.
  const need = m.kind === "search" && m.seniority ? SENIORITY.indexOf(m.seniority as (typeof SENIORITY)[number]) : -1;
  return candidatePool(m)
    .filter((p) => need < 0 || SENIORITY.indexOf((p.seniority ?? "") as (typeof SENIORITY)[number]) >= Math.min(need, SENIORITY.indexOf("CXO")) - 1)
    .map((p) => ({ p, ...scoreMatch(asMatchPerson(p), asMatchMandate(m)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function buildShortlist(mandateId: number) {
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get();
  if (!m) return 0;
  const brand = db.select().from(s.brands).where(eq(s.brands.id, m.brandId)).get()!;
  if (!["golden-glove", "talent"].includes(brand.slug)) return 0;
  const ranked = rankForMandate(m, 10);
  let added = 0;
  for (const r of ranked) {
    const res = db
      .insert(s.engagements)
      .values({ mandateId, personId: r.p.id, brandId: m.brandId, stage: "sourced", source: "jev", matchScore: r.score, matchReasons: { reasons: r.reasons, gaps: r.gaps }, notes: "Proposed by Jev — awaiting consultant approval before any outreach.", createdAt: nowTs(), updatedAt: nowTs() })
      .onConflictDoNothing()
      .run();
    added += res.changes;
  }
  notify(m.ownerUserId, "Jev proposed a longlist", `${added} people for ${m.title}. Approve before anyone is contacted.`, `/console/mandates/${mandateId}`);
  log("shortlist-builder", "mandate.created", "mandate", mandateId, m.brandId, "ok", `Longlist of ${added} proposed from ${candidatePool(m).length} consented records; awaiting approval`);
  return added;
}

/* ───────────── leads ───────────── */

export function routeLead(leadId: number) {
  const l = db.select().from(s.leads).where(eq(s.leads.id, leadId)).get();
  if (!l) return;
  const person = db.select().from(s.people).where(eq(s.people.email, l.email.toLowerCase())).get();
  const org = l.company ? db.select().from(s.organisations).where(sql`lower(${s.organisations.name}) = lower(${l.company})`).get() : null;
  let score = 40;
  if (org) score += 15;
  if (person) score += 10;
  if ((l.message ?? "").length > 80) score += 10;
  if (/(cxo|chief|ceo|cfo|cto|board|director|head)/i.test(`${l.roleTitle ?? ""} ${l.message ?? ""}`)) score += 15;
  if (/(urgent|asap|this week|immediately)/i.test(l.message ?? "")) score += 10;
  const owner = l.ownerUserId ? null : brandAdmin(l.brandId) ?? db.select().from(s.users).where(eq(s.users.email, "anand@benchmarkhr.in")).get();
  db.update(s.leads)
    .set({ personId: l.personId ?? person?.id ?? null, orgId: l.orgId ?? org?.id ?? null, score: Math.min(99, score), ownerUserId: l.ownerUserId ?? owner?.id ?? null, respondBy: l.respondBy ?? addHours(24), updatedAt: nowTs() })
    .where(eq(s.leads.id, leadId))
    .run();
  notify(l.ownerUserId ?? owner?.id, "New enquiry", `${l.name}${l.company ? `, ${l.company}` : ""} — reply within 1 business day`, `/console/leads?id=${leadId}`);
  log("lead-router", "lead.created", "lead", leadId, l.brandId, "ok", `Scored ${Math.min(99, score)}${org ? `; linked to ${org.name}` : ""}${person ? "; matched existing person" : ""}; routed to ${owner?.name ?? "owner"}`);
}

/* ───────────── placements, outplacement, winback, community ───────────── */

function draftPlacementInvoice(engagementId: number) {
  const e = db.select().from(s.engagements).where(eq(s.engagements.id, engagementId)).get();
  if (!e) return;
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, e.mandateId)).get();
  if (!m || !m.feeAmount || m.kind === "advisory" || m.kind === "outplacement") return;
  const billed = db.select({ total: sql<number>`coalesce(sum(${s.invoices.amount}),0)` }).from(s.invoices).where(eq(s.invoices.mandateId, m.id)).get()!.total;
  const amount = Math.max(0, m.feeAmount - billed);
  if (!amount) return;
  const brand = db.select().from(s.brands).where(eq(s.brands.id, m.brandId)).get()!;
  const n = db.select({ n: sql<number>`count(*)` }).from(s.invoices).get()!.n + 1;
  db.insert(s.invoices).values({ brandId: m.brandId, orgId: m.orgId, mandateId: m.id, number: `BHR-${brand.slug.slice(0, 2).toUpperCase()}-2026-${String(n).padStart(3, "0")}`, description: `${m.kind === "search" ? "Final retainer" : "Placement fee"} — ${m.title}`, amount, currency: m.feeCurrency ?? "INR", status: "draft", createdBy: "Jev" }).run();
  notify(m.ownerUserId, "Draft invoice ready", `${m.title}: review before sending`, `/console/billing`);
  log("placement-invoice", "engagement.placed", "mandate", m.id, m.brandId, "ok", `Draft invoice for ${amount.toLocaleString("en-IN")} ${m.feeCurrency ?? "INR"} created for review`);
}

export function transitionPlan(personId: number, mandateId: number) {
  const coach = brandAdmin(brandIdOf("trustcircle"));
  const topics = ["Transition kick-off", "Story and CV refresh", "LinkedIn and market approach", "Interview practice", "Offer evaluation"];
  topics.forEach((topic, i) => db.insert(s.coachingSessions).values({ personId, mandateId, coachUserId: coach?.id, topic, scheduledAt: daysAhead(2 + i * 6), status: "planned" }).run());
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get()!;
  const top = topMatchesFor(p, 4);
  for (const t of top) db.insert(s.engagements).values({ mandateId: t.m.id, personId, brandId: t.m.brandId, stage: "matched", source: "jev", matchScore: t.score, matchReasons: { reasons: t.reasons, gaps: t.gaps } }).onConflictDoNothing().run();
  log("transition-plan", "outplacement.enrolled", "person", personId, brandIdOf("trustcircle"), "ok", `${topics.length} coaching sessions planned; ${top.length} matched openings`);
}

export function winback(personId: number) {
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get();
  const u = db.select().from(s.users).where(eq(s.users.personId, personId)).get();
  if (!p || !u) return;
  const n = topMatchesFor(p, 50).filter((x) => x.score >= 60).length;
  notify(u.id, `${n} roles match your profile this week`, "Resubscribe to see companies, salaries and apply.", "/exh1b/dashboard/billing");
  log("winback", "subscription.lapsed", "person", personId, brandIdOf("exh1b"), "ok", `Nudge sent: ${n} matching roles`);
}

async function communityConcierge(threadId: number) {
  const t = db.select().from(s.threads).where(eq(s.threads.id, threadId)).get();
  if (!t) return;
  const words = new Set(`${t.title} ${t.body}`.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []);
  const related = RELOCATION_ITEMS.map((i) => ({ i, n: (`${i.title} ${i.detail}`.toLowerCase().match(/[a-z0-9]{4,}/g) ?? []).filter((w) => words.has(w)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  let draft = `Thanks for asking. ${related.length ? `These checklist items in the Relocation Hub may help: ${related.map((r) => `“${r.i.title}”`).join("; ")}.` : ""} Members who have made this move, please share what worked for you.`;
  let engine: "claude" | "rules" = "rules";
  const ai = await claude("You are Jev, a community concierge for ExH1B (Indian professionals returning home). Draft a short, friendly first reply (max 90 words) to a forum question for a human moderator to review. No legal/tax advice; point to the Relocation Hub and invite members to share experience.", `${t.title}\n\n${t.body}`, 220);
  if (ai) {
    draft = ai.trim();
    engine = "claude";
  }
  notify(brandAdmin(t.brandId)?.id, "Draft reply ready for a community question", `“${t.title}”: ${draft}`, `/console/community?id=${threadId}`);
  log("community-concierge", "thread.created", "thread", threadId, t.brandId, "ok", "Draft reply prepared for moderator", engine);
}

/* ───────────── Jev Ask: natural-language search over the unified database ───────────── */

export type AskFilter = {
  families?: string[];
  seniority?: string[];
  cities?: string[];
  countries?: string[];
  skills?: string[];
  minYears?: number;
  brands?: string[];
  openToEor?: boolean;
  returnees?: boolean;
  text?: string;
};

const COUNTRY_WORDS: Record<string, string> = { us: "US", usa: "US", america: "US", "united states": "US", uk: "GB", britain: "GB", "united kingdom": "GB", london: "GB", canada: "CA", ireland: "IE", dublin: "IE", germany: "DE", uae: "AE", dubai: "AE", singapore: "SG", australia: "AU", india: "IN" };

function rulesInterpret(q: string): AskFilter {
  const t = ` ${q.toLowerCase()} `;
  const f: AskFilter = {};
  const fam = Object.entries(JOB_FAMILIES).filter(([slug, v]) => {
    const keys = [v.name.toLowerCase().split(/[ ,&]+/)[0], slug, ...v.roles.map((r) => r.toLowerCase())];
    return keys.some((k) => k.length > 3 && t.includes(k));
  });
  if (/\bfinance\b|\bcfo\b/.test(t)) fam.push(["finance", JOB_FAMILIES.finance]);
  if (/\bcto\b|engineer/.test(t)) fam.push(["engineering", JOB_FAMILIES.engineering]);
  if (/\bhr\b|chro|people/.test(t)) fam.push(["hr", JOB_FAMILIES.hr]);
  if (/security|ciso/.test(t)) fam.push(["security", JOB_FAMILIES.security]);
  if (fam.length) f.families = [...new Set(fam.map(([k]) => k))];
  const sen: string[] = [];
  if (/\b(cxo|chief|c-suite|ceo|cfo|cto|coo|chro|ciso)\b/.test(t)) sen.push("CXO");
  if (/\b(leader|leaders|leadership|vp|director|head)\b/.test(t)) sen.push("Leadership", "CXO");
  if (/\bsenior\b/.test(t)) sen.push("Senior");
  if (/\bprincipal|staff\b/.test(t)) sen.push("Principal");
  if (/\bjunior|entry\b/.test(t)) sen.push("Junior");
  if (sen.length) f.seniority = [...new Set(sen)];
  const cities = db.select({ name: s.cities.name }).from(s.cities).all().map((c) => c.name);
  const cityHits = cities.filter((c) => t.includes(` ${c.toLowerCase()}`) && !["india"].includes(c.toLowerCase()));
  if (cityHits.length) f.cities = cityHits;
  const fromMatch = t.match(/(?:from|in|based in|living in) (the )?([a-z ]{2,20}?)(?:[ ,.]|$)/g) ?? [];
  const cc = new Set<string>();
  for (const w of Object.keys(COUNTRY_WORDS)) if (t.includes(` ${w} `) || t.includes(` ${w},`) || t.includes(` ${w}.`)) cc.add(COUNTRY_WORDS[w]);
  if (/returned|returning|returnee|came back|moving back|coming home/.test(t)) {
    f.returnees = true;
    cc.delete("IN");
  }
  if (cc.size && !(f.cities?.length && cc.size === 1 && cc.has("IN"))) f.countries = [...cc];
  if (fromMatch.length && !f.countries) {
    /* no-op: country words handled above */
  }
  const skills = allSkills().filter((sk) => sk.length > 2 && new RegExp(`(^|[^a-z])${sk.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(t));
  if (skills.length) f.skills = skills;
  const yrs = t.match(/(\d{1,2})\+?\s*(?:years|yrs)/);
  if (yrs) f.minYears = Number(yrs[1]);
  if (/\beor\b|employer of record|same employer/.test(t)) f.openToEor = true;
  const brands: string[] = [];
  if (/golden glove|executive/.test(t)) brands.push("golden-glove");
  if (/trustcircle|outplace/.test(t)) brands.push("trustcircle");
  if (/exh1b|member/.test(t)) brands.push("exh1b");
  if (brands.length) f.brands = brands;
  return f;
}

export async function interpret(q: string): Promise<{ filter: AskFilter; engine: "claude" | "rules" }> {
  const rules = rulesInterpret(q);
  if (jevEngine() !== "claude") return { filter: rules, engine: "rules" };
  const cities = db.select({ name: s.cities.name }).from(s.cities).where(eq(s.cities.countryCode, "IN")).all().map((c) => c.name);
  const ai = await claudeJson<AskFilter>(
    `Convert a recruiter's question about people in a recruitment database into a filter. Keys (all optional): families (array of: ${Object.keys(JOB_FAMILIES).join(", ")}), seniority (array of: ${SENIORITY.join(", ")}), cities (array of city names, e.g. ${cities.slice(0, 12).join(", ")}), countries (ISO-2 codes of where the person lives NOW), skills (array), minYears (number), brands (array of: exh1b, golden-glove, talent, trustcircle, advisory), openToEor (boolean), returnees (boolean: people returning to India from abroad, i.e. ExH1B members). "Returned from the US" means returnees=true and countries=["US"] only if they still live there; if they have returned, prefer returnees=true without countries.`,
    q,
    400,
  );
  if (!ai) return { filter: rules, engine: "rules" };
  return { filter: ai, engine: "claude" };
}

export async function ask(q: string, u: SessionUser) {
  const { filter, engine } = await interpret(q);
  const conds = [peopleCond(u), sql`not exists (select 1 from person_brands pbx where pbx.person_id = ${s.people.id} and pbx.relationship = 'client_contact')`];
  if (filter.families?.length) {
    const ids = db.select({ id: s.jobFamilies.id }).from(s.jobFamilies).where(inArray(s.jobFamilies.slug, filter.families)).all().map((r) => r.id);
    if (ids.length) conds.push(inArray(s.people.familyId, ids));
  }
  if (filter.seniority?.length) conds.push(inArray(s.people.seniority, filter.seniority));
  if (filter.countries?.length) conds.push(inArray(s.people.countryCode, filter.countries));
  if (filter.cities?.length) {
    const ids = db.select({ id: s.cities.id }).from(s.cities).where(inArray(s.cities.name, filter.cities)).all().map((r) => r.id);
    if (ids.length)
      conds.push(sql`(${s.people.cityId} in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)}) or exists (select 1 from json_each(${s.people.preferredCityIds}) j where j.value in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})))`);
  }
  if (filter.minYears) conds.push(sql`${s.people.yearsExperience} >= ${filter.minYears}`);
  if (filter.openToEor) conds.push(eq(s.people.openToEor, true));
  if (filter.returnees) conds.push(sql`exists (select 1 from person_brands pb where pb.person_id = ${s.people.id} and pb.brand_id = ${brandIdOf("exh1b")})`);
  if (filter.brands?.length) {
    const ids = db.select({ id: s.brands.id }).from(s.brands).where(inArray(s.brands.slug, filter.brands)).all().map((r) => r.id);
    conds.push(sql`exists (select 1 from person_brands pb2 where pb2.person_id = ${s.people.id} and pb2.brand_id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)}))`);
  }
  let rows = db.select().from(s.people).where(and(...conds)).orderBy(desc(s.people.yearsExperience)).limit(200).all();
  if (filter.skills?.length) {
    const want = filter.skills.map((x) => x.toLowerCase());
    rows = rows
      .map((r) => ({ r, n: r.skills.filter((k) => want.includes(k.toLowerCase())).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .map((x) => x.r);
  }
  db.insert(s.jevQueries).values({ userId: u.id, question: q, interpreted: filter as Record<string, unknown>, resultCount: rows.length, engine, createdAt: nowTs() }).run();
  return { filter, engine, rows: rows.slice(0, 40), total: rows.length };
}

/* ───────────── drafting helpers for the console ───────────── */

export async function draftOutreach(personId: number, mandateId: number, sender: string) {
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get()!;
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, mandateId)).get()!;
  const org = m.orgId ? db.select().from(s.organisations).where(eq(s.organisations.id, m.orgId)).get() : null;
  const brand = db.select().from(s.brands).where(eq(s.brands.id, m.brandId)).get()!;
  const sc = scoreMatch(asMatchPerson(p), asMatchMandate(m));
  const who = m.confidential ? `a ${org?.industry?.toLowerCase() ?? "leading"} company (confidential at this stage)` : org?.name ?? "our client";
  const fallback = `Hi ${p.firstName},

I lead ${brand.name}'s work on a ${m.title} role for ${who}${m.locationLabel ? `, based in ${m.locationLabel}` : ""}. Your background${sc.reasons[0] ? ` (${sc.reasons[0].toLowerCase()})` : ""} stood out, and I'd value 20 minutes to share the brief and hear what you'd want from your next move.

Would any time this week or next suit you?

Best regards,
${sender}
${brand.name}`;
  const ai = await claude(
    `You draft first-approach messages for ${brand.name}, part of Benchmark HR Group. Tone: discreet, respectful, specific, under 120 words. Never reveal a confidential client's name. Sign off as the sender. Plain text.`,
    `Candidate: ${p.firstName} ${p.lastName}, ${p.currentTitle ?? ""} at ${p.currentCompany ?? ""}, ${p.yearsExperience ?? "?"} years, skills: ${p.skills.join(", ")}.\nRole: ${m.title} for ${who}, ${m.locationLabel}. Why they fit: ${sc.reasons.join("; ")}.\nSender: ${sender}`,
    400,
  );
  return { text: ai?.trim() || fallback, engine: ai ? "claude" : "rules" };
}

export async function suggestTicketReply(ticketId: number, staffName: string) {
  const t = db.select().from(s.tickets).where(eq(s.tickets.id, ticketId)).get()!;
  const msgs = db.select().from(s.ticketMessages).where(eq(s.ticketMessages.ticketId, ticketId)).all();
  const fallback = `Hi,\n\nThanks for your patience. [Answer the question about “${t.subject}” here.]\n\nIf anything else comes up, reply on this ticket.\n\n${staffName}`;
  const ai = await claude(
    "You draft replies for Benchmark HR Group support staff. Be concise, warm and practical. Do not give definitive legal or tax advice; suggest a consultation where needed. Leave [brackets] for facts you don't know.",
    `Ticket: ${t.subject} (${t.category})\nConversation:\n${msgs.map((m) => `${m.authorLabel ?? "Staff"}: ${m.body}`).join("\n")}\nSign as ${staffName}.`,
    400,
  );
  return { text: ai?.trim() || fallback, engine: ai ? "claude" : "rules" };
}

export { jevEngine };
export const ACTIVE_STAGES = ["applied", "screening", "shortlisted", "interview", "offer"] as const;
export const notRejected = ne(s.engagements.stage, "rejected");
