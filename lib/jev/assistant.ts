import "server-only";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db, schema as s } from "../db";
import type { SessionUser } from "../auth";
import { isStaff } from "../auth";
import { brandCond } from "../access";
import { ask, topMatchesFor } from "./engine";
import { claude, jevEngine } from "./llm";
import { profileStatus } from "../profile";
import { subscriptionOf } from "../member";
import { RELOCATION_ITEMS, VISA_CARDS } from "../content/relocation";
import { brandBySlug } from "../content/brands";
import { money, nowTs, relTime } from "../time";

/**
 * Jev, the conversational assistant on every surface of the platform.
 *
 * It answers only from what the asker is allowed to see: staff get group
 * search and live operations numbers within their brand scope, members get
 * their own record, and visitors get public information about the business
 * whose site they are on. Claude writes the answer when a key is configured;
 * otherwise the rules engine below answers directly.
 */

export type Surface = "console" | "group" | "exh1b" | "golden-glove" | "talent" | "trustcircle" | "advisory";
export type ChatTurn = { role: "user" | "assistant"; content: string };
export type JevLink = { label: string; href: string };
export type JevReply = { text: string; links: JevLink[]; engine: "claude" | "rules" };

const words = (t: string) => new Set(t.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
const overlap = (a: Set<string>, b: string) => (b.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w) => a.has(w)).length;

function knowledge(q: string, limit = 3) {
  const w = words(q);
  const items = [
    ...RELOCATION_ITEMS.map((i) => ({ title: i.title, body: i.detail, href: "/exh1b/relocation" })),
    ...VISA_CARDS.map((v) => ({ title: v.title, body: `${v.who} ${v.points.join(" ")} ${v.caution}`, href: "/exh1b/relocation#visa" })),
  ];
  return items
    .map((i) => ({ i, n: overlap(w, `${i.title} ${i.title} ${i.body}`) }))
    .filter((x) => x.n > 1)
    .sort((a, b) => b.n - a.n)
    .slice(0, limit)
    .map((x) => x.i);
}

