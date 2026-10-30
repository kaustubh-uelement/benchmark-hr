import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { requireMember, subscriptionOf } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { topMatchesFor } from "@/lib/jev/engine";
import { setRelevance, moveApplication } from "@/app/actions/exh1b";
import { ActionButton } from "@/components/client";
import { Badge, ButtonLink, Card, JevMark, Notice, ScoreRing, StageBadge } from "@/components/ui";
import { money, relTime } from "@/lib/time";

export const metadata = { title: "Jobs" };

const COLUMNS: [string, string[]][] = [
  ["Saved", ["saved"]],
  ["Applied", ["applied"]],
  ["In process", ["screening", "shortlisted", "interview"]],
  ["Offer", ["offer", "placed"]],
  ["Closed", ["rejected", "withdrawn"]],
];

export default async function Jobs({ searchParams }: { searchParams: Promise<{ family?: string; show?: string }> }) {
  const sp = await searchParams;
  const { person } = await requireMember();
  const { active } = subscriptionOf(person.id);
  const mine = db.select().from(s.engagements).where(eq(s.engagements.personId, person.id)).all();
  const byMandate = new Map(mine.map((e) => [e.mandateId, e]));
  let matches = topMatchesFor(person, 30);
  const families = db.select().from(s.jobFamilies).all();
  if (sp.family) matches = matches.filter((m) => String(m.m.familyId) === sp.family);
  const hidden = matches.filter((m) => byMandate.get(m.m.id)?.relevance === "not_relevant");
  if (sp.show !== "hidden") matches = matches.filter((m) => byMandate.get(m.m.id)?.relevance !== "not_relevant");
  const orgs = Object.fromEntries(db.select().from(s.organisations).all().map((o) => [o.id, o]));
  const trackedIds = mine.filter((e) => !["matched"].includes(e.stage)).map((e) => e.mandateId);
  const tracked = trackedIds.length ? db.select().from(s.mandates).where(inArray(s.mandates.id, trackedIds)).all() : [];
  const tMap = new Map(tracked.map((m) => [m.id, m]));
  const famOptions = [...new Set(topMatchesFor(person, 30).map((m) => m.m.familyId))].map((id) => families.find((f) => f.id === id)!).filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">Your matches</h1>
          <p className="m-0 mt-1 text-muted">Ranked by Jev from your profile. Mark what&apos;s relevant and the list gets sharper.</p>
        </div>
        <JevMark />
      </div>

      {!active && (
        <Notice tone="warn" title={`${matches.filter((m) => m.score >= 60).length} roles match you right now`}>
          You can see why each role matches. Subscribe to see the company, the role and apply.{" "}
          <Link href="/exh1b/dashboard/billing" className="font-bold">
            See plans →
          </Link>
        </Notice>
      )}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Job family
          <select className="field min-w-56" name="family" defaultValue={sp.family ?? ""}>
            <option value="">All families</option>
            {famOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded-btn bg-primary px-4 font-bold text-primary-ink">Filter</button>
        {hidden.length > 0 && (
          <Link href={sp.show === "hidden" ? "/exh1b/jobs" : "/exh1b/jobs?show=hidden"} className="min-h-11 content-center text-sm font-bold text-accent">
            {sp.show === "hidden" ? "Hide" : "Show"} {hidden.length} marked not relevant
          </Link>
        )}
      </form>

      <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
        {matches.map(({ m, score, reasons, gaps }) => {
          const e = byMandate.get(m.id);
          const org = m.orgId ? orgs[m.orgId] : null;
          return (
            <li key={m.id}>
              <Card className="flex h-full flex-col gap-4 p-5">
                <div className="flex items-start gap-4">
                  <ScoreRing score={score} size={58} />
                  <div className="min-w-0 flex-1">
                    {active ? (
                      <div>
                        <h2 className="m-0 font-display text-lg font-bold leading-tight">{m.title}</h2>
                        <p className="m-0 mt-0.5 text-sm text-muted">
                          {org?.name} · {org?.industry}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h2 className="m-0 font-display text-lg font-bold leading-tight">
                          {m.seniority} · {families.find((f) => f.id === m.familyId)?.name}
                        </h2>
                        <p className="blurred m-0 mt-0.5 text-sm text-muted" aria-hidden="true">
                          Hidden company name · Industry
                        </p>
                      </div>
                    )}
                    <p className="m-0 mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
                      <span>{m.locationLabel}</span>
                      <span>{m.workMode}</span>
                      {active && m.salaryMin && <span>{money(m.salaryMin, "INR", true)}–{money(m.salaryMax, "INR", true)}</span>}
                    </p>
                  </div>
                  {e && e.stage !== "matched" && <StageBadge stage={e.stage} />}
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {reasons.slice(0, 3).map((r) => (
                      <li key={r} className="text-good">
                        ✓ {r}
                      </li>
                    ))}
                  </ul>
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {gaps.slice(0, 2).map((g) => (
                      <li key={g} className="text-warn">
                        △ {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <ActionButton action={setRelevance.bind(null, m.id, "relevant")} className={`min-h-9 rounded-btn px-3 text-sm font-bold ${e?.relevance === "relevant" ? "bg-good-soft text-good" : "hover:bg-bg-2"}`}>
                    👍 Relevant
                  </ActionButton>
                  <ActionButton action={setRelevance.bind(null, m.id, "not_relevant")} className={`min-h-9 rounded-btn px-3 text-sm font-bold ${e?.relevance === "not_relevant" ? "bg-bad-soft text-bad" : "hover:bg-bg-2"}`}>
                    Not relevant
                  </ActionButton>
                  <span className="ml-auto flex gap-2">
                    {(!e || e.stage === "matched") && (
                      <ActionButton action={moveApplication.bind(null, m.id, "saved")} className="min-h-9 rounded-btn border-[1.5px] border-line px-3 text-sm font-bold">
                        Save
                      </ActionButton>
                    )}
                    {(!e || ["matched", "saved"].includes(e.stage)) &&
                      (active ? (
                        <ActionButton action={moveApplication.bind(null, m.id, "applied")} className="min-h-9 rounded-btn bg-primary px-4 text-sm font-bold text-primary-ink">
                          Apply
                        </ActionButton>
                      ) : (
                        <ButtonLink href="/exh1b/dashboard/billing?reason=apply" size="sm">
                          Unlock to apply
                        </ButtonLink>
                      ))}
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <section id="application-tracker" className="scroll-mt-24">
        <h2 className="m-0 font-display text-2xl font-extrabold tracking-tight">Application tracker</h2>
        <p className="m-0 mt-1 text-sm text-muted">Saved → applied → in process → offer. Updated by you and by our team.</p>
        <div className="scroll-x mt-4">
          <div className="grid min-w-[900px] grid-cols-5 gap-3">
            {COLUMNS.map(([label, stages]) => {
              const items = mine.filter((e) => stages.includes(e.stage));
              return (
                <div key={label} className="rounded-card bg-bg-2 p-3">
                  <p className="m-0 mb-3 flex justify-between text-sm font-bold">
                    {label} <span className="text-faint">{items.length}</span>
                  </p>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {items.map((e) => {
                      const m = tMap.get(e.mandateId);
                      if (!m) return null;
                      return (
                        <li key={e.id} className="rounded-field border border-line bg-card p-3 text-sm">
                          <b className={`block leading-snug ${active ? "" : "blurred"}`}>{m.title}</b>
                          <span className={`block text-xs text-muted ${active ? "" : "blurred"}`}>{m.orgId ? orgs[m.orgId]?.name : ""}</span>
                          <span className="mt-1.5 flex items-center justify-between text-xs text-faint">
                            {relTime(e.updatedAt)}
                            {e.stage === "saved" && active && (
                              <ActionButton action={moveApplication.bind(null, m.id, "applied")} className="font-bold text-accent">
                                Apply →
                              </ActionButton>
                            )}
                            {["applied", "screening"].includes(e.stage) && (
                              <ActionButton action={moveApplication.bind(null, m.id, "withdrawn")} confirm="Withdraw this application?" className="font-bold text-faint hover:text-bad">
                                Withdraw
                              </ActionButton>
                            )}
                          </span>
                        </li>
                      );
                    })}
                    {items.length === 0 && <li className="text-xs text-faint">Nothing here yet</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
        {mine.some((e) => e.stage === "interview") && (
          <p className="mt-3 text-sm">
            <Badge tone="accent">Tip</Badge> Interviews across time zones: tell recruiters your local hours in{" "}
            <Link href="/exh1b/profile?step=6" className="font-bold text-accent">
              your profile notes
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
