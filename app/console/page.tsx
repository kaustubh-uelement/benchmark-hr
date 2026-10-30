import Link from "next/link";
import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { Badge, JevMark, Stat } from "@/components/ui";
import { BarList, BrandChip, PageHead, Panel } from "@/components/console";
import { ActionButton } from "@/components/client";
import { runSlaSweep } from "@/app/actions/console";
import { daysAgo, money, nowTs, relTime } from "@/lib/time";
import { STAGE_LABEL } from "@/components/ui";

export const metadata = { title: "Dashboard" };

export default async function ConsoleHome() {
  const ctx = await consoleCtx();
  const { u, pickedId, byId, brands } = ctx;
  const sc = (col: Parameters<typeof brandCond>[0]) => brandCond(col, u, pickedId);
  const n = (q: { n: number } | undefined) => q?.n ?? 0;

  const openMandates = n(db.select({ n: sql<number>`count(*)` }).from(s.mandates).where(and(eq(s.mandates.status, "open"), sc(s.mandates.brandId))).get());
  const active = n(db.select({ n: sql<number>`count(*)` }).from(s.engagements).where(and(inArray(s.engagements.stage, ["applied", "screening", "shortlisted", "interview", "offer", "enrolled"]), sc(s.engagements.brandId))).get());
  const placed90 = n(db.select({ n: sql<number>`count(*)` }).from(s.engagements).where(and(eq(s.engagements.stage, "placed"), gte(s.engagements.updatedAt, daysAgo(90)), sc(s.engagements.brandId))).get());
  const newLeads = n(db.select({ n: sql<number>`count(*)` }).from(s.leads).where(and(eq(s.leads.status, "new"), sc(s.leads.brandId))).get());
  const lateTickets = db.select().from(s.tickets).where(and(inArray(s.tickets.status, ["open", "in_progress"]), isNull(s.tickets.firstResponseAt), lt(s.tickets.slaDueAt, nowTs()), sc(s.tickets.brandId))).all();
  const invoices = db.select().from(s.invoices).where(sc(s.invoices.brandId)).all();
  const collected = invoices.filter((i) => i.status === "paid" && i.paidAt && i.paidAt >= daysAgo(365)).reduce((a, i) => a + (i.currency === "INR" ? i.amount : i.amount * 88), 0);
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((a, i) => a + (i.currency === "INR" ? i.amount : i.amount * 88), 0);
  const drafts = invoices.filter((i) => i.status === "draft");
  const subs = db
    .select({ sub: s.subscriptions, plan: s.plans })
    .from(s.subscriptions)
    .innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId))
    .where(and(eq(s.subscriptions.status, "active"), sc(s.subscriptions.brandId)))
    .all();
  const mrrInr = subs.reduce((a, r) => a + (r.plan.currency === "INR" ? r.plan.amount : r.plan.amount * 88) / (r.plan.interval === "year" ? 12 : r.plan.interval === "quarter" ? 3 : 1), 0);
  const proposals = db
    .select({ e: s.engagements, m: s.mandates })
    .from(s.engagements)
    .innerJoin(s.mandates, eq(s.mandates.id, s.engagements.mandateId))
    .where(and(eq(s.engagements.stage, "sourced"), eq(s.engagements.source, "jev"), sc(s.engagements.brandId)))
    .all();
  const propByMandate = Object.values(
    proposals.reduce<Record<number, { m: (typeof proposals)[number]["m"]; n: number }>>((a, r) => ((a[r.m.id] ??= { m: r.m, n: 0 }).n++, a), {}),
  );
  const dueLeads = db.select().from(s.leads).where(and(eq(s.leads.status, "new"), lt(s.leads.respondBy, nowTs()), sc(s.leads.brandId))).orderBy(desc(s.leads.score)).limit(5).all();

  const stageRows = db
    .select({ stage: s.engagements.stage, n: sql<number>`count(*)` })
    .from(s.engagements)
    .where(and(inArray(s.engagements.stage, ["sourced", "applied", "screening", "shortlisted", "interview", "offer", "placed"]), sc(s.engagements.brandId)))
    .groupBy(s.engagements.stage)
    .all();
  const funnel = ["sourced", "applied", "screening", "shortlisted", "interview", "offer", "placed"].map((st) => ({ label: STAGE_LABEL[st], value: stageRows.find((r) => r.stage === st)?.n ?? 0 }));

  const perBrand = brands
    .filter((b) => b.kind === "subsidiary" && (!pickedId || b.id === pickedId))
    .map((b) => ({
      b,
      open: n(db.select({ n: sql<number>`count(*)` }).from(s.mandates).where(and(eq(s.mandates.brandId, b.id), eq(s.mandates.status, "open"))).get()),
      fees: invoices.filter((i) => i.brandId === b.id && i.status === "paid").reduce((a, i) => a + (i.currency === "INR" ? i.amount : i.amount * 88), 0),
      people: n(db.select({ n: sql<number>`count(distinct person_id)` }).from(s.personBrands).where(eq(s.personBrands.brandId, b.id)).get()),
    }));

  const runs = db.select().from(s.jevRuns).where(pickedId ? eq(s.jevRuns.brandId, pickedId) : undefined).orderBy(desc(s.jevRuns.createdAt)).limit(9).all();
  const runs7 = n(db.select({ n: sql<number>`count(*)` }).from(s.jevRuns).where(gte(s.jevRuns.createdAt, daysAgo(7))).get());
  const totalPeople = n(db.select({ n: sql<number>`count(*)` }).from(s.people).get());

  return (
    <>
      <PageHead
        eyebrow={ctx.picked ? ctx.picked.name : "All businesses"}
        title={`Good ${new Date().getUTCHours() + 5.5 < 12 ? "morning" : new Date().getUTCHours() + 5.5 < 17 ? "afternoon" : "evening"}, ${u.name.split(" ")[0]}`}
        sub={`${totalPeople.toLocaleString("en-IN")} people and ${openMandates} open mandates on one database. Jev ran ${runs7} automations in the last 7 days.`}
        actions={
          <>
            <ActionButton action={runSlaSweep} className="inline-flex min-h-10 items-center rounded-btn border-[1.5px] border-line px-4 text-sm font-bold hover:bg-bg-2">
              Run SLA sweep
            </ActionButton>
            <Link href="/console/mandates/new" className="inline-flex min-h-10 items-center rounded-btn bg-primary px-4 text-sm font-bold text-primary-ink no-underline">
              New mandate
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Open mandates" value={openMandates} sub={`${active} people in active stages`} />
        <Stat label="Placed, 90 days" value={placed90} tone="good" />
        <Stat label="New leads" value={newLeads} sub={dueLeads.length ? `${dueLeads.length} past reply-by` : "All within reply-by"} tone={dueLeads.length ? "warn" : undefined} />
        <Stat label="Tickets past SLA" value={lateTickets.length} tone={lateTickets.length ? "bad" : "good"} />
        <Stat label="Fees collected, 12 mo" value={money(Math.round(collected), "INR", true)} sub={`${money(Math.round(outstanding), "INR", true)} outstanding`} />
        <Stat label="ExH1B MRR" value={money(Math.round(mrrInr), "INR", true)} sub={`${subs.length} active members`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Panel title="Needs your attention" action={<JevMark />}>
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {propByMandate.slice(0, 4).map(({ m, n: k }) => (
              <li key={`p${m.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <b>Jev proposed {k} people</b> for {m.title}
                  <span className="block text-xs text-muted">Approve or decline before anyone is contacted</span>
                </span>
                <span className="flex items-center gap-2">
                  <BrandChip slug={byId[m.brandId].slug} name={byId[m.brandId].shortName} />
                  <Link href={`/console/mandates/${m.id}#proposals`} className="text-sm font-bold text-accent">
                    Review
                  </Link>
                </span>
              </li>
            ))}
            {propByMandate.length > 4 && (
              <li className="py-2.5 text-sm">
                <Link href="/console/mandates?view=proposals" className="font-bold text-accent">
                  {propByMandate.length - 4} more mandates have Jev proposals waiting →
                </Link>
              </li>
            )}
            {lateTickets.slice(0, 4).map((t) => (
              <li key={`t${t.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <b>{t.subject}</b>
                  <span className="block text-xs text-muted">
                    {t.category} · was due {relTime(t.slaDueAt)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone="bad">{t.escalated ? "Escalated" : "Past SLA"}</Badge>
                  <Link href={`/console/tickets?id=${t.id}`} className="text-sm font-bold text-accent">
                    Reply
                  </Link>
                </span>
              </li>
            ))}
            {dueLeads.map((l) => (
              <li key={`l${l.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <b>{l.name}</b>
                  {l.company ? `, ${l.company}` : ""}
                  <span className="block text-xs text-muted">
                    {l.kind.replace("_", " ")} · score {l.score ?? "—"} · reply was due {relTime(l.respondBy)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <BrandChip slug={byId[l.brandId].slug} name={byId[l.brandId].shortName} />
                  <Link href={`/console/leads?id=${l.id}`} className="text-sm font-bold text-accent">
                    Open
                  </Link>
                </span>
              </li>
            ))}
            {drafts.slice(0, 3).map((i) => (
              <li key={`i${i.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <b>Draft invoice {i.number}</b>
                  <span className="block text-xs text-muted">
                    {i.description} · {money(i.amount, i.currency)} · prepared by {i.createdBy ?? "finance"}
                  </span>
                </span>
                <Link href="/console/billing" className="text-sm font-bold text-accent">
                  Review
                </Link>
              </li>
            ))}
            {!propByMandate.length && !lateTickets.length && !dueLeads.length && !drafts.length && <li className="py-6 text-center text-muted">Nothing waiting. Well done.</li>}
          </ul>
        </Panel>

        <Panel title="Pipeline across mandates">
          <BarList rows={funnel} unit="people" />
          <p className="m-0 mt-4 text-xs text-faint">Everyone in a stage now, across {ctx.picked ? ctx.picked.shortName : "every business"}.</p>
        </Panel>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Panel title="By business" pad={false}>
          <div className="scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Open mandates</th>
                  <th>People</th>
                  <th>Fees collected</th>
                </tr>
              </thead>
              <tbody>
                {perBrand.map((r) => (
                  <tr key={r.b.id}>
                    <td>
                      <BrandChip slug={r.b.slug} name={r.b.name} />
                    </td>
                    <td className="tabular-nums">{r.open}</td>
                    <td className="tabular-nums">{r.people.toLocaleString("en-IN")}</td>
                    <td className="tabular-nums">{money(Math.round(r.fees), "INR", true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Jev activity" action={<Link href="/console/jev" className="text-sm font-bold text-accent">All automations</Link>}>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {runs.map((r) => (
              <li key={r.id} className="flex gap-3 text-sm">
                <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${r.status === "ok" ? "bg-good" : r.status === "skipped" ? "bg-warn" : "bg-bad"}`} aria-hidden="true" />
                <span className="min-w-0">
                  <b className="font-semibold">{r.summary}</b>
                  <span className="block text-xs text-faint">
                    {r.automationKey} · {r.engine === "claude" ? "Claude" : "rules"} · {relTime(r.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