const PUBLIC_FAQ: Record<string, { q: RegExp; a: string; link?: JevLink }[]> = {
  "golden-glove": [
    { q: /fee|cost|price|retain/i, a: "Golden Glove works on a retained basis, usually a third of the first-year cash compensation, paid in three stages. A partner sets out the fee for your search in the first conversation.", link: { label: "Brief a partner", href: "/goldenglove#brief" } },
    { q: /how long|time|weeks|timeline/i, a: "Most CXO searches reach a shortlist in 4 to 6 weeks and an appointment in 10 to 14 weeks. Board searches can take longer because of regulatory checks.", link: { label: "How a search runs", href: "/goldenglove#method" } },
    { q: /confiden|discreet|replace/i, a: "Many of our searches are confidential replacements. Candidates see the client's name only after they agree to be considered, and the mandate is visible only to the partner team.", link: { label: "Brief us in confidence", href: "/goldenglove#brief" } },
    { q: /register|cv|resume|executive|candidate|myself/i, a: "Senior leaders can register in confidence. Your details sit in a private file seen only by Golden Glove partners, and we contact you only about roles that fit.", link: { label: "Register in confidence", href: "/goldenglove#register" } },
  ],
  talent: [
    { q: /job|role|opening|apply|vacanc/i, a: "Every open Benchmark Talent role is on the job board, with salary bands shown. You can apply in two minutes, and a recruiter replies within three business days.", link: { label: "Browse open roles", href: "/talent/jobs" } },
    { q: /fee|cost|price/i, a: "Benchmark Talent works on success fees (8.33% of annual CTC for most roles) with volume pricing for team builds and capability centres.", link: { label: "Tell us what you are hiring", href: "/talent#hire" } },
    { q: /gcc|capability|team|scale/i, a: "We build whole teams for capability centres and scale-ups, from the first five hires to the first hundred, with a shared live pipeline.", link: { label: "Plan a team build", href: "/talent#hire" } },
  ],
  trustcircle: [
    { q: /cost|fee|price|programme|program/i, a: "TrustCircle programmes are fixed-fee per participant, sized by seniority, and paid by the sponsoring company. Each participant gets a named coach for 3 to 6 months.", link: { label: "Talk to us about a programme", href: "/trustcircle#sponsor" } },
    { q: /lost|laid|redundan|let go|job ended|my role/i, a: "If your role has ended and your employer sponsors TrustCircle, you'll get an invitation to your own portal. If not, you can still talk to a coach. The first conversation is free.", link: { label: "Speak to a coach", href: "/trustcircle#talk" } },
    { q: /coach|session|what happens/i, a: "A programme runs through kick-off, story and CV refresh, market approach, interview practice and offer evaluation, with openings from across Benchmark HR Group.", link: { label: "See the programme", href: "/trustcircle#programme" } },
  ],
  advisory: [
    { q: /posh|compliance|labour|code|audit/i, a: "We run compliance reviews against the four labour codes, POSH and state Shops & Establishments rules, with a prioritised fix list and policy drafts.", link: { label: "Book a compliance review", href: "/advisory#engage" } },
    { q: /retainer|retain|monthly|fee|cost/i, a: "Advisory works on a monthly retainer for ongoing HR counsel, or as a fixed-fee project for specific work like pay bands, succession plans or an HR set-up.", link: { label: "Discuss an engagement", href: "/advisory#engage" } },
    { q: /succession|board|ceo/i, a: "Our succession work maps the critical roles, assesses ready-now and ready-later successors and gives the board a plan it can review each year.", link: { label: "Talk to a principal", href: "/advisory#engage" } },
  ],
  exh1b: [
    { q: /price|cost|fee|subscri|plan/i, a: "Personalised Job Discovery is ₹9,499 a month in India or $99 a month internationally, with quarterly and annual plans that save up to 20%. Annual members get priority support and two consultations.", link: { label: "Create your profile", href: "/exh1b/auth/signup" } },
    { q: /eor|employer of record|same employer|current employer|keep my job/i, a: "With Employer of Record, ExH1B employs you in India on your current employer's behalf, so you can keep your job while you move home. We handle the contract, payroll and compliance.", link: { label: "Employer transition", href: "/exh1b#employer" } },
  ],
  group: [
    { q: /golden|executive|cxo|ceo|board/i, a: "For CXO, board and rare specialist roles, Golden Glove Executive Search runs retained, partner-led searches.", link: { label: "Golden Glove", href: "/goldenglove" } },
    { q: /return|abroad|h1b|h-1b|move back|coming home/i, a: "ExH1B helps professionals abroad find roles in India, plan the move, and even keep their current employer through Employer of Record.", link: { label: "ExH1B", href: "/exh1b" } },
    { q: /layoff|restructur|outplace|transition/i, a: "TrustCircle Outplacements supports leaders and teams through restructuring, with one-to-one coaching and openings from across the group.", link: { label: "TrustCircle", href: "/trustcircle" } },
    { q: /policy|posh|compliance|succession|pay band|hr setup/i, a: "Benchmark Advisory handles people strategy, succession, policies and compliance, on retainer or as a project.", link: { label: "Benchmark Advisory", href: "/advisory" } },
    { q: /hire|hiring|team|job|role/i, a: "Benchmark Talent covers mid-senior and specialist hiring for scale-ups and capability centres, and lists open roles publicly.", link: { label: "Benchmark Talent", href: "/talent" } },
  ],
};

