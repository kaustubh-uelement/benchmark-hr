import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { Badge, Stat } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { BrandChip, PageHead, Panel, Tabs } from "@/components/console";
import { setInvoiceStatus } from "@/app/actions/console";
import { fmtDate, money, nowTs } from "@/lib/time";

export const metadata = { title: "Billing" };

export default async function Billing({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "invoices" } = await searchParams;
  const ctx = await consoleCtx();
  const inv = db
    .select({ i: s.invoices, org: s.organisations.name })
    .from(s.invoices)
    .leftJoin(s.organisations, eq(s.organisations.id, s.invoices.orgId))
    .where(brandCond(s.invoices.brandId, ctx.u, ctx.pickedId))
    .orderBy(desc(s.invoices.id))
    .all();
  const sum = (f: (i: (typeof inv)[number]["i"]) => boolean) => inv.filter((r) => f(r.i)).reduce((a, r) => a + r.i.amount, 0);
  const overdue = (i: (typeof inv)[number]["i"]) => i.status === "overdue" || (i.status === "sent" && !!i.dueAt && i.dueAt < nowTs());
  const subs = db
    .select({ sub: s.subscriptions, plan: s.plans, p: s.people })
    .from(s.subscriptions)
    .innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId))
    .innerJoin(s.people, eq(s.people.id, s.subscriptions.personId))
    .where(brandCond(s.subscriptions.brandId, ctx.u, ctx.pickedId))
    .orderBy(desc(s.subscriptions.startedAt))
    .all();
  const pays = db
    .select({ pay: s.payments, p: s.people })
    .from(s.payments)
    .leftJoin(s.people, eq(s.people.id, s.payments.personId))
    .innerJoin(s.subscriptions, eq(s.subscriptions.id, s.payments.subscriptionId))
    .where(and(brandCond(s.subscriptions.brandId, ctx.u, ctx.pickedId)))
    .orderBy(desc(s.payments.createdAt))
    .limit(60)
    .all();
  const activeSubs = subs.filter((r) => r.sub.status === "active");
  const mrr = activeSubs.reduce((a, r) => a + (r.plan.currency === "INR" ? r.plan.amount : r.plan.amount * 88) / (r.plan.interval === "year" ? 12 : r.plan.interval === "quarter" ? 3 : 1), 0);

  return (
    <>
      <PageHead title="Billing" sub="Client fee invoices for search, hiring, outplacement and advisory, and member subscriptions through Razorpay, on one ledger." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Collected" value={money(sum((i) => i.status === "paid"), "INR", true)} tone="good" />
        <Stat label="Outstanding" value={money(sum((i) => i.status === "sent"), "INR", true)} />
        <Stat label="Overdue" value={money(sum(overdue), "INR", true)} tone={sum(overdue) ? "bad" : undefined} />
        <Stat label="Subscription MRR" value={money(Math.round(mrr), "INR", true)} sub={`${activeSubs.length} active · ${subs.filter((r) => r.sub.status !== "active").length} lapsed or cancelled`} />
      </div>
      <Tabs
        active={tab}
        items={[
          { key: "invoices", label: `Client invoices · ${inv.length}`, href: "/console/billing?tab=invoices" },
          { key: "subs", label: `Subscriptions · ${subs.length}`, href: "/console/billing?tab=subs" },
          { key: "payments", label: "Payments", href: "/console/billing?tab=payments" },
        ]}
      />
      {tab === "invoices" && (
        <Panel pad={false}>
          <div className="scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Business</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {inv.map(({ i, org }) => (
                  <tr key={i.id}>
                    <td className="min-w-[230px]">
                      <b>{i.number}</b>
                      <span className="block text-xs text-muted">
                        {i.mandateId ? <Link href={`/console/mandates/${i.mandateId}`}>{i.description}</Link> : i.description}
                        {i.createdBy === "Jev" && <Badge tone="accent" className="ml-1">✦ drafted by Jev</Badge>}
                      </span>
                    </td>
                    <td>{org}</td>
                    <td>
                      <BrandChip slug={ctx.byId[i.brandId].slug} name={ctx.byId[i.brandId].shortName} />
                    </td>
                    <td className="whitespace-nowrap tabular-nums">{money(i.amount, i.currency)}</td>
                    <td className="whitespace-nowrap">{i.status === "paid" ? `paid ${fmtDate(i.paidAt)}` : fmtDate(i.dueAt)}</td>
                    <td>
                      <Badge tone={i.status === "paid" ? "good" : overdue(i) ? "bad" : i.status === "draft" ? "neutral" : "warn"}>{overdue(i) ? "overdue" : i.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap">
                      {i.status === "draft" && (
                        <ActionButton action={setInvoiceStatus.bind(null, i.id, "sent")} className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-ink">
                          Approve & send
                        </ActionButton>
                      )}
                      {(i.status === "sent" || i.status === "overdue") && (
                        <ActionButton action={setInvoiceStatus.bind(null, i.id, "paid")} className="rounded-full border border-line px-3 py-1 text-xs font-bold">
                          Mark paid
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {tab === "subs" && (
        <Panel pad={false}>
          <div className="scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Plan</th>
                  <th>Region</th>
                  <th>Price</th>
                  <th>Period ends</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(({ sub, plan, p }) => (
                  <tr key={sub.id}>
                    <td>
                      <Link href={`/console/people/${p.id}`} className="font-bold">
                        {p.firstName} {p.lastName}
                      </Link>
                      <span className="block text-xs text-muted">{p.locationLabel}</span>
                    </td>
                    <td>{plan.name}</td>
                    <td>{plan.region === "IN" ? "India" : "International"}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {money(plan.amount, plan.currency)}/{plan.interval}
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(sub.currentPeriodEnd)}</td>
                    <td>
                      <Badge tone={sub.status === "active" ? "good" : sub.status === "past_due" ? "bad" : "neutral"}>{sub.status.replace("_", " ")}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
      {tab === "payments" && (
        <Panel pad={false}>
          <div className="scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Gateway ref</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pays.map(({ pay, p }) => (
                  <tr key={pay.id}>
                    <td className="whitespace-nowrap">{fmtDate(pay.createdAt)}</td>
                    <td>{p ? `${p.firstName} ${p.lastName}` : "—"}</td>
                    <td className="tabular-nums">{money(pay.amount, pay.currency)}</td>
                    <td className="font-mono text-xs">{pay.gatewayRef}</td>
                    <td>
                      <Badge tone={pay.status === "captured" ? "good" : pay.status === "refunded" ? "neutral" : "bad"}>{pay.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  );
}
