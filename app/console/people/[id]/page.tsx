import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond, canSeePerson } from "@/lib/access";
import { personBrandsOf, cityNames } from "@/lib/queries";
import { profileStatus } from "@/lib/profile";
import { subscriptionOf } from "@/lib/member";
import { asMatchMandate, asMatchPerson } from "@/lib/jev/engine";
import { scoreMatch } from "@/lib/jev/match";
import { EOR_STEPS } from "@/lib/db/schema";
import { Avatar, Badge, JevMark, Progress, ScoreRing, StageBadge } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton } from "@/components/client";
import { BrandChip, KV, PageHead, Panel } from "@/components/console";
import { addInteraction, addToMandate } from "@/app/actions/console";
import { fmtDate, money, relTime } from "@/lib/time";
import { SlaBadge } from "@/components/sla";

export const metadata = { title: "Person" };

export default async function Person({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const ctx = await consoleCtx();
  if (!canSeePerson(ctx.u, id)) notFound();
  const p = db.select().from(s.people).where(eq(s.people.id, id)).get();
  if (!p) notFound();
  const brands = personBrandsOf(id);
  const consents = db.select().from(s.consents).where(eq(s.consents.personId, id)).orderBy(desc(s.consents.capturedAt)).all();
  const latest = (k: string) => consents.find((c) => c.purpose === k);
  const fam = p.familyId ? db.select().from(s.jobFamilies).where(eq(s.jobFamilies.id, p.familyId)).get() : null;
  const st = profileStatus(p);
  const eng = db
    .select({ e: s.engagements, m: s.mandates, org: s.organisations.name })
    .from(s.engagements)
    .innerJoin(s.mandates, eq(s.mandates.id, s.engagements.mandateId))
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .where(and(eq(s.engagements.personId, id), brandCond(s.engagements.brandId, ctx.u)))
    .orderBy(desc(s.engagements.updatedAt))
    .all();
  const log = db
    .select({ i: s.interactions, who: s.users.name })
    .from(s.interactions)
    .leftJoin(s.users, eq(s.users.id, s.interactions.userId))
    .where(eq(s.interactions.personId, id))
    .orderBy(desc(s.interactions.occurredAt))
    .limit(20)
    .all();
  const tickets = db.select().from(s.tickets).where(and(eq(s.tickets.personId, id), brandCond(s.tickets.brandId, ctx.u))).orderBy(desc(s.tickets.createdAt)).all();
  const docs = db.select().from(s.documents).where(eq(s.documents.personId, id)).all();
  const sub = subscriptionOf(id);
  const eor = db.select().from(s.eorCases).where(eq(s.eorCases.personId, id)).get();
  const prefs = cityNames(p.preferredCityIds);
  const open = db.select().from(s.mandates).where(and(eq(s.mandates.status, "open"), inArray(s.mandates.kind, ["search", "job"]), brandCond(s.mandates.brandId, ctx.u, ctx.pickedId))).all();
  const fits = open
    .filter((m) => !eng.some((e) => e.m.id === m.id))
    .map((m) => ({ m, ...scoreMatch(asMatchPerson(p), asMatchMandate(m)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const sessions = db.select().from(s.coachingSessions).where(eq(s.coachingSessions.personId, id)).all();

  return (
    <>
      <PageHead
        eyebrow={
          <Link href="/console/people" className="no-underline">
            ← People
          </Link>
        }
        title={
          <span className="flex items-center gap-4">
            <Avatar name={`${p.firstName} ${p.lastName}`} size={54} />
            <span>
              {p.firstName} {p.lastName}
              <span className="mt-1 block font-body text-base text-muted">
                {[p.currentTitle, p.currentCompany].filter(Boolean).join(", ") || "No current role"} · {p.locationLabel ?? "Location unknown"}
              </span>
            </span>
          </span>
        }
        actions={
          <span className="flex flex-wrap gap-1.5">
            {brands.map((b) => (
              <BrandChip key={b.slug + b.relationship} slug={b.slug} name={`${b.name} · ${b.relationship.replace("_", " ")}`} />
            ))}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title={`Engagements · ${eng.length}`} pad={false}>
            {eng.length === 0 ? (
              <p className="m-0 p-5 text-sm text-muted">Not on any mandate you can see.</p>
            ) : (
              <div className="scroll-x">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Mandate</th>
                      <th>Business</th>
                      <th>Stage</th>
                      <th>Match</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eng.map(({ e, m, org }) => (
                      <tr key={e.id}>
                        <td>
                          <Link href={`/console/mandates/${m.id}`} className="font-bold no-underline hover:underline">
                            {m.title}
                          </Link>
                          <span className="block text-xs text-muted">{m.confidential ? "Confidential client" : org}</span>
                        </td>
                        <td>
                          <BrandChip slug={ctx.byId[m.brandId].slug} name={ctx.byId[m.brandId].shortName} />
                        </td>
                        <td>
                          <StageBadge stage={e.stage} />
                          {e.relevance && <span className="block text-[11px] text-faint">member marked {e.relevance.replace("_", " ")}</span>}
                        </td>
                        <td className="tabular-nums">{e.matchScore != null ? `${e.matchScore}%` : "—"}</td>
                        <td className="whitespace-nowrap text-xs text-muted">{relTime(e.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          {fits.length > 0 && (
            <Panel title="Open mandates Jev would put them on" action={<JevMark />}>
              <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                {fits.map((f) => (
                  <li key={f.m.id} className="flex flex-wrap items-center gap-3 py-3">
                    <ScoreRing score={f.score} size={44} />
                    <span className="min-w-0 flex-1">
                      <Link href={`/console/mandates/${f.m.id}`} className="font-bold no-underline hover:underline">
                        {f.m.title}
                      </Link>
                      <span className="block text-xs text-muted">
                        {ctx.byId[f.m.brandId].shortName} · {f.m.locationLabel} · {f.reasons.slice(0, 2).join("; ")}
                      </span>
                    </span>
                    <ActionButton action={addToMandate.bind(null, p.id, f.m.id)} className="inline-flex min-h-8 items-center rounded-full border border-line px-3 text-xs font-bold hover:bg-bg-2">
                      Add
                    </ActionButton>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Timeline">
            <ActionForm action={addInteraction} className="mb-5 flex flex-col gap-2">
              <input type="hidden" name="personId" value={p.id} />
              <div className="flex gap-2">
                <select name="kind" className="field !w-36" aria-label="Type">
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="interview">Interview</option>
                </select>
                <input name="summary" className="field" placeholder="What happened?" aria-label="Summary" />
                <SubmitButton size="sm">Log</SubmitButton>
              </div>
            </ActionForm>
            <ol className="m-0 flex list-none flex-col gap-4 border-l-2 border-line p-0 pl-4">
              {log.map(({ i, who }) => (
                <li key={i.id} className="relative text-sm">
                  <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-bg bg-primary" aria-hidden="true" />
                  <Badge className="mr-2">{i.kind}</Badge>
                  {i.summary}
                  <span className="block text-xs text-faint">
                    {who ?? "System"} · {fmtDate(i.occurredAt, true)}
                  </span>
                </li>
              ))}
              {!log.length && <li className="text-sm text-muted">Nothing logged yet.</li>}
            </ol>
          </Panel>

          {tickets.length > 0 && (
            <Panel title="Support tickets" pad={false}>
              <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                {tickets.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <Link href={`/console/tickets?id=${t.id}`} className="font-bold no-underline hover:underline">
                      {t.subject}
                    </Link>
                    <span className="flex gap-1.5">
                      <Badge>{t.status.replace("_", " ")}</Badge>
                      <SlaBadge t={t} />
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Panel title="Profile">
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm">
                <b>Profile strength</b>
                <span>
                  {st.strength}% · {st.label}
                </span>
              </div>
              <Progress value={st.strength} />
            </div>
            <KV
              items={[
                ["Email", <a key="e" href={`mailto:${p.email}`}>{p.email}</a>],
                ["Phone", p.phone],
                ["LinkedIn", p.linkedinUrl ? <a key="l" href={p.linkedinUrl} target="_blank" rel="noreferrer">Profile ↗</a> : null],
                ["Family", fam?.name],
                ["Seniority", p.seniority],
                ["Experience", p.yearsExperience != null ? `${Math.round(p.yearsExperience)} years` : null],
                ["Returning", p.returnTimeline],
                ["Wants", prefs.length ? prefs.map((c) => c.name).join(", ") : p.anywhereInIndia ? "Anywhere in India" : null],
                ["Work mode", p.workMode],
                ["Notice", p.noticePeriod],
                ["Visa", p.visaStatus],
                ["Salary", p.salaryMin ? `${money(p.salaryMin, p.salaryCurrency ?? "USD", true)}–${money(p.salaryMax, p.salaryCurrency ?? "USD", true)}` : null],
                ["EOR", p.openToEor ? "Wants to keep current employer" : p.openToEor === false ? "No" : null],
              ]}
            />
            {p.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.skills.map((k) => (
                  <Badge key={k}>{k}</Badge>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Consent">
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
              {[
                ["group_sharing", "Share across Benchmark businesses"],
                ["ai_matching", "Jev matching"],
                ["marketing", "Marketing"],
              ].map(([k, l]) => {
                const c = latest(k);
                return (
                  <li key={k} className="flex items-center justify-between gap-2">
                    {l}
                    <Badge tone={c?.granted ? "good" : c ? "bad" : "neutral"}>{c ? (c.granted ? "Yes" : "No") : "Not asked"}</Badge>
                  </li>
                );
              })}
            </ul>
            {consents[0] && <p className="m-0 mt-3 text-xs text-faint">Last captured {fmtDate(consents[0].capturedAt)} via {consents[0].source}. Held under India&apos;s DPDP Act.</p>}
          </Panel>
          {(sub.sub || eor || docs.length > 0 || sessions.length > 0) && (
            <Panel title="Services">
              <KV
                items={[
                  ...(sub.sub ? ([["ExH1B plan", `${sub.plan?.name} · ${sub.active ? "active" : sub.sub.status}`]] as [string, string][]) : []),
                  ...(eor ? ([["EOR case", <Link key="eor" href="/console/eor">{EOR_STEPS[eor.step]} (step {eor.step + 1}/6)</Link>]] as [string, React.ReactNode][]) : []),
                  ...(sessions.length ? ([["Coaching", `${sessions.filter((x) => x.status === "done").length}/${sessions.length} sessions done`]] as [string, string][]) : []),
                  ...docs.map((d) => [d.kind, <a key={d.id} href={`/api/documents/${d.id}`}>{d.filename}</a>] as [string, React.ReactNode]),
                ]}
              />
              {p.resumeParsedAt && (
                <p className="m-0 mt-3 text-xs text-faint">
                  <JevMark className="mr-1" /> resume read {relTime(p.resumeParsedAt)}
                </p>
              )}
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
