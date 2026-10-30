import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { canSeeMandate } from "@/lib/access";
import { rankForMandate } from "@/lib/jev/engine";
import { Avatar, Badge, JevMark, Notice, ScoreRing, STAGE_LABEL, StageBadge } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton } from "@/components/client";
import { ActionSelect, JevDraft } from "@/components/console-client";
import { BrandChip, KV, PageHead, Panel } from "@/components/console";
import { addToMandate, enrolParticipant, moveEngagement, outreachDraft, rerunShortlist, reviewProposal, setDeliverableStatus, setMandateStatus, setSessionStatus } from "@/app/actions/console";
import { fmtDate, money, relTime } from "@/lib/time";
import type { Stage } from "@/lib/db/schema";

export const metadata = { title: "Mandate" };

const PIPE: Record<string, Stage[]> = {
  search: ["sourced", "screening", "shortlisted", "interview", "offer", "placed"],
  job: ["sourced", "applied", "screening", "shortlisted", "interview", "offer", "placed"],
};

export default async function MandatePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const ctx = await consoleCtx();
  const m = db.select().from(s.mandates).where(eq(s.mandates.id, Number(id))).get();
  if (!m || !canSeeMandate(ctx.u, m)) notFound();
  const brand = ctx.byId[m.brandId];
  const org = m.orgId ? db.select().from(s.organisations).where(eq(s.organisations.id, m.orgId)).get() : null;
  const owner = m.ownerUserId ? db.select().from(s.users).where(eq(s.users.id, m.ownerUserId)).get() : null;
  const fam = m.familyId ? db.select().from(s.jobFamilies).where(eq(s.jobFamilies.id, m.familyId)).get() : null;
  const eng = db
    .select({ e: s.engagements, p: s.people })
    .from(s.engagements)
    .innerJoin(s.people, eq(s.people.id, s.engagements.personId))
    .where(eq(s.engagements.mandateId, m.id))
    .orderBy(desc(s.engagements.matchScore))
    .all();
  const proposals = eng.filter((r) => r.e.stage === "sourced" && r.e.source === "jev");
  const inPipe = eng.filter((r) => !(r.e.stage === "sourced" && r.e.source === "jev"));
  const invoices = db.select().from(s.invoices).where(eq(s.invoices.mandateId, m.id)).all();
  const activity = db
    .select({ i: s.interactions, who: s.users.name })
    .from(s.interactions)
    .leftJoin(s.users, eq(s.users.id, s.interactions.userId))
    .where(eq(s.interactions.mandateId, m.id))
    .orderBy(desc(s.interactions.occurredAt))
    .limit(12)
    .all();
  const stages = PIPE[m.kind] ?? [];
  const stageOptions = [...stages, "rejected", "withdrawn"].map((v) => ({ value: v, label: STAGE_LABEL[v] }));
  const suggestions = m.kind === "search" || m.kind === "job" ? rankForMandate(m, 30).filter((r) => !eng.some((e) => e.p.id === r.p.id)).slice(0, 6) : [];

  return (
    <>
      <PageHead
        eyebrow={
          <span className="flex flex-wrap items-center gap-2">
            <Link href="/console/mandates" className="no-underline">
              ← Mandates
            </Link>
            <BrandChip slug={brand.slug} name={brand.name} />
            {m.confidential && <Badge tone="dark">Confidential</Badge>}
          </span>
        }
        title={m.title}
        sub={`${org?.name ?? "Internal"} · ${m.locationLabel ?? ""} · opened ${fmtDate(m.openedAt)}`}
        actions={
          <>
            <ActionSelect
              label="Mandate status"
              value={m.status}
              options={[
                { value: "open", label: "Open" },
                { value: "on_hold", label: "On hold" },
                { value: "filled", label: "Filled" },
                { value: "closed", label: "Closed" },
              ]}
              onPick={setMandateStatus.bind(null, m.id) as (v: string) => Promise<void>}
              className="!min-h-10 !text-sm"
            />
            {(m.kind === "search" || m.kind === "job") && (
              <ActionButton action={rerunShortlist.bind(null, m.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-accent px-4 text-sm font-bold text-accent-ink">
                ✦ Ask Jev for a longlist
              </ActionButton>
            )}
          </>
        }
      />
      {created && (
        <div className="mb-5">
          <Notice tone="good" title="Mandate opened">
            {proposals.length ? `Jev searched the consented group database and proposed ${proposals.length} people below. Nobody is contacted until you approve.` : "Saved. Jev's longlist runs for Golden Glove searches and Talent roles."}
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {proposals.length > 0 && (
            <Panel title={<span id="proposals">Jev proposals · {proposals.length} waiting for review</span>} action={<JevMark />}>
              <p className="m-0 mb-4 text-sm text-muted">Drawn only from people who agreed to AI matching and either belong to {brand.shortName} or agreed to group sharing. Approving moves them to screening; declining removes them.</p>
              <ul className="m-0 grid list-none gap-3 p-0 lg:grid-cols-2">
                {proposals.map(({ e, p }) => (
                  <li key={e.id} className="flex flex-col gap-3 rounded-card border border-line bg-card-2 p-4">
                    <div className="flex items-start gap-3">
                      <ScoreRing score={e.matchScore ?? 0} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/console/people/${p.id}`} className="font-bold no-underline hover:underline">
                          {p.firstName} {p.lastName}
                        </Link>
                        <span className="block text-sm text-muted">
                          {p.currentTitle}
                          {p.currentCompany ? `, ${p.currentCompany}` : ""}
                        </span>
                        <span className="block text-xs text-faint">
                          {p.locationLabel} · {p.yearsExperience != null ? `${Math.round(p.yearsExperience)} yrs` : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs leading-relaxed">
                      {e.matchReasons?.reasons.slice(0, 3).map((r) => (
                        <span key={r} className="block text-good">
                          ✓ {r}
                        </span>
                      ))}
                      {e.matchReasons?.gaps.slice(0, 2).map((r) => (
                        <span key={r} className="block text-warn">
                          △ {r}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionButton action={reviewProposal.bind(null, e.id, true)} className="inline-flex min-h-8 items-center rounded-full bg-primary px-3 text-xs font-bold text-primary-ink">
                        Approve
                      </ActionButton>
                      <ActionButton action={reviewProposal.bind(null, e.id, false)} className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs font-bold">
                        Decline
                      </ActionButton>
                    </div>
                    <JevDraft action={outreachDraft} fields={{ personId: p.id, mandateId: m.id }} label="Draft first approach" />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {stages.length > 0 && (
            <Panel title={`Pipeline · ${inPipe.length} people`} pad={false}>
              <div className="scroll-x">
                <div className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(176px,1fr))` }}>
                  {stages.map((st) => {
                    const col = inPipe.filter((r) => r.e.stage === st);
                    return (
                      <div key={st} className="flex flex-col gap-2 rounded-[12px] bg-bg-2 p-2.5">
                        <div className="flex items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-faint">
                          {STAGE_LABEL[st]}
                          <span>{col.length}</span>
                        </div>
                        {col.slice(0, 12).map(({ e, p }) => (
                          <div key={e.id} className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-card-2 p-2.5 text-sm">
                            <Link href={`/console/people/${p.id}`} className="font-bold leading-tight no-underline hover:underline">
                              {p.firstName} {p.lastName}
                            </Link>
                            <span className="line-clamp-2 text-xs text-muted">{p.currentTitle}</span>
                            <span className="flex items-center gap-1.5 text-[11px] text-faint">
                              {e.matchScore != null && <b className="text-ink">{e.matchScore}%</b>}
                              {e.source}
                              {e.clientDecision && e.clientDecision !== "pending" && <Badge tone={e.clientDecision === "interested" ? "good" : "bad"}>client {e.clientDecision}</Badge>}
                            </span>
                            <ActionSelect label={`Stage for ${p.firstName}`} value={e.stage} options={stageOptions} onPick={moveEngagement.bind(null, e.id) as (v: string) => Promise<void>} />
                          </div>
                        ))}
                        {col.length > 12 && <span className="px-1 text-xs text-muted">+{col.length - 12} more</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {eng.some((r) => ["rejected", "withdrawn"].includes(r.e.stage)) && (
                <p className="m-0 border-t border-line px-5 py-3 text-xs text-muted">{eng.filter((r) => ["rejected", "withdrawn"].includes(r.e.stage)).length} not progressing or withdrawn (kept on their records).</p>
              )}
            </Panel>
          )}

          {m.kind === "outplacement" && <Outplacement mandateId={m.id} rows={eng} />}
          {m.kind === "advisory" && <AdvisoryWork mandateId={m.id} />}

          {suggestions.length > 0 && (
            <Panel title="More people Jev would consider" action={<JevMark />}>
              <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                {suggestions.map((r) => (
                  <li key={r.p.id} className="flex flex-wrap items-center gap-3 py-3">
                    <ScoreRing score={r.score} size={44} />
                    <span className="min-w-0 flex-1">
                      <Link href={`/console/people/${r.p.id}`} className="font-bold no-underline hover:underline">
                        {r.p.firstName} {r.p.lastName}
                      </Link>
                      <span className="block text-xs text-muted">
                        {r.p.currentTitle} · {r.p.locationLabel} · {r.reasons.slice(0, 2).join("; ")}
                      </span>
                    </span>
                    <ActionButton action={addToMandate.bind(null, r.p.id, m.id)} className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs font-bold hover:bg-bg-2">
                      Add to pipeline
                    </ActionButton>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Panel title="Brief">
            <KV
              items={[
                ["Client", org ? <Link href={`/console/organisations/${org.id}`}>{org.name}</Link> : "—"],
                ["Family", fam?.name],
                ["Seniority", m.seniority],
                ["Location", `${m.locationLabel ?? "—"} · ${m.workMode ?? ""}`],
                ["Experience", m.minYears ? `${m.minYears}+ years` : "—"],
                ["Salary band", m.salaryMin ? `${money(m.salaryMin, m.currency ?? "INR", true)} – ${money(m.salaryMax, m.currency ?? "INR", true)}` : "—"],
                ["Fee", `${money(m.feeAmount, m.feeCurrency ?? "INR")} · ${m.feeModel ?? ""}`],
                ["Openings", m.openings],
                ["Owner", owner?.name],
                ["Target", fmtDate(m.targetDate)],
              ]}
            />
            {m.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {m.skills.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
              </div>
            )}
            {m.description && <p className="m-0 mt-4 text-sm leading-relaxed text-muted">{m.description}</p>}
          </Panel>
          <Panel title="Invoices">
            {invoices.length === 0 ? (
              <p className="m-0 text-sm text-muted">None yet. When someone is marked Placed, Jev drafts the fee invoice for review.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span>
                      <b>{i.number}</b>
                      <span className="block text-xs text-muted">{i.description}</span>
                    </span>
                    <span className="text-right">
                      {money(i.amount, i.currency, true)}
                      <Badge tone={i.status === "paid" ? "good" : i.status === "overdue" ? "bad" : i.status === "draft" ? "neutral" : "warn"} className="ml-1">
                        {i.status}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Activity">
            {activity.length === 0 ? (
              <p className="m-0 text-sm text-muted">No activity logged yet.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
                {activity.map(({ i, who }) => (
                  <li key={i.id}>
                    {i.summary}
                    <span className="block text-xs text-faint">
                      {who ?? "System"} · {relTime(i.occurredAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}

type EngRow = { e: typeof s.engagements.$inferSelect; p: typeof s.people.$inferSelect };

function Outplacement({ mandateId, rows }: { mandateId: number; rows: EngRow[] }) {
  const people = rows.filter((r) => ["enrolled", "placed", "withdrawn"].includes(r.e.stage));
  const ids = people.map((r) => r.p.id);
  const sessions = ids.length ? db.select().from(s.coachingSessions).where(and(eq(s.coachingSessions.mandateId, mandateId), inArray(s.coachingSessions.personId, ids))).orderBy(asc(s.coachingSessions.scheduledAt)).all() : [];
  const matched = ids.length ? db.select({ personId: s.engagements.personId }).from(s.engagements).where(and(inArray(s.engagements.personId, ids), inArray(s.engagements.stage, ["matched", "applied", "screening", "interview", "offer"]))).all() : [];
  return (
    <>
      <Panel title={`Participants · ${people.length}`} pad={false}>
        <div className="scroll-x">
          <table className="data">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Coaching</th>
                <th>Next session</th>
                <th>Openings in play</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {people.map(({ e, p }) => {
                const ss = sessions.filter((x) => x.personId === p.id);
                const next = ss.find((x) => x.status === "planned");
                return (
                  <tr key={e.id}>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={`${p.firstName} ${p.lastName}`} size={30} />
                        <span>
                          <Link href={`/console/people/${p.id}`} className="font-bold no-underline hover:underline">
                            {p.firstName} {p.lastName}
                          </Link>
                          <span className="block text-xs text-muted">{p.currentTitle}</span>
                        </span>
                      </span>
                    </td>
                    <td className="tabular-nums">
                      {ss.filter((x) => x.status === "done").length}/{ss.length} done
                    </td>
                    <td className="text-sm">
                      {next ? (
                        <span className="flex flex-col gap-1">
                          {next.topic}
                          <span className="flex items-center gap-2 text-xs text-faint">
                            {relTime(next.scheduledAt)}
                            <ActionButton action={setSessionStatus.bind(null, next.id, "done")} className="font-bold text-accent">
                              Mark done
                            </ActionButton>
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="tabular-nums">{matched.filter((x) => x.personId === p.id).length}</td>
                    <td>
                      <StageBadge stage={e.stage === "placed" ? "placed" : e.stage} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Enrol a participant" action={<JevMark />}>
        <ActionForm action={enrolParticipant} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="mandateId" value={mandateId} />
          <input name="firstName" className="field" placeholder="First name" aria-label="First name" required />
          <input name="lastName" className="field" placeholder="Last name" aria-label="Last name" required />
          <input name="email" type="email" className="field" placeholder="Email" aria-label="Email" required />
          <input name="title" className="field" placeholder="Last role" aria-label="Last role" />
          <div className="sm:col-span-2 lg:col-span-4">
            <SubmitButton size="sm" pendingText="Enrolling…">
              Enrol and plan sessions
            </SubmitButton>
            <span className="ml-3 text-xs text-muted">If they already exist anywhere in the group, Jev links this to their existing record.</span>
          </div>
        </ActionForm>
      </Panel>
    </>
  );
}

function AdvisoryWork({ mandateId }: { mandateId: number }) {
  const items = db
    .select({ d: s.deliverables, who: s.users.name })
    .from(s.deliverables)
    .leftJoin(s.users, eq(s.users.id, s.deliverables.ownerUserId))
    .where(eq(s.deliverables.mandateId, mandateId))
    .orderBy(asc(s.deliverables.dueAt))
    .all();
  const done = items.filter((x) => x.d.status === "done").length;
  return (
    <Panel title={`Deliverables · ${done}/${items.length} done`} pad={false}>
      <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
        {items.map(({ d, who }) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <span>
              <b className={d.status === "done" ? "text-muted line-through" : ""}>{d.title}</b>
              <span className="block text-xs text-faint">
                {who ?? "Unassigned"} · due {fmtDate(d.dueAt)}
              </span>
            </span>
            <ActionSelect
              label={`Status of ${d.title}`}
              value={d.status}
              options={[
                { value: "todo", label: "To do" },
                { value: "doing", label: "In progress" },
                { value: "review", label: "Client review" },
                { value: "done", label: "Done" },
              ]}
              onPick={setDeliverableStatus.bind(null, d.id) as (v: string) => Promise<void>}
            />
          </li>
        ))}
        {!items.length && <li className="px-5 py-4 text-sm text-muted">No deliverables planned yet.</li>}
      </ul>
    </Panel>
  );
}
