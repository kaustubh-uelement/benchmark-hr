import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { familiesWithRoles } from "@/lib/queries";
import { GGEyebrow, GGFooter, GGHeader, GGRule } from "@/components/goldenglove";
import { ActionForm, SubmitButton } from "@/components/client";
import { submitLead } from "@/app/actions/leads";
import { registerExecutive } from "@/app/actions/portal";
import { parseTs } from "@/lib/time";

export const metadata = { title: { absolute: "Golden Glove Executive Search — The leader" } };

const PRACTICES = [
  ["I", "Board & CEO", "Chief executives, managing directors, independent directors and board chairs, including regulated appointments."],
  ["II", "Technology & Digital", "CTOs, CIOs, CDOs, CISOs and heads of AI for banks, platforms and capability centres."],
  ["III", "Finance & Risk", "CFOs, chief risk officers and treasurers, often ahead of fundraises and listings."],
  ["IV", "People & Culture", "CHROs and talent leaders who can redesign an organisation, not just run one."],
  ["V", "Industrial & Energy", "Plant, operations and business-unit heads for manufacturing, mobility and renewables."],
  ["VI", "Global Capability Centres", "Site leaders and the first leadership layer for GCCs opening or scaling in India."],
] as const;

const METHOD = [
  ["Brief", "Week 1", "A partner spends time with the board, founder and the people the new leader will work with."],
  ["Map", "Weeks 1–3", "Every credible leader in the market, including those who are not looking."],
  ["Approach", "Weeks 2–4", "Discreet, partner-led conversations. The client's name is shared only with consent."],
  ["Assess", "Weeks 3–5", "Capability, leadership behaviour and stakeholder fit, with referencing done early."],
  ["Shortlist", "Week 5–6", "Three to five people, each with our candid view. Never a pile of CVs."],
  ["Appoint", "Weeks 8–12", "Offer design, negotiation and the resignation conversation."],
  ["Settle in", "First 6 months", "Check-ins with the leader and the board at 30, 90 and 180 days."],
] as const;

const FAM_LABEL: Record<string, string> = {
  "general-management": "Leadership",
  engineering: "Technology",
  finance: "Finance",
  bfsi: "Financial services",
  hr: "People",
  security: "Security",
};

