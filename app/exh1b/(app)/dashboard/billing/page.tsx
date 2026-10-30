import { and, desc, eq } from "drizzle-orm";
import { requireMember, subscriptionOf } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { subscribe, cancelSubscription } from "@/app/actions/exh1b";
import { ActionButton } from "@/components/client";
import { Badge, Card, Notice } from "@/components/ui";
import { fmtDate, money } from "@/lib/time";

export const metadata = { title: "Billing" };

export default async function Billing({ searchParams }: { searchParams: Promise<{ region?: string; paid?: string; reason?: string }> }) {
  const sp = await searchParams;
  const { person } = await requireMember();
  const detected = person.countryCode === "IN" ? "IN" : "INTL";
  const region = sp.region === "IN" || sp.region === "INTL" ? sp.region : detected;
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  const plans = db.select().from(s.plans).where(and(eq(s.plans.brandId, ex.id), eq(s.plans.region, region), eq(s.plans.active, true))).all();
  const { sub, plan, active } = subscriptionOf(person.id);
  const payments = db.select().from(s.payments).where(eq(s.payments.personId, person.id)).orderBy(desc(s.payments.createdAt)).all();
  const monthly = plans.find((p) => p.interval === "month")!;
  const testMode = !process.env.RAZORPAY_KEY_ID;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">Billing</h1>
        <p className="m-0 mt-1 text-muted">Payments by Razorpay. Cancel any time; access runs to the end of the paid period.</p>
      </div>
      {sp.paid && <Notice tone="good" title="Payment received">Your membership is active. Your matches are unlocked.</Notice>}
      {sp.reason === "apply" && !active && <Notice tone="warn">Applying needs an active membership. Choose a plan below.</Notice>}
      {testMode && <Notice tone="accent" title="Razorpay test mode">No real money moves. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to take live payments.</Notice>}

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="m-0 text-sm font-bold text-faint">Current status</p>
          <p className="m-0 mt-1 font-display text-2xl font-bold">
            {active ? `${plan?.name} · ${money(plan?.amount, plan?.currency)}/${plan?.interval}` : sub ? "Cancelled" : "No membership"}
          </p>
          <p className="m-0 text-sm text-muted">{active ? `Renews ${fmtDate(sub!.currentPeriodEnd)}` : sub ? `Ended ${fmtDate(sub.currentPeriodEnd)}` : "Free profile"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {active ? <Badge tone="good">Active</Badge> : <Badge tone="warn">{sub ? "Cancelled" : "Free"}</Badge>}
          {active && (
            <ActionButton action={cancelSubscription} confirm="Cancel your membership? You'll lose access to matched roles." className="min-h-10 rounded-btn px-4 text-sm font-bold text-bad hover:bg-bad-soft">
              Cancel membership
            </ActionButton>
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-display text-xl font-bold">{active ? "Change plan" : sub ? "Resubscribe" : "Choose a plan"}</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">
            Region detected from your profile: <b className="text-ink">{detected === "IN" ? "India (INR)" : "International (USD)"}</b>
          </span>
          <a href={`?region=${region === "IN" ? "INTL" : "IN"}`} className="font-bold text-accent">
            Show {region === "IN" ? "USD" : "INR"} prices
          </a>
        </div>
      </div>
      {region !== detected && <Notice tone="warn">Prices in {region === "IN" ? "INR are for members living in India" : "USD are for members outside India"}. Your bank country is checked at payment.</Notice>}
      <div className="grid gap-4 md:grid-cols-3">
        {plans
          .sort((a, b) => a.amount - b.amount)
          .map((p) => {
            const perMonth = p.interval === "month" ? p.amount : p.interval === "quarter" ? p.amount / 3 : p.amount / 12;
            const save = Math.round((1 - perMonth / monthly.amount) * 100);
            const current = active && plan?.id === p.id;
            return (
              <Card key={p.id} className={`flex flex-col gap-3 p-6 ${p.interval === "year" ? "border-accent" : ""}`}>
                <div className="flex items-center justify-between">
                  <b className="font-display text-lg">{p.name}</b>
                  {save > 0 && <Badge tone="good">Save {save}%</Badge>}
                </div>
                <p className="m-0 font-display text-3xl font-extrabold">
                  {money(p.amount, p.currency)}
                  <span className="text-base font-semibold text-muted"> / {p.interval}</span>
                </p>
                <p className="m-0 text-xs text-muted">{money(Math.round(perMonth), p.currency)} a month</p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                  {p.features.map((f) => (
                    <li key={f}>
                      <span className="text-accent">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {current ? (
                    <Badge tone="good">Your plan</Badge>
                  ) : (
                    <ActionButton action={subscribe.bind(null, p.code)} className="min-h-11 w-full rounded-btn bg-primary px-4 font-bold text-primary-ink">
                      Pay {money(p.amount, p.currency)} with Razorpay
                    </ActionButton>
                  )}
                </div>
              </Card>
            );
          })}
      </div>

      <Card className="p-6">
        <h2 className="m-0 mb-3 font-display text-xl font-bold">Payment history</h2>
        {payments.length === 0 ? (
          <p className="m-0 text-sm text-muted">No payments yet.</p>
        ) : (
          <div className="scroll-x">
            <table className="data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtDate(p.createdAt)}</td>
                    <td className="tabular-nums">{money(p.amount, p.currency)}</td>
                    <td>
                      <Badge tone={p.status === "captured" ? "good" : "bad"}>{p.status === "captured" ? "Paid" : p.status}</Badge>
                    </td>
                    <td className="font-mono text-xs text-muted">{p.gatewayRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
