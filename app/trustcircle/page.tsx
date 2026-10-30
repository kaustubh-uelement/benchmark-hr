import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { TCFooter, TCHeader } from "@/components/trustcircle";
import { ActionForm, SubmitButton } from "@/components/client";
import { submitLead } from "@/app/actions/leads";

export const metadata = { title: { absolute: "TrustCircle — The next chapter" } };

const STEPS = [
  ["Week 1", "Kick-off", "A first, unhurried conversation with your coach about what happened, what you want next, and what you need this month."],
  ["Weeks 1–2", "Your story", "A CV and a one-minute story that explain your next move with confidence, not apology."],
  ["Weeks 2–4", "Market approach", "LinkedIn, a target list, and introductions to openings across Benchmark HR Group."],
  ["Weeks 3–8", "Interviews", "Practice with people who hire for a living, and a debrief after every real interview."],
  ["When it comes", "The offer", "Help weighing offers and negotiating, then a check-in after you start."],
] as const;

export default async function TrustCircle() {
  const tc = db.select().from(s.brands).where(eq(s.brands.slug, "trustcircle")).get()!;
  const participants = db.select({ n: sql<number>`count(distinct person_id)` }).from(s.personBrands).where(and(eq(s.personBrands.brandId, tc.id), eq(s.personBrands.relationship, "participant"))).get()!.n;
  const sessions = db.select({ n: sql<number>`count(*)` }).from(s.coachingSessions).where(eq(s.coachingSessions.status, "done")).get()!.n;
  const programmes = db.select({ n: sql<number>`count(*)` }).from(s.mandates).where(and(eq(s.mandates.brandId, tc.id), inArray(s.mandates.status, ["open"]))).get()!.n;
  const openRoles = db.select({ n: sql<number>`count(*)` }).from(s.mandates).where(and(eq(s.mandates.status, "open"), eq(s.mandates.kind, "job"))).get()!.n;

  return (
    <>
      <TCHeader />
      <section className="relative overflow-hidden px-5 pb-20 pt-14 sm:px-8">
        <div aria-hidden="true" className="absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_65%)]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="rise m-0 text-[15px] font-bold text-accent">Career transition · Outplacement · Coaching</p>
            <h1 className="rise rise-2 m-0 mt-5 font-display text-[clamp(46px,5.6vw,78px)] font-semibold leading-[1] tracking-[-.02em]">
              The next <em className="font-normal text-accent">chapter</em>
              <br />
              starts with someone in your corner.
            </h1>
            <p className="rise rise-3 mt-7 max-w-[540px] text-lg leading-relaxed text-muted">
              When roles end through restructuring, TrustCircle gives every person a named coach, a plan and real openings from across Benchmark HR Group. Companies get a way to part well.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#sponsor" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-bold text-primary-ink no-underline">
                Support your people
              </a>
              <a href="#talk" className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-primary px-6 font-bold no-underline">
                My role has ended
              </a>
            </div>
          </div>
          <div className="rise rise-3 relative mx-auto aspect-square w-full max-w-[440px]" aria-hidden="true">
            <svg viewBox="0 0 400 400" className="h-full w-full">
              <circle cx="160" cy="200" r="130" fill="none" stroke="var(--primary)" strokeWidth="2" />
              <circle cx="240" cy="200" r="130" fill="var(--accent-soft)" fillOpacity=".55" stroke="var(--accent)" strokeWidth="2" />
              <circle cx="200" cy="200" r="54" fill="var(--sage)" fillOpacity=".55" />
              {[0, 72, 144, 216, 288].map((a, i) => {
                const r = (a * Math.PI) / 180;
                return <circle key={i} cx={200 + Math.cos(r) * 92} cy={200 + Math.sin(r) * 92} r="9" fill={i === 0 ? "var(--accent)" : "var(--primary)"} />;
              })}
            </svg>
            <div className="absolute bottom-6 left-0 rounded-card bg-card px-5 py-4 shadow-[0_20px_50px_-25px_rgba(31,59,53,.45)]">
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-accent">This week</p>
              <p className="m-0 mt-1 font-display text-lg font-semibold">“Interview practice went well.”</p>
              <p className="m-0 text-xs text-muted">Session 4 of 5 · plant operations leader</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary px-5 py-12 text-primary-ink sm:px-8">
        <dl className="mx-auto m-0 grid max-w-[1240px] grid-cols-2 gap-6 md:grid-cols-4">
          {[
            [String(participants), "people supported"],
            [String(sessions), "coaching sessions held"],
            [String(programmes), "company programmes running"],
            [String(openRoles), "openings across the group right now"],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="font-display text-[46px] font-semibold leading-none">{n}</dt>
              <dd className="m-0 mt-2 text-sm opacity-80">{l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="programme" className="scroll-mt-6 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 max-w-3xl font-display text-[clamp(36px,4.6vw,60px)] font-semibold leading-[1.04]">Five steps, at your pace, with the same coach throughout.</h2>
          <ol className="m-0 mt-14 grid list-none gap-4 p-0 md:grid-cols-5">
            {STEPS.map(([w, t, d], i) => (
              <li key={t} className="flex flex-col gap-3 rounded-card bg-card p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-display text-lg font-semibold text-accent">{i + 1}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-faint">{w}</span>
                <h3 className="m-0 font-display text-2xl font-semibold">{t}</h3>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-bg-2 px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-6 lg:grid-cols-2">
          <article className="rounded-card bg-card p-9">
            <span className="text-sm font-bold text-accent">For companies</span>
            <h3 className="m-0 mt-2 font-display text-[34px] font-semibold leading-tight">Part well. It&apos;s remembered.</h3>
            <ul className="m-0 mt-6 flex list-none flex-col gap-3 p-0 text-[16px]">
              {["A fixed fee per person, agreed before any announcement", "Coaches briefed within 48 hours of your go-ahead", "A sponsor dashboard: progress and outcomes, never private coaching notes", "Openings from Benchmark Talent, ExH1B and Golden Glove for every participant"].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 flex-none rounded-full border-2 border-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-card bg-primary p-9 text-primary-ink">
            <span className="text-sm font-bold text-[var(--sage)]">For people</span>
            <h3 className="m-0 mt-2 font-display text-[34px] font-semibold leading-tight">This is a pause, not a verdict.</h3>
            <ul className="m-0 mt-6 flex list-none flex-col gap-3 p-0 text-[16px]">
              {["Your own portal: your plan, your next session, your matched roles", "One click to say you're interested in an opening", "Everything you tell your coach stays with your coach", "If your employer doesn't sponsor you, your first conversation is free"].map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-1.5 h-3 w-3 flex-none rounded-full border-2 border-[var(--sage)]" />
                  {x}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-2">
          <div id="sponsor" className="scroll-mt-6 rounded-card border border-line bg-card p-8">
            <h2 className="m-0 font-display text-3xl font-semibold">Plan a programme</h2>
            <p className="mb-5 mt-2 text-muted">Confidential. We reply within one business day.</p>
            <ActionForm action={submitLead} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="brand" value="trustcircle" />
              <input type="hidden" name="kind" value="outplacement" />
              <input name="name" className="field" placeholder="Your name" aria-label="Your name" required />
              <input name="email" type="email" className="field" placeholder="Work email" aria-label="Work email" required />
              <input name="company" className="field" placeholder="Company" aria-label="Company" />
              <input name="role" className="field" placeholder="How many people, roughly?" aria-label="How many people" />
              <textarea name="message" rows={4} className="field sm:col-span-2" placeholder="Timing, locations, seniority. Share only what you're comfortable with." aria-label="Details" />
              <div className="sm:col-span-2">
                <SubmitButton>Send</SubmitButton>
              </div>
            </ActionForm>
          </div>
          <div id="talk" className="scroll-mt-6 rounded-card bg-accent-soft p-8">
            <h2 className="m-0 font-display text-3xl font-semibold">Talk to a coach</h2>
            <p className="mb-5 mt-2 text-muted">Tell us a little about where you are. A coach will call you, usually the same week.</p>
            <ActionForm action={submitLead} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="brand" value="trustcircle" />
              <input type="hidden" name="kind" value="outplacement" />
              <input name="name" className="field" placeholder="Your name" aria-label="Your name" required />
              <input name="email" type="email" className="field" placeholder="Email" aria-label="Email" required />
              <input name="phone" className="field" placeholder="Phone" aria-label="Phone" />
              <input name="role" className="field" placeholder="Your last role" aria-label="Your last role" />
              <textarea name="message" rows={4} className="field sm:col-span-2" placeholder="What would help most right now?" aria-label="What would help" />
              <div className="sm:col-span-2">
                <SubmitButton variant="accent">Ask for a call</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </section>
      <TCFooter />
    </>
  );
}