export default async function GoldenGlove() {
  const gg = db.select().from(s.brands).where(eq(s.brands.slug, "golden-glove")).get()!;
  const active = db.select({ n: sql<number>`count(*)` }).from(s.mandates).where(and(eq(s.mandates.brandId, gg.id), eq(s.mandates.status, "open"))).get()!.n;
  const network = db.select({ n: sql<number>`count(distinct person_id)` }).from(s.personBrands).where(and(eq(s.personBrands.brandId, gg.id), eq(s.personBrands.relationship, "executive"))).get()!.n;
  const appointed = db
    .select({ m: s.mandates, ind: s.organisations.industry, fam: s.jobFamilies.slug, e: s.engagements })
    .from(s.engagements)
    .innerJoin(s.mandates, eq(s.mandates.id, s.engagements.mandateId))
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .leftJoin(s.jobFamilies, eq(s.jobFamilies.id, s.mandates.familyId))
    .where(and(eq(s.mandates.brandId, gg.id), inArray(s.engagements.stage, ["placed", "offer"])))
    .orderBy(desc(s.engagements.updatedAt))
    .all();
  const recent = [
    ...appointed.map((a) => ({ title: a.m.title, where: `${a.ind ?? "Private company"} · ${(a.m.locationLabel ?? "").split(",")[0]}`, weeks: Math.max(6, Math.round((parseTs(a.e.updatedAt).getTime() - parseTs(a.m.openedAt).getTime()) / (7 * 864e5)) + 6), fam: FAM_LABEL[a.fam ?? ""] ?? "Leadership", status: a.e.stage === "placed" ? "Appointed" : "Offer accepted" })),
    { title: "Chief Executive Officer", where: "Listed consumer company · Mumbai", weeks: 13, fam: "Leadership", status: "Appointed" },
    { title: "Chief Digital Officer", where: "Life insurer · Gurugram", weeks: 11, fam: "Technology", status: "Appointed" },
    { title: "Independent Director, Audit Chair", where: "NBFC · Pune", weeks: 9, fam: "Board", status: "Appointed" },
  ].slice(0, 6);
  const families = familiesWithRoles();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgba(212,176,106,.16),transparent_60%),radial-gradient(40%_50%_at_0%_100%,rgba(184,145,63,.10),transparent_70%)]" />
        <GGHeader />
        <div className="relative mx-auto grid max-w-[1280px] items-end gap-14 px-5 pb-24 pt-20 sm:px-10 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="rise m-0">
              <GGEyebrow>Retained executive search · since 2013</GGEyebrow>
            </p>
            <h1 className="rise rise-2 m-0 mt-7 font-display text-[clamp(64px,10vw,150px)] font-medium leading-[.9] tracking-[-.02em]">
              The <em className="gold-text font-medium">leader</em>
              <span className="text-[var(--gold-2)]">.</span>
            </h1>
            <p className="rise rise-3 mt-9 max-w-xl text-[19px] font-light leading-relaxed text-muted">
              Partner-led search for the appointments that decide what a company becomes: chief executives, boards, and the rare specialists every other firm says can&apos;t be found.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#brief" className="inline-flex min-h-13 items-center bg-[linear-gradient(100deg,var(--gold-1),var(--gold-2))] px-7 text-[13px] font-semibold uppercase tracking-[.24em] text-[#0b0d10] no-underline hover:brightness-110">
                Brief a partner
              </a>
              <a href="#leaders" className="inline-flex min-h-13 items-center border border-[var(--gold-3)] px-7 text-[13px] font-medium uppercase tracking-[.24em] text-[var(--gold-1)] no-underline hover:bg-[var(--accent-soft)]">
                Register in confidence
              </a>
            </div>
          </div>
          <aside className="rise rise-3 relative border border-[var(--gold-3)] bg-[linear-gradient(160deg,#15191f,#0f1216)] p-8" aria-label="An example search">
            <span className="absolute -top-px left-8 right-8 h-px bg-[linear-gradient(90deg,transparent,var(--gold-1),transparent)]" aria-hidden="true" />
            <GGEyebrow>Search in progress</GGEyebrow>
            <p className="m-0 mt-4 font-display text-[34px] leading-tight">Chief Technology Officer</p>
            <p className="m-0 mt-1 text-sm text-muted">Private bank · Mumbai · confidential</p>
            <ol className="m-0 mt-8 flex list-none flex-col gap-0 p-0">
              {[
                ["Mapped", "212 technology leaders", true],
                ["Approached", "38 conversations", true],
                ["Assessed", "11 in depth", true],
                ["Shortlist", "4 presented · week 5", true],
                ["Appointment", "Board interviews next", false],
              ].map(([k, v, done], i) => (
                <li key={k as string} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < 4 && <span aria-hidden="true" className={`absolute left-[7px] top-4 h-full w-px ${done ? "bg-[var(--gold-2)]" : "bg-line"}`} />}
                  <span aria-hidden="true" className={`relative mt-1 h-[15px] w-[15px] flex-none rounded-full border ${done ? "border-[var(--gold-1)] bg-[var(--gold-2)]" : "border-[var(--gold-3)] bg-transparent"}`} />
                  <span className="text-sm">
                    <b className="block font-medium tracking-wide">{k}</b>
                    <span className="text-muted">{v}</span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
        <GGRule />
        <dl className="mx-auto m-0 grid max-w-[1280px] grid-cols-2 gap-y-8 px-5 py-12 sm:px-10 md:grid-cols-4">
          {[
            [String(active), "searches in progress"],
            [`${network}`, "leaders in our private network"],
            ["5–6", "weeks to a shortlist"],
            ["3–5", "people on every shortlist, each with our view"],
          ].map(([n, l]) => (
            <div key={l} className="border-l border-[var(--gold-3)] pl-5">
              <dt className="font-display text-[48px] leading-none text-[var(--gold-1)]">{n}</dt>
              <dd className="m-0 mt-2 text-sm text-muted">{l}</dd>
            </div>
          ))}
        </dl>
        <GGRule />
      </section>

      {/* STATEMENT */}
      <section className="px-5 py-28 sm:px-10">
        <p className="mx-auto m-0 max-w-[1000px] text-center font-display text-[clamp(30px,4vw,54px)] font-medium leading-[1.15]">
          We take on few searches, and finish every one. <span className="text-muted">A partner leads your search from the first brief until your new leader is settled in.</span>
        </p>
      </section>

      {/* PRACTICE */}
      <section id="practice" className="bg-bg-2 px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <GGEyebrow>Practice areas</GGEyebrow>
              <h2 className="m-0 mt-4 font-display text-[clamp(40px,5vw,68px)] font-medium leading-none">Where we search</h2>
            </div>
            <p className="m-0 max-w-md text-muted">Six practices, one standard. Each search draws on the whole Benchmark HR Group network, including leaders returning to India through ExH1B.</p>
          </div>
          <div className="mt-14 grid gap-px bg-line md:grid-cols-2 lg:grid-cols-3">
            {PRACTICES.map(([n, t, d]) => (
              <article key={t} className="group flex min-h-[250px] flex-col gap-4 bg-bg-2 p-9 transition hover:bg-card">
                <span className="font-display text-[22px] italic text-[var(--gold-2)]">{n}</span>
                <h3 className="m-0 font-display text-[32px] font-medium leading-tight">{t}</h3>
                <p className="m-0 font-light leading-relaxed text-muted">{d}</p>
                <span aria-hidden="true" className="mt-auto h-px w-10 bg-[var(--gold-2)] transition-all group-hover:w-24" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* METHOD */}
      <section id="method" className="px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <GGEyebrow>The method</GGEyebrow>
          <h2 className="m-0 mt-4 max-w-3xl font-display text-[clamp(40px,5vw,68px)] font-medium leading-none">Seven stages. One partner throughout.</h2>
          <ol className="m-0 mt-16 grid list-none gap-0 p-0 md:grid-cols-7">
            {METHOD.map(([t, w, d], i) => (
              <li key={t} className="relative flex flex-col gap-3 border-t border-[var(--gold-3)] pb-10 pr-5 pt-8 md:border-t-0 md:pt-0">
                <span aria-hidden="true" className="absolute -top-[5px] left-0 hidden h-[9px] w-[9px] rotate-45 bg-[var(--gold-2)] md:block" />
                <span aria-hidden="true" className="absolute left-0 right-0 top-0 hidden h-px bg-[var(--gold-3)] md:block" />
                <span className="font-display text-[15px] italic text-[var(--gold-2)] md:mt-8">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="m-0 font-display text-[28px] font-medium">{t}</h3>
                <span className="text-[11.5px] uppercase tracking-[.22em] text-[var(--gold-1)]">{w}</span>
                <p className="m-0 text-sm font-light leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* APPOINTMENTS */}
      <section id="appointments" className="border-y border-line bg-[#0e1115] px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <GGEyebrow>Recent appointments</GGEyebrow>
              <h2 className="m-0 mt-4 font-display text-[clamp(40px,5vw,68px)] font-medium leading-none">Discretion is the job</h2>
            </div>
            <p className="m-0 max-w-md text-muted">Clients are never named without permission. Appointments are described the way we would describe them to you. (Demo data: replace with approved case studies before launch.)</p>
          </div>
          <ul className="m-0 mt-14 flex list-none flex-col p-0">
            {recent.map((r, i) => (
              <li key={i} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-line py-6 md:grid-cols-[120px_1.4fr_1.2fr_120px_140px]">
                <span className="hidden text-[12px] uppercase tracking-[.24em] text-[var(--gold-2)] md:block">{r.fam}</span>
                <span className="font-display text-[28px] leading-tight">{r.title}</span>
                <span className="order-3 col-span-2 text-sm text-muted md:order-none md:col-span-1">{r.where}</span>
                <span className="hidden text-sm text-muted md:block">{r.weeks} weeks</span>
                <span className="text-right text-[12px] uppercase tracking-[.2em] text-[var(--gold-1)]">{r.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CONFIDENTIAL BY DESIGN */}
      <section className="px-5 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <GGEyebrow>Confidential by design</GGEyebrow>
            <h2 className="m-0 mt-4 font-display text-[clamp(36px,4.4vw,58px)] font-medium leading-[1.02]">Your search stays between you and your partner.</h2>
          </div>
          <ul className="m-0 grid list-none gap-px bg-line p-0 sm:grid-cols-2">
            {[
              ["Named only with consent", "Candidates learn the client's name only once they agree to be considered."],
              ["Partner-only access", "Confidential mandates are invisible to the rest of the group, enforced in the database, not just on screen."],
              ["Research, then judgement", "Our assistant, Jev, maps the market and drafts longlists. A partner decides who is approached, every time."],
              ["Your own client room", "Follow the search live: the market map, the shortlist with our view on each person, and your decisions."],
            ].map(([t, d]) => (
              <li key={t} className="flex flex-col gap-2 bg-bg p-7">
                <b className="font-display text-[24px] font-medium">{t}</b>
                <span className="text-sm font-light leading-relaxed text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="bg-bg-2 px-5 py-24 sm:px-10">
        <div className="mx-auto max-w-[1280px]">
          <GGEyebrow>The partners</GGEyebrow>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              ["Anand Joshi", "Founding Partner", "Twelve years of leadership search across BFSI, technology and capability centres. Founder of Benchmark HR Group."],
              ["Ishita Rao", "Search Partner", "Leads board, CXO and regulated appointments across financial services and technology."],
              ["Mihir Gokhale", "Head of Research", "Builds the market maps behind every search, with Jev, across India and the diaspora."],
            ].map(([n, r, d]) => (
              <article key={n} className="flex flex-col gap-4">
                <div className="relative flex aspect-[4/5] items-end overflow-hidden border border-line bg-[linear-gradient(170deg,#1b2028,#0b0d10)] p-6">
                  <span aria-hidden="true" className="absolute inset-6 border border-[var(--gold-3)] opacity-50" />
                  <span className="relative font-display text-[80px] italic leading-none text-[var(--gold-2)]">
                    {n
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <h3 className="m-0 font-display text-[28px] font-medium">{n}</h3>
                  <p className="m-0 text-[12px] uppercase tracking-[.24em] text-[var(--gold-2)]">{r}</p>
                  <p className="m-0 mt-3 text-sm font-light leading-relaxed text-muted">{d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FOR LEADERS + BRIEF */}
      <section className="px-5 py-24 sm:px-10">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-2">
          <div id="leaders" className="scroll-mt-10 border border-line bg-card p-8 sm:p-10">
            <GGEyebrow>For leaders</GGEyebrow>
            <h2 className="m-0 mt-4 font-display text-[44px] font-medium leading-none">Register in confidence</h2>
            <p className="mt-4 font-light leading-relaxed text-muted">Your details are seen only by Golden Glove partners. We contact you only about roles that genuinely fit, and never share your name with a client without asking.</p>
            <ActionForm action={registerExecutive} className="mt-6 grid gap-4 sm:grid-cols-2">
              <input name="firstName" className="field" placeholder="First name" aria-label="First name" required autoComplete="given-name" />
              <input name="lastName" className="field" placeholder="Last name" aria-label="Last name" required autoComplete="family-name" />
              <input name="email" type="email" className="field sm:col-span-2" placeholder="Personal email" aria-label="Personal email" required autoComplete="email" />
              <input name="title" className="field" placeholder="Current title" aria-label="Current title" />
              <input name="company" className="field" placeholder="Organisation" aria-label="Organisation" />
              <select name="familyId" className="field" aria-label="Function" defaultValue="">
                <option value="">Function</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select name="seniority" className="field" aria-label="Level" defaultValue="Leadership">
                <option value="Leadership">VP / Director / Head</option>
                <option value="CXO">CXO</option>
                <option value="Board">Board</option>
              </select>
              <input name="years" type="number" min={0} className="field" placeholder="Years of experience" aria-label="Years of experience" />
              <input name="city" className="field" placeholder="City" aria-label="City" />
              <input name="linkedin" className="field sm:col-span-2" placeholder="LinkedIn profile (optional)" aria-label="LinkedIn" />
              <textarea name="note" rows={3} className="field sm:col-span-2" placeholder="What would make your next move worth it?" aria-label="Note" />
              <label className="flex items-start gap-2.5 text-sm font-light text-muted sm:col-span-2">
                <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--gold-2)]" />I agree Golden Glove may hold these details in confidence to consider me for leadership roles.
              </label>
              <label className="flex items-start gap-2.5 text-sm font-light text-muted sm:col-span-2">
                <input type="checkbox" name="share" className="mt-1 h-4 w-4 accent-[var(--gold-2)]" />
                Also let other Benchmark HR Group businesses consider me (optional).
              </label>
              <div className="sm:col-span-2">
                <SubmitButton className="!rounded-none !px-7 !text-[12.5px] !uppercase !tracking-[.22em]" pendingText="Registering…">
                  Register in confidence
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
          <div id="brief" className="scroll-mt-10 border border-[var(--gold-3)] bg-[linear-gradient(160deg,#15191f,#0f1216)] p-8 sm:p-10">
            <GGEyebrow>For boards & founders</GGEyebrow>
            <h2 className="m-0 mt-4 font-display text-[44px] font-medium leading-none">Brief a partner</h2>
            <p className="mt-4 font-light leading-relaxed text-muted">Tell us about the appointment. A partner replies within one business day, and the first conversation is always without obligation.</p>
            <ActionForm action={submitLead} className="mt-6 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="brand" value="golden-glove" />
              <input type="hidden" name="kind" value="search_brief" />
              <input name="name" className="field" placeholder="Your name" aria-label="Your name" required autoComplete="name" />
              <input name="email" type="email" className="field" placeholder="Work email" aria-label="Work email" required autoComplete="email" />
              <input name="company" className="field" placeholder="Organisation" aria-label="Organisation" autoComplete="organization" />
              <input name="phone" className="field" placeholder="Phone" aria-label="Phone" autoComplete="tel" />
              <input name="role" className="field sm:col-span-2" placeholder="The appointment, e.g. Chief Financial Officer" aria-label="The appointment" />
              <textarea name="message" rows={5} className="field sm:col-span-2" placeholder="Context: why now, what success looks like, any confidentiality we should know about." aria-label="Context" />
              <div className="sm:col-span-2">
                <SubmitButton className="!rounded-none !px-7 !text-[12.5px] !uppercase !tracking-[.22em]" pendingText="Sending…">
                  Send to a partner
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </section>
      <GGFooter />
    </>
  );
}
