import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { TalentFooter, TalentHeader } from "@/components/talent";
import { ActionForm, SubmitButton } from "@/components/client";
import { submitLead } from "@/app/actions/leads";
import { money, relTime } from "@/lib/time";

export const metadata = { title: { absolute: "Benchmark Talent — Build the team" } };

export default async function Talent() {
  const tal = db.select().from(s.brands).where(eq(s.brands.slug, "talent")).get()!;
  const roles = db
    .select({ m: s.mandates, org: s.organisations.name, fam: s.jobFamilies.name })
    .from(s.mandates)
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .leftJoin(s.jobFamilies, eq(s.jobFamilies.id, s.mandates.familyId))
    .where(and(eq(s.mandates.brandId, tal.id), eq(s.mandates.status, "open")))
    .orderBy(desc(s.mandates.openedAt))
    .all();
  const placed = db.select({ n: sql<number>`count(*)` }).from(s.engagements).where(and(eq(s.engagements.brandId, tal.id), eq(s.engagements.stage, "placed"))).get()!.n;
  const inPipe = db.select({ n: sql<number>`count(*)` }).from(s.engagements).where(and(eq(s.engagements.brandId, tal.id), inArray(s.engagements.stage, ["applied", "screening", "shortlisted", "interview", "offer"]))).get()!.n;
  const hero = roles[0];
  const heroCounts = hero
    ? db.select({ stage: s.engagements.stage, n: sql<number>`count(*)` }).from(s.engagements).where(eq(s.engagements.mandateId, hero.m.id)).groupBy(s.engagements.stage).all()
    : [];
  const hc = (st: string[]) => heroCounts.filter((r) => st.includes(r.stage)).reduce((a, r) => a + r.n, 0);
  const openings = roles.reduce((a, r) => a + r.m.openings, 0);

  return (
    <>
      <TalentHeader />
      <section className="relative overflow-hidden border-b border-line bg-card-2">
        <div aria-hidden="true" className="absolute inset-0 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:48px_48px] opacity-50 [mask-image:linear-gradient(180deg,#000,transparent_85%)]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="rise inline-flex items-center gap-2 rounded-full border border-line bg-card-2 px-3 py-1 text-[13px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[var(--lime)] ring-2 ring-[color-mix(in_srgb,var(--lime)_40%,transparent)]" />
              {openings} openings live right now
            </span>
            <h1 className="rise rise-2 m-0 mt-6 font-display text-[clamp(52px,7.4vw,104px)] font-bold leading-[.92] tracking-[-.04em]">
              Build the
              <br />
              <span className="relative inline-block">
                team
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 -z-0 h-[.22em] bg-[var(--lime)]" />
              </span>
              <span className="text-accent">.</span>
            </h1>
            <p className="rise rise-3 mt-7 max-w-[520px] text-lg leading-relaxed text-muted">
              Mid-senior and specialist hiring for scale-ups and global capability centres. Technical screening your engineers trust, and a pipeline you can watch live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#hire" className="inline-flex min-h-12 items-center rounded-btn bg-accent px-6 font-bold text-accent-ink no-underline hover:brightness-110">
                Tell us what you&apos;re hiring
              </Link>
              <Link href="/talent/jobs" className="inline-flex min-h-12 items-center rounded-btn border-[1.5px] border-ink px-6 font-bold no-underline hover:bg-bg-2">
                Browse {roles.length} open roles →
              </Link>
            </div>
          </div>
          {hero && (
            <aside className="rise rise-3 rounded-card border border-line bg-card-2 p-6 shadow-[0_24px_60px_-30px_rgba(15,18,34,.35)]" aria-label="A live role">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-faint">
                <span>Live pipeline</span>
                <span className="flex items-center gap-1.5 text-good">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
                  updating
                </span>
              </div>
              <p className="m-0 mt-3 font-display text-2xl font-bold">{hero.m.title}</p>
              <p className="m-0 text-sm text-muted">
                {hero.org} · {hero.m.locationLabel} · opened {relTime(hero.m.openedAt)}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                {[
                  ["Applied & sourced", hc(["applied", "sourced", "screening", "shortlisted", "interview", "offer", "placed", "rejected"])],
                  ["Technically screened", hc(["screening", "shortlisted", "interview", "offer", "placed"])],
                  ["Shortlisted", hc(["shortlisted", "interview", "offer", "placed"])],
                  ["Interviewing", hc(["interview", "offer", "placed"])],
                ].map(([k, v], i, arr) => {
                  const max = Math.max(1, Number(arr[0][1]));
                  return (
                    <div key={k as string} className="text-sm">
                      <div className="flex justify-between font-semibold">
                        <span>{k}</span>
                        <span className="tabular-nums">{v}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-[3px] bg-bg-2">
                        <div className="h-full rounded-[3px] bg-ink" style={{ width: `${Math.max(4, (Number(v) / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="m-0 mt-5 rounded-[6px] bg-accent-soft px-3 py-2 text-xs font-semibold text-accent">Clients see this same view in their portal, with each shortlisted candidate.</p>
            </aside>
          )}
        </div>
      </section>

      <section className="border-b border-line bg-ink px-5 py-10 text-white sm:px-8">
        <dl className="mx-auto m-0 grid max-w-[1240px] grid-cols-2 gap-6 md:grid-cols-4">
          {[
            [String(roles.length), "open roles"],
            [String(inPipe), "candidates in active pipelines"],
            ["9 days", "typical time to first shortlist"],
            [String(placed), "hires closed this year"],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="font-display text-[44px] font-bold leading-none tracking-tight text-[var(--lime)]">{n}</dt>
              <dd className="m-0 mt-1.5 text-sm text-white/70">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="m-0 font-display text-[clamp(34px,4vw,52px)] font-bold tracking-tight">Open right now</h2>
            <Link href="/talent/jobs" className="font-bold text-accent">
              All {roles.length} roles →
            </Link>
          </div>
          <ul className="m-0 mt-8 grid list-none gap-3 p-0 md:grid-cols-2 lg:grid-cols-3">
            {roles.slice(0, 6).map(({ m, org, fam }) => (
              <li key={m.id}>
                <Link href={`/talent/jobs/${m.id}`} className="flex h-full flex-col gap-2 rounded-card border border-line bg-card-2 p-5 no-underline transition hover:-translate-y-0.5 hover:border-accent">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">{fam}</span>
                  <b className="font-display text-xl">{m.title}</b>
                  <span className="text-sm text-muted">
                    {org} · {m.locationLabel?.split(",")[0]} · {m.workMode}
                  </span>
                  <span className="mt-auto pt-3 text-sm font-semibold">
                    {money(m.salaryMin, "INR", true)}–{money(m.salaryMax, "INR", true)} <span className="font-normal text-faint">per year</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="border-y border-line bg-bg-2 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 max-w-2xl font-display text-[clamp(34px,4vw,52px)] font-bold leading-[1.05] tracking-tight">How a role runs, day by day</h2>
          <ol className="m-0 mt-12 grid list-none gap-3 p-0 md:grid-cols-3 lg:grid-cols-6">
            {[
              ["Day 0", "Brief", "30 minutes with the hiring manager: the job, the team, the bar."],
              ["Day 1–3", "Source", "Our network, the group's consented talent pool, and targeted outreach."],
              ["Day 3–7", "Screen", "Structured technical and role screens run by practitioners."],
              ["Day 7–10", "Shortlist", "Three to six people, each with a written assessment."],
              ["Day 10–25", "Interview", "We run logistics and collect feedback within 24 hours."],
              ["Day 25–35", "Offer", "Benchmarked offers, counter-offer prep, joining follow-up."],
            ].map(([d, t, x], i) => (
              <li key={t} className="flex flex-col gap-2 rounded-card border border-line bg-card-2 p-5">
                <span className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-accent">{d}</span>
                  <span className="font-display text-sm font-bold text-faint">0{i + 1}</span>
                </span>
                <b className="font-display text-xl">{t}</b>
                <span className="text-sm leading-relaxed text-muted">{x}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="teams" className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-5 lg:grid-cols-3">
          {[
            ["Specialist hiring", "One critical role, filled properly.", "8.33% of annual CTC, on success. Replacement guarantee for 90 days.", ["Engineering, data, product, finance, operations", "Technical screening by practitioners", "Shortlist in about 9 working days"]],
            ["Team builds", "Five to fifty hires on one plan.", "Volume pricing from 6.5%, with a dedicated recruiter pod.", ["Hiring plan and pay bands agreed up front", "Weekly pipeline review with your leads", "One dashboard for every open role"]],
            ["GCC launch", "Your first hundred in India.", "Fixed monthly fee for the build, plus leadership hires through Golden Glove.", ["Site leader and leadership layer via Golden Glove", "Employer brand and campus plan", "HR set-up through Benchmark Advisory"]],
          ].map(([t, h, p, pts], i) => (
            <article key={t as string} className={`flex flex-col gap-4 rounded-card p-7 ${i === 2 ? "bg-ink text-white" : "border border-line bg-card-2"}`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${i === 2 ? "text-[var(--lime)]" : "text-accent"}`}>{t as string}</span>
              <h3 className="m-0 font-display text-[28px] font-bold leading-tight">{h as string}</h3>
              <p className={`m-0 text-sm ${i === 2 ? "text-white/75" : "text-muted"}`}>{p as string}</p>
              <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0 text-[15px]">
                {(pts as string[]).map((x) => (
                  <li key={x} className="flex gap-2.5">
                    <span className={`mt-1 flex h-4 w-4 flex-none items-center justify-center rounded-[3px] text-[10px] font-extrabold ${i === 2 ? "bg-[var(--lime)] text-ink" : "bg-accent text-white"}`}>✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="hire" className="scroll-mt-6 border-t border-line bg-bg-2 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="m-0 font-display text-[clamp(34px,4vw,52px)] font-bold leading-[1.05] tracking-tight">Tell us what you&apos;re hiring.</h2>
            <p className="mt-4 max-w-md text-lg text-muted">A hiring lead replies within one business day with a plan, a timeline and a fee. No obligation.</p>
            <ul className="m-0 mt-8 flex list-none flex-col gap-3 p-0 text-[15px]">
              {["We only take roles we believe we can fill", "Salary bands shown on every public job post", "Candidates hear back within three business days, every time"].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <span className="mt-2 h-2 w-2 flex-none rounded-[2px] bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-line bg-card-2 p-7">
            <ActionForm action={submitLead} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="brand" value="talent" />
              <input type="hidden" name="kind" value="hiring" />
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Name
                <input name="name" className="field" required autoComplete="name" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Work email
                <input name="email" type="email" className="field" required autoComplete="email" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Company
                <input name="company" className="field" autoComplete="organization" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Roles to fill
                <input name="role" className="field" placeholder="e.g. 4 backend engineers, 1 EM" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
                Anything else
                <textarea name="message" rows={4} className="field" placeholder="Location, timeline, budget, the bar you hold." />
              </label>
              <div className="sm:col-span-2">
                <SubmitButton variant="accent" pendingText="Sending…">
                  Send brief
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </section>
      <TalentFooter />
    </>
  );
}
