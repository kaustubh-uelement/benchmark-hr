import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { clientMandate, presented, requirePortal, stageCounts } from "@/lib/portal";
import { DecisionForm } from "@/components/DecisionForm";
import { ActionForm, SubmitButton } from "@/components/client";
import { clientMessage } from "@/app/actions/portal";
import { Badge, ScoreRing } from "@/components/ui";
import { fmtDate } from "@/lib/time";

export const metadata = { title: "Role" };

export default async function TalentRole({ params }: { params: Promise<{ id: string }> }) {
  const { u, brand } = await requirePortal("talent");
  const m = clientMandate(u.orgId, brand.id, Number((await params).id));
  if (!m) notFound();
  const c = stageCounts(m.id);
  const list = presented(m.id);
  const owner = m.ownerUserId ? db.select().from(s.users).where(eq(s.users.id, m.ownerUserId)).get() : null;
  const steps = [
    ["Applied & sourced", c.approached],
    ["Screened", c.assessed],
    ["Shortlisted", c.shortlisted],
    ["Interviewing", c.interview],
    ["Offer", c.offer],
    ["Hired", c.placed],
  ] as const;
  return (
    <>
      <Link href="/talent/portal" className="text-sm font-bold text-accent">
        ← All roles
      </Link>
      <h1 className="m-0 mt-4 font-display text-[44px] font-bold leading-tight tracking-tight">{m.title}</h1>
      <p className="m-0 text-muted">
        {m.locationLabel} · {m.workMode} · opened {fmtDate(m.openedAt)} · recruiter {owner?.name}
      </p>
      <ol className="m-0 mt-8 grid list-none grid-cols-3 gap-2 p-0 md:grid-cols-6">
        {steps.map(([k, v], i) => (
          <li key={k} className={`rounded-card border p-4 ${i === 2 ? "border-accent bg-accent-soft" : "border-line bg-card-2"}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-faint">{k}</span>
            <p className="m-0 mt-1 font-display text-3xl font-bold">{v}</p>
          </li>
        ))}
      </ol>
      <h2 className="mb-4 mt-10 font-display text-2xl font-bold">Shortlisted for you · {list.length}</h2>
      <div className="flex flex-col gap-4">
        {list.map(({ e, p }) => (
          <article key={e.id} className="grid gap-6 rounded-card border border-line bg-card-2 p-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex gap-4">
              <ScoreRing score={e.matchScore ?? 0} size={58} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="font-display text-xl">
                    {p.firstName} {p.lastName}
                  </b>
                  <Badge tone={e.stage === "interview" ? "accent" : e.stage === "offer" || e.stage === "placed" ? "good" : "neutral"}>{e.stage}</Badge>
                </div>
                <p className="m-0 text-sm text-muted">
                  {[p.currentTitle, p.currentCompany].filter(Boolean).join(" at ")} · {p.locationLabel} · {p.yearsExperience != null ? `${Math.round(p.yearsExperience)} yrs` : ""} · notice {p.noticePeriod ?? "tbc"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.matchReasons?.reasons.slice(0, 3).map((r) => (
                    <span key={r} className="rounded-[4px] bg-good-soft px-2 py-1 text-xs font-semibold text-good">
                      ✓ {r}
                    </span>
                  ))}
                  {e.matchReasons?.gaps.slice(0, 2).map((r) => (
                    <span key={r} className="rounded-[4px] bg-warn-soft px-2 py-1 text-xs font-semibold text-warn">
                      △ {r}
                    </span>
                  ))}
                </div>
                {e.notes && <p className="m-0 mt-3 rounded-[6px] bg-bg-2 p-3 text-sm">Recruiter&apos;s note: {e.notes}</p>}
              </div>
            </div>
            <DecisionForm engagementId={e.id} current={e.clientDecision} tone="plain" meetLabel="Interview" passLabel="Not a fit" who="recruiter" />
          </article>
        ))}
        {!list.length && <p className="rounded-card border border-dashed border-line p-8 text-center text-muted">No shortlist yet. Your recruiter usually presents one within about nine working days.</p>}
      </div>
      <section className="mt-10 max-w-2xl rounded-card border border-line bg-card-2 p-6">
        <h2 className="m-0 mb-3 font-display text-xl font-bold">Message {owner?.name.split(" ")[0] ?? "your recruiter"}</h2>
        <ActionForm action={clientMessage} className="flex flex-col gap-3">
          <input type="hidden" name="mandateId" value={m.id} />
          <textarea name="body" rows={3} className="field" placeholder="Change in the brief, interview slots, questions" aria-label="Message" />
          <div>
            <SubmitButton variant="accent" size="sm">
              Send
            </SubmitButton>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