async function staffAnswer(q: string, u: SessionUser, history: ChatTurn[]): Promise<JevReply> {
  const t = q.toLowerCase();
  const scope = (col: Parameters<typeof brandCond>[0]) => brandCond(col, u);
  const links: JevLink[] = [];
  const facts: string[] = [];

  if (/overdue|late|sla|ticket/.test(t)) {
    const late = db.select().from(s.tickets).where(and(inArray(s.tickets.status, ["open", "in_progress"]), isNull(s.tickets.firstResponseAt), lt(s.tickets.slaDueAt, nowTs()), scope(s.tickets.brandId))).all();
    const open = db.select({ n: sql<number>`count(*)` }).from(s.tickets).where(and(inArray(s.tickets.status, ["open", "in_progress", "waiting"]), scope(s.tickets.brandId))).get()!.n;
    facts.push(`${open} tickets are open; ${late.length} are past their first-response target${late.length ? `: ${late.slice(0, 4).map((x) => `“${x.subject}”`).join(", ")}` : ""}.`);
    links.push({ label: "Ticket queue", href: "/console/tickets" });
  }
  if (/lead|enquir|brief|pipeline/.test(t)) {
    const rows = db.select().from(s.leads).where(and(inArray(s.leads.status, ["new", "contacted", "qualified", "proposal"]), scope(s.leads.brandId))).orderBy(desc(s.leads.score)).all();
    const due = rows.filter((l) => l.status === "new" && l.respondBy && l.respondBy < nowTs());
    facts.push(`${rows.length} open leads, ${rows.filter((l) => l.status === "new").length} not yet contacted${due.length ? ` (${due.length} past their reply-by time)` : ""}. Highest scored: ${rows.slice(0, 3).map((l) => `${l.name}${l.company ? ` (${l.company})` : ""}, ${l.score}`).join("; ")}.`);
    links.push({ label: "Leads", href: "/console/leads" });
  }
  if (/revenue|invoice|billing|mrr|paid|overdue invoice|collect/.test(t)) {
    const inv = db.select().from(s.invoices).where(scope(s.invoices.brandId)).all();
    const paid = inv.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0);
    const out = inv.filter((i) => i.status === "sent" || i.status === "overdue").reduce((a, i) => a + i.amount, 0);
    const drafts = inv.filter((i) => i.status === "draft").length;
    facts.push(`Invoices: ${money(paid, "INR", true)} collected, ${money(out, "INR", true)} outstanding, ${drafts} draft${drafts === 1 ? "" : "s"} waiting for review.`);
    links.push({ label: "Billing", href: "/console/billing" });
  }
  if (/mandate|search|shortlist|longlist|proposal|approve/.test(t) && !facts.length) {
    const ms = db.select().from(s.mandates).where(and(eq(s.mandates.status, "open"), scope(s.mandates.brandId))).all();
    const props = db.select({ n: sql<number>`count(*)` }).from(s.engagements).where(and(eq(s.engagements.stage, "sourced"), eq(s.engagements.source, "jev"), scope(s.engagements.brandId))).get()!.n;
    facts.push(`${ms.length} open mandates; ${props} Jev proposals are waiting for a consultant's review.`);
    links.push({ label: "Mandates", href: "/console/mandates" });
  }

  // Otherwise treat it as a people search.
  let people: { id: number; name: string; line: string }[] = [];
  if (!facts.length) {
    const r = await ask(q, u);
    people = r.rows.slice(0, 6).map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, line: [p.currentTitle, p.currentCompany, p.locationLabel, p.yearsExperience != null ? `${Math.round(p.yearsExperience)} yrs` : null].filter(Boolean).join(" · ") }));
    facts.push(r.total ? `Found ${r.total} ${r.total === 1 ? "person" : "people"} you can see. Top results: ${people.map((p) => `${p.name} (${p.line})`).join("; ")}.` : "Nobody you can see matches that yet. Try fewer filters, or a job family and city.");
    people.forEach((p) => links.push({ label: p.name, href: `/console/people/${p.id}` }));
    links.push({ label: "Open full search", href: `/console/jev/ask?q=${encodeURIComponent(q)}` });
  }

  const rules = facts.join("\n");
  if (jevEngine() !== "claude") return { text: rules, links, engine: "rules" };
  const ai = await claude(
    `You are Jev, the operations assistant inside Benchmark HR Group's console. The user is ${u.name} (${u.title ?? u.role}). Answer in at most 90 words, using ONLY the facts provided. Be direct; suggest one next step. Never invent people or numbers.`,
    `Recent conversation:\n${history.slice(-4).map((h) => `${h.role}: ${h.content}`).join("\n")}\n\nQuestion: ${q}\n\nFacts from the database:\n${rules}`,
    300,
  );
  return { text: ai?.trim() || rules, links, engine: ai ? "claude" : "rules" };
}

