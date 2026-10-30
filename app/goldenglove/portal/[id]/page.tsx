import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { clientMandate, presented, requirePortal, searchStage, SEARCH_STAGES, stageCounts } from "@/lib/portal";
import { GGEyebrow, GGRule } from "@/components/goldenglove";
import { DecisionForm } from "@/components/DecisionForm";
import { ActionForm, SubmitButton } from "@/components/client";
import { clientMessage } from "@/app/actions/portal";
import { fmtDate, money, relTime } from "@/lib/time";

export const metadata = { title: "Search" };

export default async function GGSearch({ params }: { params: Promise<{ id: string }> }) {
  const { u, brand } = await requirePortal("golden-glove");
  const m = clientMandate(u.orgId, brand.id, Number((await params).id));
  if (!m) notFound();
  const c = stageCounts(m.id);
  const st = searchStage(c, m.status);
  const list = presented(m.id);
  const owner = m.ownerUserId ? db.select().from(s.users).where(eq(s.users.id, m.ownerUserId)).get() : null;
  const invoices = db.select().from(s.invoices).where(and(eq(s.invoices.mandateId, m.id))).orderBy(desc(s.invoices.id)).all();
  const updates = db
    .select()
    .from(s.interactions)
    .where(and(eq(s.interactions.mandateId, m.id)))
    .orderBy(desc(s.interactions.occurredAt))
    .limit(8)
    .all()
    .filter((i) => i.kind !== "note" || i.userId === u.id);

  return (
    <>
      <Link href="/goldenglove/portal" className="text-[12px] uppercase tracking-[.24em] text-muted no-underline hover:text-[var(--gold-1)]">
        ← All searches
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <GGEyebrow>
            {m.confidential ? "Confidential search" : "Search"} · {m.locationLabel}
          </GGEyebrow>
          <h1 className="m-0 mt-3 font-display text-[clamp(44px,5.4vw,80px)] font-medium leading-none">{m.title}</h1>
          <p className="m-0 mt-3 text-muted">
            Opened {fmtDate(m.openedAt)} · target {fmtDate(m.targetDate)} · led by {owner?.name}
          </p>
        </div>
        <span className="border border-[var(--gold-3)] px-4 py-2 text-[12px] uppercase tracking-[.24em] text-[var(--gold-1)]">{m.status === "filled" ? "Appointed" : `Now: ${SEARCH_STAGES[st]}`}</span>
      </div>

      <ol className="m-0 mt-12 grid list-none grid-cols-2 gap-x-6 gap-y-6 p-0 sm:grid-cols-4 lg:grid-cols-7">
        {SEARCH_STAGES.map((sname, i) => (
          <li key={sname} className="flex flex-col gap-2">
            <span className={`h-[3px] ${i <= st ? "bg-[linear-gradient(90deg,var(--gold-2),var(--gold-1))]" : "bg-line"}`} />
            <span className={`text-[12px] uppercase tracking-[.18em] ${i === st ? "text-[var(--gold-1)]" : i < st ? "text-ink" : "text-faint"}`}>
              {String(i + 1).padStart(2, "0")} {sname}
            </span>
          </li>
        ))}
      </ol>

      <section className="mt-14 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4" aria-label="The market so far">
        {[
          ["People approached", c.approached, "Every conversation partner-led"],
          ["Assessed in depth", c.assessed, "Capability, leadership, stakeholders"],
          ["Presented to you", c.shortlisted, "With our view on each"],
          ["Meeting you", c.interview, c.offer ? `${c.offer} at offer stage` : "Interviews in your diary"],
        ].map(([k, v, d]) => (
          <div key={k as string} className="bg-card p-7">
            <span className="text-[12px] uppercase tracking-[.22em] text-muted">{k}</span>
            <p className="m-0 mt-3 font-display text-[56px] leading-none text-[var(--gold-1)]">{v}</p>
            <p className="m-0 mt-2 text-sm text-faint">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <GGEyebrow>The shortlist</GGEyebrow>
        <h2 className="m-0 mt-3 font-display text-[44px] font-medium">{list.length ? `${list.length} leaders, with our view` : "Your shortlist is being prepared"}</h2>
        {!list.length && <p className="text-muted">Your partner presents the shortlist around week five. You&apos;ll see each person here once they agree to be considered.</p>}
        <div className="mt-8 flex flex-col gap-6">
          {list.map(({ e, p }) => (
            <article key={e.id} className="grid gap-8 border border-line bg-card p-7 sm:p-9 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="m-0 font-display text-[36px] font-medium leading-tight">
                    {p.firstName} {p.lastName}
                  </h3>
                  <span className="text-[11.5px] uppercase tracking-[.22em] text-[var(--gold-1)]">{e.stage === "interview" ? "Meeting scheduled" : e.stage === "offer" ? "Offer stage" : e.stage === "placed" ? "Appointed" : "Presented"}</span>
                </div>
                <p className="m-0 mt-1 text-muted">
                  {[p.currentTitle, p.currentCompany].filter(Boolean).join(", ")} · {p.locationLabel}
                </p>
                <GGRule className="my-6 !bg-[linear-gradient(90deg,var(--gold-3),transparent)]" />
                <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  {[
                    ["Experience", p.yearsExperience != null ? `${Math.round(p.yearsExperience)} years` : "—"],
                    ["Level", p.seniority ?? "—"],
                    ["Notice", p.noticePeriod ?? "To confirm"],
                    ["Fit with brief", e.matchScore != null ? `${e.matchScore}%` : "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-faint">{k}</dt>
                      <dd className="m-0 mt-0.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                {e.notes && (
                  <blockquote className="m-0 mt-6 border-l-2 border-[var(--gold-2)] pl-5 font-display text-[22px] italic leading-snug">
                    “{e.notes}”
                    <span className="mt-2 block font-body text-xs not-italic text-muted">— {owner?.name}, your partner</span>
                  </blockquote>
                )}
                {!!e.matchReasons?.reasons.length && (
                  <ul className="m-0 mt-6 flex list-none flex-wrap gap-2 p-0">
                    {e.matchReasons.reasons.slice(0, 4).map((r) => (
                      <li key={r} className="border border-line px-3 py-1.5 text-xs text-muted">
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col justify-between gap-6 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <div>
                  <span className="text-[12px] uppercase tracking-[.22em] text-muted">Your decision</span>
                  <p className="m-0 mt-2 text-sm font-light text-muted">Tell your partner whether you&apos;d like to meet. Only Golden Glove sees this.</p>
                </div>
                <DecisionForm engagementId={e.id} current={e.clientDecision} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <GGEyebrow>Latest from your partner</GGEyebrow>
          <ul className="m-0 mt-5 flex list-none flex-col border-t border-line p-0">
            {updates.map((i) => (
              <li key={i.id} className="border-b border-line py-4 text-sm">
                {i.summary}
                <span className="block text-xs text-faint">{relTime(i.occurredAt)}</span>
              </li>
            ))}
            {!updates.length && <li className="py-4 text-sm text-muted">Updates appear here as the search moves.</li>}
          </ul>
          {invoices.length > 0 && (
            <>
              <h3 className="mb-0 mt-10 text-[12px] font-medium uppercase tracking-[.28em] text-[var(--gold-2)]">Retainers for this search</h3>
              <ul className="m-0 mt-3 flex list-none flex-col p-0 text-sm">
                {invoices.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 border-b border-line py-3">
                    <span>{i.description}</span>
                    <span>
                      {money(i.amount, i.currency)} · <span className={i.status === "paid" ? "text-good" : i.status === "overdue" ? "text-bad" : "text-[var(--gold-1)]"}>{i.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="border border-[var(--gold-3)] bg-card p-7 sm:p-9">
          <GGEyebrow>Message {owner?.name.split(" ")[0] ?? "your partner"}</GGEyebrow>
          <ActionForm action={clientMessage} className="mt-5 flex flex-col gap-3">
            <input type="hidden" name="mandateId" value={m.id} />
            <input type="hidden" name="subject" value={`${m.title}: message from ${u.name}`} />
            <textarea name="body" rows={5} className="field" placeholder="A question, a change to the brief, or a name we should look at." aria-label="Message" />
            <div>
              <SubmitButton className="!rounded-none !text-[12px] !uppercase !tracking-[.22em]">Send</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </section>
    </>
  );
}
