import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireMember, memberSnapshot } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { topMatchesFor } from "@/lib/jev/engine";
import { Badge, ButtonLink, Card, JevMark, Progress, ScoreRing } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client";
import { requestConsultation } from "@/app/actions/exh1b";
import { EOR_STEPS } from "@/lib/db/schema";
import { fmtDate, money, relTime } from "@/lib/time";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const { person } = await requireMember();
  const snap = memberSnapshot(person.id);
  const { subscription: sub, status } = snap;
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  const region = person.countryCode === "IN" ? "IN" : "INTL";
  const monthly = db.select().from(s.plans).where(and(eq(s.plans.brandId, ex.id), eq(s.plans.region, region), eq(s.plans.interval, "month"))).get()!;
  const matches = topMatchesFor(person, 50);
  const strong = matches.filter((m) => m.score >= 60);
  const eor = db.select().from(s.eorCases).where(eq(s.eorCases.personId, person.id)).get();
  const eorOrg = eor?.employerOrgId ? db.select().from(s.organisations).where(eq(s.organisations.id, eor.employerOrgId)).get() : null;
  const tickets = db.select().from(s.tickets).where(eq(s.tickets.personId, person.id)).orderBy(desc(s.tickets.updatedAt)).limit(3).all();
  const apps = db.select().from(s.engagements).where(and(eq(s.engagements.personId, person.id), inArray(s.engagements.stage, ["applied", "screening", "interview", "offer"]))).all();
  const done = snap.gettingStarted.filter((g) => g.done).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">Hi {person.firstName}</h1>
          <p className="m-0 mt-1 text-muted">
            {person.locationLabel ? `${person.locationLabel} → India` : "Planning your move to India"}
            {person.returnTimeline ? ` · ${person.returnTimeline}` : ""}
          </p>
        </div>
        <JevMark />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className={`p-6 ${sub.active ? "" : "border-[var(--marigold)]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="m-0 text-sm font-bold text-accent">Personalised Job Discovery</p>
              <h2 className="m-0 mt-1 font-display text-2xl font-bold">{sub.active ? `${sub.plan?.name} plan · active` : sub.sub ? "Access ended" : "Not subscribed yet"}</h2>
              <p className="m-0 mt-1 text-sm text-muted">
                {sub.active ? `Renews ${fmtDate(sub.sub!.currentPeriodEnd)}` : sub.sub ? `Your ${sub.plan?.name.toLowerCase()} plan ended ${relTime(sub.sub.currentPeriodEnd)}.` : "Create matches for free; subscribe to see companies and apply."}
              </p>
            </div>
            {sub.active ? <Badge tone="good">Active</Badge> : <Badge tone="warn">Locked</Badge>}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex items-center gap-4 rounded-card bg-bg-2 px-5 py-4">
              <span className="font-display text-4xl font-extrabold text-accent">{strong.length}</span>
              <span className="text-sm leading-snug">
                roles match you
                <br />
                <span className="text-muted">top match {matches[0]?.score ?? 0}%</span>
              </span>
            </div>
            {sub.active ? (
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/exh1b/jobs">See my matches</ButtonLink>
                <ButtonLink href="/exh1b/jobs#application-tracker" variant="outline">
                  {apps.length} active application{apps.length === 1 ? "" : "s"}
                </ButtonLink>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/exh1b/dashboard/billing">
                  {sub.sub ? "Resubscribe" : "Subscribe monthly"} · {money(monthly.amount, monthly.currency)}/mo
                </ButtonLink>
                <span className="text-xs text-muted">{region === "IN" ? "Billed in INR" : "Billed in USD"} · annual saves 20%</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-display text-lg font-bold">Getting started</h2>
            <span className="text-sm font-bold text-muted">
              {done}/{snap.gettingStarted.length}
            </span>
          </div>
          <Progress value={(done / snap.gettingStarted.length) * 100} className="mt-3" />
          <ul className="m-0 mt-4 flex list-none flex-col gap-1 p-0">
            {snap.gettingStarted.map((g) => (
              <li key={g.key}>
                <Link href={g.href} className="flex items-center gap-3 rounded-field px-2 py-2 text-sm no-underline hover:bg-bg-2">
                  <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-extrabold ${g.done ? "bg-good text-white" : "border-2 border-line"}`}>{g.done ? "✓" : ""}</span>
                  <span className={g.done ? "text-muted line-through" : "font-semibold"}>{g.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="m-0 font-display text-lg font-bold">Profile strength</h2>
          <div className="mt-3 flex items-center gap-4">
            <ScoreRing score={status.strength} size={64} />
            <div>
              <b>{status.label}</b>
              <p className="m-0 text-sm text-muted">{status.complete ? "Your profile is complete." : `${status.items.filter((i) => !i.done).length} item${status.items.filter((i) => !i.done).length === 1 ? "" : "s"} to finish`}</p>
            </div>
          </div>
          {!status.complete && (
            <ul className="m-0 mt-3 list-none p-0 text-sm text-muted">
              {status.items
                .filter((i) => !i.done)
                .map((i) => (
                  <li key={i.key}>
                    + {i.label} <span className="text-faint">({i.weight} pts)</span>
                  </li>
                ))}
            </ul>
          )}
          <ButtonLink href="/exh1b/profile" variant="soft" size="sm" className="mt-4">
            Edit profile
          </ButtonLink>
        </Card>

        <Card className="p-6" id="consultation">
          <h2 className="m-0 font-display text-lg font-bold">Talk to our team</h2>
          <p className="m-0 mt-1 text-sm text-muted">
            {sub.active ? `Your ${sub.plan?.name.toLowerCase()} plan includes ${sub.plan?.consultationsIncluded} consultation${sub.plan?.consultationsIncluded === 1 ? "" : "s"}.` : "A free 15-minute intro call is open to every member."}
          </p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {snap.consults.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-field bg-bg-2 px-3 py-2 text-sm">
                <span>
                  <b>{c.topic}</b>
                  <span className="block text-xs text-muted">{c.scheduledAt ? fmtDate(c.scheduledAt, true) : "Time to be confirmed"}</span>
                </span>
                <Badge tone={c.status === "done" ? "neutral" : c.status === "scheduled" ? "good" : "warn"}>{c.status}</Badge>
              </li>
            ))}
          </ul>
          <ActionForm action={requestConsultation} className="mt-3 flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Request a consultation
              <select className="field" name="topic">
                <option>15-minute intro call</option>
                <option>Offer or salary review</option>
                <option>Choosing a city</option>
                <option>Employer of Record options</option>
                <option>Resume review</option>
              </select>
            </label>
            <SubmitButton variant="accent" size="sm">
              Request
            </SubmitButton>
          </ActionForm>
        </Card>

        <Card className="p-6">
          <h2 className="m-0 font-display text-lg font-bold">Employer of Record</h2>
          {eor ? (
            <>
              <p className="m-0 mt-1 text-sm text-muted">Keeping {eorOrg?.name ?? "your employer"} from India</p>
              <ol className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                {EOR_STEPS.map((st, i) => (
                  <li key={st} className="flex items-center gap-3 text-sm">
                    <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-extrabold ${i < eor.step ? "bg-good text-white" : i === eor.step ? "bg-[var(--marigold)] text-[#0e2240]" : "border-2 border-line text-faint"}`}>{i < eor.step ? "✓" : i + 1}</span>
                    <span className={i === eor.step ? "font-bold" : i < eor.step ? "text-muted" : "text-faint"}>{st}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <p className="m-0 mt-1 text-sm text-muted">Want to keep your current employer and work from India? Say yes in profile step 4 and our employer team will contact you.</p>
              <ButtonLink href="/exh1b/profile?step=4" variant="soft" size="sm" className="mt-4">
                Tell us about your employer
              </ButtonLink>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Profile", "Six steps, one strength score.", "/exh1b/profile", `${status.strength}%`],
          ["Job Search (AI Match)", "Ranked roles with reasons.", "/exh1b/jobs", `${strong.length} matches`],
          ["Community", "Ask people who moved back.", "/exh1b/community", "Join in"],
          ["Relocation", "Your country's move-home checklist.", "/exh1b/relocation", "Plan"],
        ].map(([t, d, h, k]) => (
          <Link key={t} href={h} className="group rounded-card border border-line bg-card p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">{k}</span>
            <b className="mt-1 block font-display text-lg">{t}</b>
            <span className="text-sm text-muted">{d}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-display text-lg font-bold">Top matches this week</h2>
            <JevMark />
          </div>
          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {matches.slice(0, 3).map((m) => (
              <li key={m.m.id} className="flex items-center gap-4 rounded-field border border-line p-3">
                <ScoreRing score={m.score} />
                <div className={`min-w-0 ${sub.active ? "" : "blurred"}`} aria-hidden={!sub.active}>
                  <b className="block truncate">{m.m.title}</b>
                  <span className="block text-sm text-muted">{m.m.locationLabel}</span>
                </div>
                <span className="ml-auto hidden text-right text-xs text-good sm:block">{m.reasons[0]}</span>
              </li>
            ))}
          </ul>
          {!sub.active && <p className="m-0 mt-3 text-sm text-muted">Company names and roles are hidden until you subscribe. The reasons are real.</p>}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="m-0 font-display text-lg font-bold">Support</h2>
            <Link href="/exh1b/dashboard/support/new" className="text-sm font-bold text-accent">
              New ticket
            </Link>
          </div>
          {tickets.length === 0 && <p className="text-sm text-muted">No tickets yet.</p>}
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/exh1b/dashboard/support/${t.id}`} className="flex items-center justify-between gap-2 rounded-field px-2 py-2 text-sm no-underline hover:bg-bg-2">
                  <span className="min-w-0 truncate font-semibold">{t.subject}</span>
                  <Badge tone={t.status === "resolved" ? "good" : "warn"}>{t.status.replace("_", " ")}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
