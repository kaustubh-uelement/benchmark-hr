import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { clientMandates, mandateInvoices, requirePortal } from "@/lib/portal";
import { topMatchesFor } from "@/lib/jev/engine";
import { ActionButton, ActionForm, SubmitButton } from "@/components/client";
import { Badge, JevMark, Progress, ScoreRing } from "@/components/ui";
import { participantInterest, clientMessage, requestSession } from "@/app/actions/portal";
import { fmtDate, money, relTime } from "@/lib/time";

export const metadata = { title: "My programme" };

export default async function TCPortal() {
  const ctx = await requirePortal("trustcircle", ["client", "participant"]);
  return ctx.u.role === "participant" ? <Participant personId={ctx.u.personId!} first={ctx.u.name.split(" ")[0]} /> : <Sponsor orgId={ctx.u.orgId} brandId={ctx.brand.id} first={ctx.u.name.split(" ")[0]} />;
}

function Participant({ personId, first }: { personId: number; first: string }) {
  const p = db.select().from(s.people).where(eq(s.people.id, personId)).get()!;
  const sessions = db
    .select({ c: s.coachingSessions, coach: s.users.name })
    .from(s.coachingSessions)
    .leftJoin(s.users, eq(s.users.id, s.coachingSessions.coachUserId))
    .where(eq(s.coachingSessions.personId, personId))
    .orderBy(asc(s.coachingSessions.scheduledAt))
    .all();
  const next = sessions.find((x) => x.c.status === "planned");
  const done = sessions.filter((x) => x.c.status === "done").length;
  const coach = sessions[0]?.coach ?? "Your coach";
  const matches = topMatchesFor(p, 6, ["talent", "exh1b"]);
  const mine = db.select().from(s.engagements).where(and(eq(s.engagements.personId, personId), inArray(s.engagements.mandateId, matches.map((m) => m.m.id).concat(-1)))).all();
  const orgs = Object.fromEntries(db.select({ id: s.organisations.id, name: s.organisations.name }).from(s.organisations).all().map((o) => [o.id, o.name]));
  return (
    <>
      <h1 className="m-0 font-display text-[clamp(38px,4.4vw,56px)] font-semibold leading-tight">Hello {first}. You&apos;re not doing this alone.</h1>
      <p className="m-0 mt-2 text-lg text-muted">
        {coach} is your coach. {done} of {sessions.length} sessions done.
      </p>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-card bg-primary p-8 text-primary-ink">
          <span className="text-sm font-bold text-[var(--sage)]">Next session</span>
          {next ? (
            <>
              <p className="m-0 mt-2 font-display text-[34px] font-semibold leading-tight">{next.c.topic}</p>
              <p className="m-0 mt-1 opacity-85">
                {fmtDate(next.c.scheduledAt, true)} · {relTime(next.c.scheduledAt)} · with {next.coach}
              </p>
            </>
          ) : (
            <p className="m-0 mt-2 font-display text-2xl">No session booked. Ask for one below.</p>
          )}
          <div className="mt-6">
            <Progress value={(done / Math.max(1, sessions.length)) * 100} tone="good" />
          </div>
        </section>
        <section className="rounded-card bg-card p-8">
          <h2 className="m-0 font-display text-2xl font-semibold">Your plan</h2>
          <ol className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {sessions.map(({ c }) => (
              <li key={c.id} className="flex items-center gap-3 text-[15px]">
                <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-extrabold ${c.status === "done" ? "bg-good text-white" : c.status === "missed" ? "bg-bad-soft text-bad" : "border-2 border-line"}`}>{c.status === "done" ? "✓" : ""}</span>
                <span className={c.status === "done" ? "text-muted" : "font-semibold"}>{c.topic}</span>
                <span className="ml-auto whitespace-nowrap text-xs text-faint">{fmtDate(c.scheduledAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 font-display text-3xl font-semibold">Openings that fit you</h2>
          <JevMark />
        </div>
        <p className="m-0 mt-1 text-muted">From Benchmark Talent and ExH1B. Say you&apos;re interested and your coach and the recruiter will take it from there.</p>
        <ul className="m-0 mt-5 grid list-none gap-4 p-0 md:grid-cols-2">
          {matches.map(({ m, score, reasons }) => {
            const e = mine.find((x) => x.mandateId === m.id);
            const applied = e && !["matched", "saved"].includes(e.stage);
            return (
              <li key={m.id} className="flex gap-4 rounded-card bg-card p-5">
                <ScoreRing score={score} />
                <div className="min-w-0 flex-1">
                  <b className="block font-display text-xl font-semibold">{m.title}</b>
                  <span className="block text-sm text-muted">
                    {m.orgId ? orgs[m.orgId] : ""} · {m.locationLabel}
                  </span>
                  <span className="mt-1 block text-xs text-faint">{reasons.slice(0, 2).join(" · ")}</span>
                  <div className="mt-3">
                    {applied ? (
                      <Badge tone="good">You&apos;re in · {e!.stage}</Badge>
                    ) : (
                      <ActionButton action={participantInterest.bind(null, m.id)} className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-ink">
                        I&apos;m interested
                      </ActionButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="rounded-card bg-card p-7">
          <h2 className="m-0 font-display text-2xl font-semibold">Ask for an extra session</h2>
          <ActionForm action={requestSession} className="mt-4 flex flex-col gap-3">
            <input name="topic" className="field" placeholder="e.g. Salary negotiation" aria-label="Topic" />
            <textarea name="note" rows={2} className="field" placeholder="Anything your coach should know" aria-label="Note" />
            <div>
              <SubmitButton variant="accent">Request</SubmitButton>
            </div>
          </ActionForm>
        </div>
        <div className="rounded-card bg-accent-soft p-7">
          <h2 className="m-0 font-display text-2xl font-semibold">Message {coach.split(" ")[0]}</h2>
          <ActionForm action={clientMessage} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="subject" value="Message from participant" />
            <textarea name="body" rows={4} className="field" placeholder="Only your coach reads this." aria-label="Message" />
            <div>
              <SubmitButton>Send</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </section>
    </>
  );
}

function Sponsor({ orgId, brandId, first }: { orgId: number | null; brandId: number; first: string }) {
  const programmes = clientMandates(orgId, brandId);
  const invoices = orgId ? mandateInvoices(orgId, brandId) : [];
  return (
    <>
      <h1 className="m-0 font-display text-[clamp(38px,4.4vw,56px)] font-semibold leading-tight">Hello {first}. Here&apos;s how your people are doing.</h1>
      <p className="m-0 mt-2 max-w-2xl text-lg text-muted">Progress and outcomes only. What participants discuss with their coach stays confidential.</p>
      {programmes.map(({ m, owner }) => {
        const rows = db
          .select({ e: s.engagements, p: s.people })
          .from(s.engagements)
          .innerJoin(s.people, eq(s.people.id, s.engagements.personId))
          .where(and(eq(s.engagements.mandateId, m.id), inArray(s.engagements.stage, ["enrolled", "placed", "withdrawn"])))
          .all();
        const ids = rows.map((r) => r.p.id).concat(-1);
        const sess = db.select().from(s.coachingSessions).where(and(eq(s.coachingSessions.mandateId, m.id), inArray(s.coachingSessions.personId, ids))).all();
        const activity = db.select().from(s.engagements).where(and(inArray(s.engagements.personId, ids), inArray(s.engagements.stage, ["applied", "screening", "shortlisted", "interview", "offer", "placed"]))).all();
        const status = (pid: number) => {
          const st = activity.filter((a) => a.personId === pid).map((a) => a.stage);
          if (st.includes("placed")) return ["Landed a new role", "good"] as const;
          if (st.includes("offer")) return ["Has an offer", "good"] as const;
          if (st.includes("interview") || st.includes("shortlisted")) return ["Interviewing", "accent"] as const;
          if (st.length) return ["Applying", "neutral"] as const;
          return ["Getting started", "neutral"] as const;
        };
        const interviewing = rows.filter((r) => ["Interviewing", "Has an offer", "Landed a new role"].includes(status(r.p.id)[0])).length;
        const doneSess = sess.filter((x) => x.status === "done").length;
        return (
          <section key={m.id} className="mt-8 rounded-card bg-card p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="m-0 font-display text-[28px] font-semibold">{m.title}</h2>
                <p className="m-0 text-sm text-muted">
                  Started {fmtDate(m.openedAt)} · lead coach {owner?.name} · {m.openings} places
                </p>
              </div>
              <Badge tone="good">Running</Badge>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Enrolled", rows.length],
                ["Sessions held", doneSess],
                ["Interviewing or better", interviewing],
                ["Places left", Math.max(0, m.openings - rows.length)],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-[18px] bg-bg-2 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-faint">{k}</span>
                  <p className="m-0 mt-1 font-display text-3xl font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="data">
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Coaching</th>
                    <th>Where they are</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p }) => {
                    const ss = sess.filter((x) => x.personId === p.id);
                    const [label, tone] = status(p.id);
                    return (
                      <tr key={p.id}>
                        <td>
                          <b>
                            {p.firstName} {p.lastName}
                          </b>
                          <span className="block text-xs text-muted">{p.currentTitle}</span>
                        </td>
                        <td className="min-w-[180px]">
                          <Progress value={(ss.filter((x) => x.status === "done").length / Math.max(1, ss.length)) * 100} tone="good" />
                          <span className="mt-1 block text-xs text-muted">
                            {ss.filter((x) => x.status === "done").length} of {ss.length} sessions
                          </span>
                        </td>
                        <td>
                          <Badge tone={tone}>{label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {invoices.length > 0 && (
        <section className="mt-8 rounded-card bg-card p-7">
          <h2 className="m-0 font-display text-2xl font-semibold">Invoices</h2>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0 text-sm">
            {invoices.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 border-b border-line py-2">
                <span>{i.description}</span>
                <span>
                  {money(i.amount, i.currency)} · {i.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-8 max-w-2xl rounded-card bg-accent-soft p-7">
        <h2 className="m-0 font-display text-2xl font-semibold">Need more places, or a change?</h2>
        <ActionForm action={clientMessage} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="mandateId" value={programmes[0]?.m.id ?? ""} />
          <textarea name="body" rows={3} className="field" placeholder="Message your lead coach" aria-label="Message" />
          <div>
            <SubmitButton>Send</SubmitButton>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