async function memberAnswer(q: string, u: SessionUser, history: ChatTurn[]): Promise<JevReply> {
  const t = q.toLowerCase();
  const p = db.select().from(s.people).where(eq(s.people.id, u.personId!)).get()!;
  const links: JevLink[] = [];
  const facts: string[] = [];
  const brand = u.brandSlug;

  if (brand === "exh1b") {
    if (/match|job|role|opening|apply/.test(t)) {
      const m = topMatchesFor(p, 50);
      const strong = m.filter((x) => x.score >= 60);
      const sub = subscriptionOf(p.id);
      facts.push(`${strong.length} open roles match you at 60% or better; your top match is ${m[0]?.score ?? 0}%${sub.active ? ` (${m[0]?.m.title}, ${m[0]?.m.locationLabel})` : ""}.${sub.active ? "" : " Your subscription isn't active, so companies and salaries are hidden until you resubscribe."}`);
      links.push({ label: "My matches", href: "/exh1b/jobs" });
    }
    if (/profile|strength|complete|resume|cv|linkedin/.test(t)) {
      const st = profileStatus(p);
      const todo = st.items.filter((i) => !i.done);
      facts.push(`Your profile strength is ${st.strength}% (${st.label}).${todo.length ? ` To finish: ${todo.map((i) => `${i.label} (+${i.weight})`).join(", ")}.` : " Everything is filled in."}`);
      links.push({ label: "Edit profile", href: "/exh1b/profile" });
    }
    if (/ticket|support|help desk|reply/.test(t)) {
      const ts = db.select().from(s.tickets).where(eq(s.tickets.personId, p.id)).orderBy(desc(s.tickets.updatedAt)).limit(3).all();
      facts.push(ts.length ? `Your latest tickets: ${ts.map((x) => `“${x.subject}” is ${x.status.replace("_", " ")}${x.slaDueAt && !x.firstResponseAt ? `, reply due ${relTime(x.slaDueAt)}` : ""}`).join("; ")}.` : "You have no support tickets.");
      links.push({ label: "Support", href: "/exh1b/dashboard/support" });
    }
    if (/bill|subscri|renew|payment|cancel|price/.test(t)) {
      const sub = subscriptionOf(p.id);
      facts.push(sub.sub ? `Your ${sub.plan?.name} plan is ${sub.active ? `active until ${sub.sub.currentPeriodEnd.slice(0, 10)}` : sub.sub.status}.` : "You haven't subscribed yet.");
      links.push({ label: "Billing", href: "/exh1b/dashboard/billing" });
    }
    if (/eor|employer of record|same employer|current employer/.test(t)) {
      const c = db.select().from(s.eorCases).where(eq(s.eorCases.personId, p.id)).get();
      facts.push(c ? `Your Employer of Record case is at step ${c.step + 1} of 6. Our employer team is working with your current employer.` : "You haven't asked for Employer of Record yet. Answer Yes in profile step 4 and our employer team will contact you within a business day.");
      links.push({ label: c ? "Dashboard" : "Profile step 4", href: c ? "/exh1b/dashboard#eor" : "/exh1b/profile?step=4" });
    }
  }
  if (brand === "trustcircle") {
    const sessions = db.select().from(s.coachingSessions).where(eq(s.coachingSessions.personId, p.id)).orderBy(s.coachingSessions.scheduledAt).all();
    const next = sessions.find((x) => x.status === "planned");
    facts.push(`${sessions.filter((x) => x.status === "done").length} of ${sessions.length} coaching sessions done.${next ? ` Next: “${next.topic}” ${relTime(next.scheduledAt)}.` : ""}`);
    const m = topMatchesFor(p, 20, ["talent", "exh1b"]).filter((x) => x.score >= 55);
    facts.push(`${m.length} openings across the group match your profile.`);
    links.push({ label: "My programme", href: "/trustcircle/portal" });
  }

  const kb = knowledge(q);
  if (kb.length && (brand === "exh1b" || !facts.length)) {
    facts.push(`From the Relocation Hub: ${kb.map((k) => `${k.title}: ${k.body}`).join(" | ")}`);
    links.push(...kb.map((k) => ({ label: k.title, href: k.href })).slice(0, 2));
  }
  if (!facts.length) facts.push("I can help with your matches, profile, applications, relocation checklist, billing and support tickets. For anything else, a teammate will help: open a support ticket and you'll get a reply time straight away.");

  const rules = facts.join("\n");
  if (jevEngine() !== "claude") return { text: rules, links: dedupe(links), engine: "rules" };
  const ai = await claude(
    `You are Jev, the assistant for ${brandBySlug(brand ?? "")?.name ?? "Benchmark HR Group"}. You are talking to ${p.firstName}. Answer warmly in at most 100 words using ONLY the facts provided. Do not give legal, immigration or tax advice; say a qualified adviser should confirm. Never invent roles, prices or dates.`,
    `Recent conversation:\n${history.slice(-4).map((h) => `${h.role}: ${h.content}`).join("\n")}\n\nQuestion: ${q}\n\nFacts:\n${rules}`,
    320,
  );
  return { text: ai?.trim() || rules, links: dedupe(links), engine: ai ? "claude" : "rules" };
}

