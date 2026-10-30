import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { ExH1BMark } from "@/components/marks";
import { ThemeToggle, ActionForm, SubmitButton } from "@/components/client";
import { submitLead } from "@/app/actions/leads";
import { money } from "@/lib/time";

export const metadata = { title: { absolute: "ExH1B — Personalised job discovery for professionals coming home" } };

function RouteHero() {
  return (
    <svg viewBox="0 0 520 260" className="absolute inset-x-0 top-6 w-full opacity-90" aria-hidden="true">
      <path className="route-line" d="M40 210 C 140 30, 360 20, 480 120" fill="none" stroke="var(--marigold)" strokeWidth="2.5" strokeDasharray="900" strokeLinecap="round" />
      <circle cx="40" cy="210" r="7" fill="var(--accent)" />
      <circle cx="480" cy="120" r="7" fill="var(--marigold)" />
      <text x="54" y="232" fontSize="12" fontWeight="700" fill="currentColor" opacity=".7">Seattle · Dublin · London · Dubai</text>
      <text x="418" y="146" fontSize="12" fontWeight="700" fill="currentColor" opacity=".7">India</text>
    </svg>
  );
}

export default async function ExLanding() {
  const u = await getUser();
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  const openRoles = db.select({ n: sql<number>`count(*)` }).from(s.mandates).where(and(eq(s.mandates.status, "open"), eq(s.mandates.kind, "job"))).get()!.n;
  const employers = db.select({ n: sql<number>`count(distinct ${s.mandates.orgId})` }).from(s.mandates).where(and(eq(s.mandates.status, "open"), eq(s.mandates.kind, "job"))).get()!.n;
  const plans = db.select().from(s.plans).where(and(eq(s.plans.brandId, ex.id), eq(s.plans.active, true))).all();
  return (
    <div>
      <header className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 sm:px-6">
        <Link href="/exh1b" className="no-underline">
          <ExH1BMark />
        </Link>
        <nav aria-label="Main" className="order-last flex w-full flex-wrap gap-x-6 gap-y-1 text-sm font-semibold text-muted md:order-none md:w-auto">
          <a href="#how" className="no-underline hover:text-ink">How it works</a>
          <a href="#support" className="no-underline hover:text-ink">Personalised Support</a>
          <a href="#employers" className="no-underline hover:text-ink">Employer transition</a>
          <a href="#pricing" className="no-underline hover:text-ink">Pricing</a>
          <a href="#contact" className="no-underline hover:text-ink">Contact Us</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {u ? (
            <Link href="/exh1b/dashboard" className="inline-flex min-h-11 items-center rounded-btn bg-primary px-5 text-sm font-bold text-primary-ink no-underline">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/exh1b/auth/login" className="inline-flex min-h-11 items-center rounded-btn px-4 text-sm font-bold no-underline hover:bg-bg-2">
                Login
              </Link>
              <Link href="/exh1b/auth/signup" className="inline-flex min-h-11 items-center rounded-btn bg-primary px-5 text-sm font-bold text-primary-ink no-underline">
                Create your profile
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="rise inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent">Personalised Job Discovery</span>
          <h1 className="rise rise-2 m-0 mt-5 font-display text-[clamp(38px,5.2vw,66px)] font-extrabold leading-[1.04] tracking-[-.02em]">
            Discover the right opportunities earlier. <span className="text-accent">Reach the right people.</span>
          </h1>
          <p className="rise rise-3 mt-6 max-w-xl text-lg leading-relaxed text-muted">
            For Indian professionals abroad who are planning their move home. Get matched to roles in India with the reasons spelled out, keep your current employer through our Employer of Record service, and plan the move with a checklist built for the country you&apos;re leaving.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/exh1b/auth/signup" className="inline-flex min-h-12 items-center rounded-btn bg-primary px-6 font-bold text-primary-ink no-underline">
              Create your profile
            </Link>
            <a href="#employers" className="inline-flex min-h-12 items-center rounded-btn border-[1.5px] border-line px-5 font-bold no-underline hover:bg-bg-2">
              Keep my current employer
            </a>
          </div>
          <dl className="m-0 mt-10 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="font-display text-3xl font-extrabold">{openRoles}</dt>
              <dd className="m-0 text-sm text-muted">open roles right now</dd>
            </div>
            <div>
              <dt className="font-display text-3xl font-extrabold">{employers}</dt>
              <dd className="m-0 text-sm text-muted">hiring organisations</dd>
            </div>
            <div>
              <dt className="font-display text-3xl font-extrabold">9</dt>
              <dd className="m-0 text-sm text-muted">countries with move-home checklists</dd>
            </div>
          </dl>
        </div>
        <div className="relative min-h-[420px] rounded-[28px] bg-primary p-6 text-primary-ink">
          <RouteHero />
          <div className="relative mt-[190px] flex flex-col gap-3">
            {[
              { pct: 88, role: "Principal Engineer, Platform", org: "Product company · Bengaluru", why: "Has Kubernetes, Go, AWS · same job family" },
              { pct: 82, role: "Engineering Manager", org: "Global capability centre · Hyderabad", why: "Wants Hyderabad · 13 years (needs 11+)" },
            ].map((c) => (
              <div key={c.pct} className="flex items-center gap-4 rounded-2xl bg-card p-4 text-ink shadow-lg">
                <span className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-xl bg-accent-soft font-display text-lg font-extrabold text-accent">{c.pct}%</span>
                <span className="min-w-0">
                  <b className="block truncate">{c.role}</b>
                  <span className="block text-sm text-muted">{c.org}</span>
                  <span className="block text-xs font-semibold text-good">{c.why}</span>
                </span>
              </div>
            ))}
            <p className="m-0 text-center text-xs opacity-70">Example matches. Every match shows its reasons and gaps.</p>
          </div>
        </div>
      </section>

      <section id="how" className="bg-bg-2 px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 font-display text-4xl font-extrabold tracking-tight">How it works</h2>
          <ol className="m-0 mt-10 grid list-none gap-4 p-0 md:grid-cols-4">
            {[
              ["Create your profile", "Six short steps. Upload your resume and Jev, our assistant, fills in your title, experience and skills."],
              ["See matched roles", "Roles from India employers, ranked for you, with the reasons and the gaps spelled out."],
              ["Plan your move", "A checklist for the country you're leaving, a cost-of-living comparator and visa and tax guidance."],
              ["Land and settle", "Track applications, talk to our team and the community, and keep your employer through EOR if you want to."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-card border border-line bg-card p-6">
                <span className="font-display text-sm font-extrabold text-accent">0{i + 1}</span>
                <h3 className="m-0 mt-2 font-display text-xl font-bold">{t}</h3>
                <p className="m-0 mt-2 text-[15px] leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="support" className="px-5 py-20 sm:px-6">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-2">
          <div>
            <h2 className="m-0 font-display text-4xl font-extrabold tracking-tight">Personalised support from people who have done it</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">Every plan includes time with our team. Questions about offers, cities, schools or employers get a named person and a response time you can see.</p>
          </div>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {[
              ["Career consultations", "Offer reviews, salary conversations and target companies."],
              ["Relocation Hub", "Checklists for the US, UK, Canada, Ireland, UAE, Singapore, Germany, Australia and more."],
              ["Support with an SLA", "Every ticket shows its owner and when you'll hear back."],
              ["Community", "Ask people who moved back last year what they wish they'd known."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-card border border-line bg-card p-5">
                <b className="font-display">{t}</b>
                <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="employers" className="bg-primary px-5 py-20 text-primary-ink sm:px-6">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-2">
          <div>
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--marigold)]">Employer transition</span>
            <h2 className="m-0 mt-3 font-display text-4xl font-extrabold tracking-tight">Keep your job. Move home.</h2>
            <p className="mt-4 text-lg leading-relaxed opacity-85">
              Many employers would rather keep a trusted person than replace them. ExH1B can act as your Employer of Record in India: we employ you locally, run payroll and compliance, and your employer keeps directing your work.
            </p>
            <ol className="m-0 mt-6 flex list-none flex-col gap-2 p-0">
              {["Intake", "Employer consent", "Contract", "Payroll setup", "Compliance", "Active"].map((st, i) => (
                <li key={st} className="flex items-center gap-3 text-[15px]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--marigold)] text-xs font-extrabold text-[#0e2240]">{i + 1}</span>
                  {st}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-card bg-card p-6 text-ink">
            <h3 className="m-0 font-display text-2xl font-bold">Ask about Employer of Record</h3>
            <p className="m-0 mb-4 mt-1 text-sm text-muted">For members or their managers. We reply within one business day.</p>
            <ActionForm action={submitLead} className="flex flex-col gap-3">
              <input type="hidden" name="brand" value="exh1b" />
              <input type="hidden" name="kind" value="eor" />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Your name
                  <input className="field" name="name" required />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Email
                  <input className="field" type="email" name="email" required />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Current employer
                  <input className="field" name="company" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  I am
                  <select className="field" name="role">
                    <option>An employee planning to move</option>
                    <option>A manager or HR at the employer</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Anything we should know?
                <textarea className="field" name="message" rows={3} />
              </label>
              <SubmitButton pendingText="Sending…">Send</SubmitButton>
            </ActionForm>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 font-display text-4xl font-extrabold tracking-tight">Membership</h2>
          <p className="mt-3 text-lg text-muted">Creating a profile is free. Membership unlocks matched roles, applications and consultations. Prices in India in rupees; everywhere else in US dollars.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(["month", "quarter", "year"] as const).map((iv) => {
              const inr = plans.find((p) => p.interval === iv && p.region === "IN")!;
              const usd = plans.find((p) => p.interval === iv && p.region === "INTL")!;
              return (
                <div key={iv} className={`flex flex-col gap-3 rounded-card border p-6 ${iv === "year" ? "border-accent bg-card shadow-lg" : "border-line bg-card"}`}>
                  <span className="text-sm font-bold uppercase tracking-wider text-accent">{usd.name}{iv === "year" ? " · best value" : ""}</span>
                  <p className="m-0 font-display text-3xl font-extrabold">
                    {money(usd.amount, "USD")}
                    <span className="text-base font-semibold text-muted"> / {iv}</span>
                  </p>
                  <p className="m-0 text-sm text-muted">or {money(inr.amount, "INR")} in India</p>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                    {usd.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="text-accent">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={u ? "/exh1b/dashboard/billing" : "/exh1b/auth/signup"} className="mt-auto inline-flex min-h-11 items-center justify-center rounded-btn bg-primary px-5 font-bold text-primary-ink no-underline">
                    Choose {usd.name.toLowerCase()}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-bg-2 px-5 py-20 sm:px-6">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-2">
          <div>
            <h2 className="m-0 font-display text-4xl font-extrabold tracking-tight">Contact us</h2>
            <p className="mt-3 text-lg text-muted">Questions before you join? Write to us and a person will reply.</p>
            <p className="mt-6 text-sm text-muted">
              ExH1B is part of{" "}
              <Link href="/" className="font-bold text-ink">
                Benchmark HR Group
              </Link>
              .
            </p>
          </div>
          <ActionForm action={submitLead} className="flex flex-col gap-3 rounded-card border border-line bg-card p-6">
            <input type="hidden" name="brand" value="exh1b" />
            <input type="hidden" name="kind" value="enquiry" />
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Name
              <input className="field" name="name" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Email
              <input className="field" type="email" name="email" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Message
              <textarea className="field" name="message" rows={3} />
            </label>
            <SubmitButton pendingText="Sending…">Send message</SubmitButton>
          </ActionForm>
        </div>
      </section>
      <footer className="border-t border-line px-5 py-8 text-sm text-muted sm:px-6">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3">
          <span>© 2026 ExH1B, a Benchmark HR Group business</span>
          <span className="flex gap-4">
            <Link href="/">Benchmark HR</Link>
            <Link href="/goldenglove">Golden Glove</Link>
            <Link href="/talent">Benchmark Talent</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
