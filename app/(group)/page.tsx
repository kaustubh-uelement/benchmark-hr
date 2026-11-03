import Link from "next/link";
import Image from "next/image";
import { GroupHeader, GroupFooter, ContactForm } from "@/components/group";
import { ShortlistPill } from "@/components/marks";
import { BusinessesGrid, type BusinessItem } from "@/components/BusinessesGrid";
import { GlobalPlacesMap } from "@/components/GlobalPlacesMap";

const CLIENTS = [
  { name: "UElement Technologies", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Enterprise", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Cloud", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Systems", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement AI Labs", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Digital", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Networks", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Security", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Data Plane", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Core", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Innovations", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement DeepTech", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Sovereign", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Global", href: "https://uelement.co/", domain: "uelement.co" },
  { name: "UElement Partner", href: "https://uelement.co/", domain: "uelement.co" },
];

const BUSINESSES = [
  { slug: "golden-glove", href: "/goldenglove", tag: "The leader", name: "Golden Glove Executive Search", line: "Retained, partner-led search for CXO, board and rare specialist roles.", cta: "Visit Golden Glove", style: "dark" },
  { slug: "talent", href: "/talent", tag: "The team", name: "Benchmark Talent", line: "Mid-senior and specialist hiring for scale-ups and capability centres.", cta: "Visit Benchmark Talent", style: "sand" },
  { slug: "exh1b", href: "/exh1b", tag: "Coming home", name: "ExH1B", line: "Careers in India for professionals returning from abroad, and India employment for their current employers.", cta: "Visit ExH1B", style: "burgundy" },
  { slug: "trustcircle", href: "/trustcircle", tag: "The next chapter", name: "TrustCircle Outplacements", line: "Career transition for leaders and teams going through restructuring or change.", cta: "Visit TrustCircle", style: "sand" },
  { slug: "advisory", href: "/advisory", tag: "Before the hire", name: "Benchmark Advisory", line: "People strategy, succession, policies and compliance, on retainer or as a project.", cta: "Visit Advisory", style: "sand" },
] as const;

const TESTIMONIALS = [
  { org: "Infinite Uptime", kind: "Specialist hiring", quote: "Three senior engineers in under a month, with technical screening the team could rely on.", who: "Rounak Bhinge", role: "Managing Director" },
  { org: "Securly", kind: "HR advisory", quote: "A full HR setup, from policies to payroll, that became an important part of the company's growth.", who: "Neeraj Thakar", role: "Co-founder" },
  { org: "CoReCo Technologies", kind: "Leadership hiring", quote: "Outstanding candidates who understood the company's culture and settled in well.", who: "Vijay Suryawanshi", role: "Co-founder" },
];

const PEOPLE = [
  { name: "Anand Joshi", role: "Founding member, executive search", where: "India" },
  { name: "Deepti Mutha", role: "Founding member, HR governance", where: "United Kingdom" },
  { name: "Sumita Sopariwala", role: "Executive adviser, employee relations", where: "Illinois, US" },
  { name: "Kalyan Sen", role: "Executive adviser, leadership development", where: "Delhi" },
];

function Icon({ kind, color }: { kind: string; color: string }) {
  const p = { width: 30, height: 30, viewBox: "0 0 30 30", fill: "none", stroke: color, strokeWidth: 1.6, "aria-hidden": true } as const;
  if (kind === "golden-glove")
    return (
      <svg {...p}>
        <circle cx="15" cy="15" r="12" />
        <circle cx="15" cy="15" r="6.5" />
        <circle cx="15" cy="15" r="1.6" fill={color} />
      </svg>
    );
  if (kind === "talent")
    return (
      <svg {...p}>
        <circle cx="9" cy="10" r="3.5" />
        <circle cx="21" cy="10" r="3.5" />
        <circle cx="15" cy="17" r="3.5" />
        <path d="M3 26c.8-3.5 3-5.5 6-5.5M27 26c-.8-3.5-3-5.5-6-5.5M9 28c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
      </svg>
    );
  if (kind === "exh1b")
    return (
      <svg {...p}>
        <path d="M4 22 C 9 6, 21 6, 26 16" strokeDasharray="2 3" />
        <circle cx="4" cy="22" r="2.4" fill={color} />
        <path d="M23 12l3 4-4.6 1" />
      </svg>
    );
  if (kind === "trustcircle")
    return (
      <svg {...p}>
        <circle cx="12" cy="15" r="8" />
        <circle cx="18" cy="15" r="8" />
      </svg>
    );
  return (
    <svg {...p}>
      <rect x="6" y="4" width="18" height="22" rx="2" />
      <path d="M10 10h10M10 15h10M10 20h6" />
    </svg>
  );
}

export default function GroupHome() {
  return (
    <>
      {/* HERO */}
      <section className="bg-[#142841] pb-16 text-[#f3eee6]">
        <GroupHeader />
        <div id="top" className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-14 px-5 pt-14 sm:px-8 sm:pt-16">
          <div className="min-w-0 flex-[1_1_520px]">
            <p className="rise m-0 mb-5 text-[15px] font-bold text-[#b3c0cf]">Executive search and HR advisory, Pune, since 2013</p>
            <h1 className="rise rise-2 m-0 font-display text-[clamp(46px,6.3vw,90px)] font-normal leading-[1.04] tracking-[-.015em]">
              Find the leader.
              <br />
              Build <ShortlistPill /> the team.
            </h1>
            <p className="rise rise-3 mt-7 max-w-[520px] text-[19px] leading-relaxed text-[#c9d2dc]">
              Executive search, team hiring, returnee careers, outplacement and HR advisory for founder-led businesses that take their people seriously.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <Link href="#contact" className="inline-flex min-h-12 items-center rounded-full bg-[#e5ded2] px-6 text-base font-bold text-[#142841] no-underline">
                Start a conversation
              </Link>
              <Link href="#process" className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-[#f3eee666] px-5 text-base font-bold no-underline">
                See how we work
              </Link>
            </div>
            <dl className="m-0 mt-12 flex flex-wrap gap-x-11 gap-y-5">
              {[
                ["12+", "years in practice"],
                ["90+", "organisations served"],
                ["5", "specialist businesses"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-[40px] leading-none">{n}</dt>
                  <dd className="m-0 mt-1.5 text-sm text-[#b3c0cf]">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* collage: what the work looks like */}
          <div className="relative flex min-w-0 flex-[1_1_440px] items-start gap-4" aria-label="Examples of Benchmark's work">
            <div className="flex flex-1 flex-col gap-4">
              <div className="rounded-[22px] bg-[#1d3555] p-5">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#b3c0cf]">Market map</p>
                <svg viewBox="0 0 220 120" className="mt-3 w-full" aria-hidden="true">
                  {Array.from({ length: 42 }).map((_, i) => {
                    const x = 14 + (i % 14) * 14.5;
                    const y = 18 + Math.floor(i / 14) * 34 + ((i * 7) % 11);
                    const hot = [5, 17, 30].includes(i);
                    return <circle key={i} cx={x} cy={y} r={hot ? 5.5 : 3.2} fill={hot ? "#e5ded2" : "#4b6382"} />;
                  })}
                </svg>
                <p className="m-0 mt-2 text-sm text-[#c9d2dc]">420 people mapped, 3 approached</p>
              </div>
              <div className="relative rounded-[22px] bg-[#e5ded2] p-5 text-[#142841]">
                <p className="m-0 font-display text-2xl leading-tight">Chief Technology Officer</p>
                <p className="m-0 mt-1 text-sm text-[#4a5970]">Private bank · Mumbai · confidential</p>
                <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#f6f2eb] px-3.5 py-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#490b1a]">
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" fill="none" stroke="#f3eee6" strokeWidth="2" />
                    </svg>
                  </span>
                  <span className="text-[13.5px] leading-snug">
                    <b className="block">Appointed in 11 weeks</b>
                    <span className="text-[#4a5970]">Illustrative search</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4 pt-12">
              <div className="rounded-[22px] bg-[#f3eee6] p-5 text-[#142841]">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-[#490b1a]">The shortlist</p>
                <ul className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
                  {[
                    ["Capability and fit", 92],
                    ["Leadership and behaviour", 88],
                    ["Working with stakeholders", 84],
                  ].map(([l, v]) => (
                    <li key={l as string} className="text-sm">
                      <span className="flex justify-between font-semibold">
                        {l}
                        <span>{v}</span>
                      </span>
                      <span className="mt-1 block h-1.5 rounded-full bg-[#ddd5c7]">
                        <span className="block h-full rounded-full bg-[#142841]" style={{ width: `${v}%` }} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[22px] border border-[#f3eee62e] p-5">
                <p className="m-0 font-display text-[22px] leading-snug">“A short, honest shortlist, with our view on each person.”</p>
                <p className="m-0 mt-3 text-sm text-[#b3c0cf]">How every Benchmark search ends</p>
              </div>
            </div>
          </div>
        </div>
        {/* CLIENTS WHO HAVE WORKED WITH US - HIGH-END EDITORIAL GRID */}
        <div id="clients" className="mx-auto mt-20 max-w-[1240px] border-t border-[#f3eee61f] px-5 pt-12 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-[.28em] text-[#d4b06a]">Trusted by industry leaders</p>
              <h2 className="m-0 mt-1.5 font-display text-2xl font-normal text-[#f3eee6] sm:text-3xl">
                Clients who have worked with us
              </h2>
            </div>
            <p className="m-0 text-sm text-[#b3c0cf]">
              Across deep tech, enterprise software, banking & global capability centres
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:gap-4">
            {CLIENTS.map((c, i) => (
              <a
                key={i}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`${c.name} — ${c.domain}`}
                className="group relative flex h-24 flex-col items-center justify-center rounded-xl border border-[#f3eee61a] bg-gradient-to-b from-[#1b3352]/70 to-[#142841]/90 px-4 py-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d4b06a]/60 hover:bg-[#1b3352] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.45)]"
              >
                <div className="relative flex h-10 w-full items-center justify-center opacity-85 transition-opacity duration-300 group-hover:opacity-100">
                  <Image
                    src="/uelement-logo.png"
                    alt={c.name}
                    width={140}
                    height={32}
                    className="max-h-8 w-auto object-contain filter brightness-110 contrast-105"
                  />
                </div>
                <span className="mt-2 text-[10.5px] font-medium tracking-wide text-[#b3c0cf] opacity-75 transition-colors group-hover:text-[#f3eee6] group-hover:opacity-100">
                  {c.domain}
                </span>
                <span className="absolute right-2 top-2 text-[10px] text-[#d4b06a] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* PROPER GLOBAL PLACES MAP (Adapted from Codepen with pulse pins & dark luxury styling) */}
      <GlobalPlacesMap />

      {/* BUSINESSES */}
      <section id="businesses" className="px-5 py-24 sm:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap gap-12">
          <div className="min-w-0 flex-[1_1_320px]">
            <h2 className="m-0 font-display text-[clamp(36px,3.6vw,52px)] font-normal leading-[1.08]">One group for every people decision.</h2>
            <p className="mb-8 mt-5 text-lg leading-relaxed text-muted">A company&apos;s growth and a leader&apos;s career run through the same few moments. We built a specialist business for each one, sharing one network, one standard of care and one platform.</p>
            <Link href="#contact" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-bold text-primary-ink no-underline">
              Talk to us
            </Link>
          </div>
          <BusinessesGrid businesses={BUSINESSES} />
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="bg-card px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 max-w-2xl font-display text-[clamp(34px,3.4vw,50px)] font-normal leading-[1.08]">A process that starts with a conversation.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">We talk about fees and timelines only once we understand what you need, and we tell you plainly if we are not the right fit.</p>
          <ol className="m-0 mt-12 grid list-none gap-5 p-0 md:grid-cols-3">
            {[
              ["Understand", "A first conversation about your situation: the critical hire, the people challenge or the compliance gap. We listen; we are not selling."],
              ["Advise", "How we could help, whether we are a good fit, the approach we recommend, and our view on time and fees. No ambiguity, no hidden layers."],
              ["Engage", "We agree scope, timeline and fees, and a senior member of our team leads the work from start to finish."],
            ].map(([t, d], i) => (
              <li key={t} className="flex flex-col gap-3 rounded-[22px] bg-bg p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-ink">{i + 1}</span>
                <h3 className="m-0 font-display text-[28px] font-normal">{t}</h3>
                <p className="m-0 leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="text-[15px] font-bold">How we judge a candidate:</span>
            {["Capability and fit for the role", "Leadership and behaviour", "Working with stakeholders"].map((c) => (
              <span key={c} className="rounded-full bg-bg px-4 py-2 text-sm font-semibold">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section className="px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-[13px] font-bold uppercase tracking-[.12em] text-accent">One platform</span>
            <h2 className="m-0 mt-3 font-display text-[clamp(32px,3.2vw,46px)] font-normal leading-[1.1]">Every business shares one record of the people and companies we work with.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              A professional who returns home through ExH1B, joins a client through Benchmark Talent and is later shortlisted by Golden Glove has one history with us, not five. Our assistant, Jev, keeps that record current and helps our team find the right people faster, with a person approving every outreach.
            </p>
            <ul className="m-0 mt-6 grid list-none gap-3 p-0 text-[15px] sm:grid-cols-2">
              {["One profile per person, shared only with consent", "Brand-level privacy for confidential searches", "Matches explained, never a black box", "Your data handled under India's DPDP Act and GDPR"].map((x) => (
                <li key={x} className="flex gap-2.5">
                  <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="One professional's journey across the group">
            {[
              ["ExH1B", "Returns from the US. Profile, CV and preferences captured once."],
              ["Benchmark Talent", "Joins a capability centre in Pune. The placement lands on the same record."],
              ["Golden Glove", "Years later, shortlisted for a CTO search, with the full history known."],
              ["TrustCircle", "If a role ends, transition support starts from full context."],
              ["Client", "Now a hiring leader, the same person briefs us on their own team."],
            ].map(([b, d], i) => (
              <li key={b} className="flex items-start gap-4 rounded-[22px] bg-card p-5">
                <span className="font-display text-3xl leading-none text-[#c9bfae]">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <b className="block font-display text-xl font-normal">{b}</b>
                  <span className="text-[15px] text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CLIENTS */}
      <section id="clients" className="bg-card px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 font-display text-[clamp(34px,3.4vw,50px)] font-normal leading-[1.08]">What founders got from working with us.</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">Judged by whether the work moved the business forward, not by how many placements we made.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.org} className="m-0 flex flex-col gap-4 rounded-[22px] bg-bg p-7">
                <span className="text-[13px] font-bold text-accent">
                  {t.org} · {t.kind}
                </span>
                <blockquote className="m-0 font-display text-[22px] leading-snug">{t.quote}</blockquote>
                <figcaption className="mt-auto text-sm">
                  <b>{t.who}</b>
                  <span className="block text-muted">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PEOPLE */}
      <section id="people" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="m-0 font-display text-[clamp(34px,3.4vw,50px)] font-normal leading-[1.08]">The people you will work with.</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PEOPLE.map((p) => (
              <article key={p.name} className="flex flex-col gap-3">
                <div className="relative flex aspect-[4/5] items-end overflow-hidden rounded-[22px] bg-[#2a3f5c] p-5" style={{ backgroundImage: "repeating-linear-gradient(135deg,rgba(229,222,210,.07) 0 2px,transparent 2px 14px)" }}>
                  <span className="font-display text-6xl text-[#e5ded2]">
                    {p.name
                      .split(" ")
                      .map((x) => x[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <h3 className="m-0 font-display text-xl font-normal">{p.name}</h3>
                  <p className="m-0 text-sm text-muted">
                    {p.role}. {p.where}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="bg-[#490b1a] px-5 py-24 text-[#f3eee6] sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="m-0 font-display text-[clamp(36px,3.8vw,56px)] font-normal leading-[1.06]">Ready to talk about your people?</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#ead2d6]">A first conversation costs nothing and commits you to nothing. We reply within one business day.</p>
            <dl className="m-0 mt-10 grid gap-5 text-[15px]">
              <div>
                <dt className="font-bold text-[#dcb6be]">Email</dt>
                <dd className="m-0">
                  <a href="mailto:contact@benchmarkhr.in">contact@benchmarkhr.in</a>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#dcb6be]">Phone and WhatsApp</dt>
                <dd className="m-0">
                  <a href="tel:+918888400044">+91 88884 00044</a>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#dcb6be]">Based in</dt>
                <dd className="m-0">Pune, India</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-[22px] bg-bg p-7 text-ink">
            <h3 className="m-0 mb-5 font-display text-2xl font-normal">Start a conversation</h3>
            <ContactForm />
          </div>
        </div>
      </section>
      <GroupFooter />
    </>
  );
}
