import Link from "next/link";
import { notFound } from "next/navigation";
import { GroupHeader, GroupFooter, ContactForm } from "@/components/group";
import { brandBySlug } from "@/lib/content/brands";

const DETAIL: Record<string, { for: string[]; what: string[]; how: string[] }> = {
  "golden-glove": {
    for: ["Boards and founders appointing a CEO or CXO", "Investors placing leaders into portfolio companies", "Companies hiring rare specialists"],
    what: ["Retained, partner-led search from brief to joining", "Full market mapping, including people who are not looking", "Assessment of capability, leadership behaviour and stakeholder fit", "Check-ins through the leader's first months"],
    how: ["Brief", "Map", "Approach", "Assess", "Shortlist", "Appoint", "Settle in"],
  },
  talent: {
    for: ["Scale-ups building their second and third layer", "Global capability centres hiring in India", "Teams that need specialists quickly"],
    what: ["Mid-senior and specialist hiring, one role or a whole team", "Technical screening your team can rely on", "A shared pipeline you can follow live", "Candidates from across the group's network, with consent"],
    how: ["Brief", "Source", "Screen", "Shortlist", "Interview", "Offer"],
  },
  exh1b: {
    for: ["Indian professionals abroad planning to return", "Employers who want to keep a returning employee", "Families planning a move home"],
    what: ["Personalised job discovery with explained matches", "Employer of Record so you can keep your current employer from India", "Relocation Hub: checklists for your country, cost of living, visas and tax residency", "A community of people who have made the move"],
    how: ["Create your profile", "See matched roles", "Plan your move", "Land and settle"],
  },
  trustcircle: {
    for: ["Companies going through restructuring", "Leaders whose roles have ended", "HR teams who want to treat departing people well"],
    what: ["One-to-one transition coaching", "CV, story and LinkedIn refresh", "Introductions to openings across the group", "Progress reporting for the sponsoring company"],
    how: ["Kick-off", "Story", "Market approach", "Interviews", "Offer"],
  },
  advisory: {
    for: ["Founders setting up HR for the first time", "Boards planning succession", "Companies preparing for audits or the new labour codes"],
    what: ["People strategy and organisation design", "Policies, handbooks and POSH compliance", "Compensation benchmarking and pay bands", "Retained HR advice from a senior adviser"],
    how: ["Discovery", "Assessment", "Recommendations", "Implementation", "Read-out"],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const b = brandBySlug((await params).slug);
  return { title: b?.name ?? "Business" };
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = brandBySlug(slug);
  const d = DETAIL[slug];
  if (!b || !d) notFound();
  const golden = slug === "golden-glove";
  return (
    <>
      <section className={golden ? "bg-[#0b1828] text-[#f3eee6]" : "bg-[#142841] text-[#f3eee6]"}>
        <GroupHeader />
        <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-14 sm:px-8">
          <p className={`m-0 text-sm font-bold ${golden ? "text-[#d4b06a]" : "text-[#b3c0cf]"}`}>Benchmark HR Group · {b.tagline}</p>
          <h1 className="m-0 mt-4 max-w-3xl font-display text-[clamp(40px,5.4vw,76px)] font-normal leading-[1.04]">{b.name}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-[#c9d2dc]">{b.description}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={b.base} className={`inline-flex min-h-12 items-center rounded-full px-6 font-bold no-underline ${golden ? "bg-[#d4b06a] text-[#0b1828]" : "bg-[#e5ded2] text-[#142841]"}`}>
              Go to {b.shortName}
            </Link>
            <Link href="#contact" className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-[#f3eee666] px-5 font-bold no-underline">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-6 md:grid-cols-2">
          <div className="rounded-[22px] bg-card p-8">
            <h2 className="m-0 font-display text-3xl font-normal">Who it is for</h2>
            <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0 text-[17px]">
              {d.for.map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-accent" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[22px] bg-primary p-8 text-primary-ink">
            <h2 className="m-0 font-display text-3xl font-normal">What you get</h2>
            <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0 text-[17px]">
              {d.what.map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 flex-none rounded-full bg-[#e5ded2]" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-[1240px]">
          <h2 className="m-0 font-display text-3xl font-normal">How it runs</h2>
          <ol className="m-0 mt-6 flex list-none flex-wrap gap-3 p-0">
            {d.how.map((h, i) => (
              <li key={h} className="flex items-center gap-3 rounded-full bg-card py-2 pl-2 pr-5 font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm text-primary-ink">{i + 1}</span>
                {h}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="contact" className="bg-[#490b1a] px-5 py-20 text-[#f3eee6] sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-2">
          <h2 className="m-0 font-display text-[clamp(32px,3.4vw,50px)] font-normal leading-[1.08]">Tell us what you need from {b.shortName}.</h2>
          <div className="rounded-[22px] bg-bg p-7 text-ink">
            <ContactForm defaultInterest={slug} />
          </div>
        </div>
      </section>
      <GroupFooter />
    </>
  );
}