async function publicAnswer(q: string, surface: Surface, history: ChatTurn[]): Promise<JevReply> {
  const faq = PUBLIC_FAQ[surface] ?? PUBLIC_FAQ.group;
  const hits = faq.filter((f) => f.q.test(q));
  const kb = surface === "exh1b" ? knowledge(q, 2) : [];
  const brand = brandBySlug(surface === "console" ? "group" : surface);
  let text = hits.length ? hits.map((h) => h.a).join(" ") : "";
  if (kb.length) text += `${text ? "\n\n" : ""}${kb.map((k) => `${k.title}: ${k.body}`).join("\n\n")}`;
  if (!text) text = `I'm Jev, ${brand?.name ?? "Benchmark HR"}'s assistant. ${brand?.description ?? ""} Ask me about how we work, fees or timelines, or leave your details and a person will reply within one business day.`;
  const links = dedupe([...hits.filter((h) => h.link).map((h) => h.link!), ...kb.map((k) => ({ label: k.title, href: k.href }))]);
  if (jevEngine() !== "claude") return { text, links, engine: "rules" };
  const ai = await claude(
    `You are Jev, the website assistant for ${brand?.name}. ${brand?.description} Answer visitors in at most 80 words using only the facts given, and invite them to leave details for a person to follow up. No legal or tax advice.`,
    `Recent conversation:\n${history.slice(-4).map((h) => `${h.role}: ${h.content}`).join("\n")}\n\nQuestion: ${q}\n\nFacts:\n${text}`,
    260,
  );
  return { text: ai?.trim() || text, links, engine: ai ? "claude" : "rules" };
}

function dedupe(l: JevLink[]) {
  const seen = new Set<string>();
  return l.filter((x) => (seen.has(x.href + x.label) ? false : (seen.add(x.href + x.label), true))).slice(0, 6);
}

export async function jevChat(q: string, surface: Surface, u: SessionUser | null, history: ChatTurn[] = []): Promise<JevReply> {
  const question = q.trim().slice(0, 600);
  let reply: JevReply;
  if (u && isStaff(u) && surface === "console") reply = await staffAnswer(question, u, history);
  else if (u && u.personId && (u.role === "candidate" || u.role === "participant") && (surface === u.brandSlug || surface === "console")) reply = await memberAnswer(question, u, history);
  else reply = await publicAnswer(question, surface === "console" ? "group" : surface, history);
  db.insert(s.jevQueries).values({ userId: u?.id ?? null, question: `[${surface}] ${question}`, interpreted: { surface, links: reply.links.length }, resultCount: reply.links.length, engine: reply.engine, createdAt: nowTs() }).run();
  return reply;
}
