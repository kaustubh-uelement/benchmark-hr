import { AdvFooter, AdvHeader } from "@/components/advisory";
import { ActionForm, SubmitButton } from "@/components/client";
import { submitLead } from "@/app/actions/leads";

export const metadata = { title: { absolute: "Benchmark Advisory — Before the hire" } };

const PRACTICE = [
  ["People strategy & organisation design", "The structure, roles and spans your next stage of growth needs, and the order to hire them in."],
  ["Policies, handbooks & POSH", "A complete, plain-language policy set, an Internal Committee that works, and training people remember."],
  ["Labour codes compliance", "A clause-by-clause review against the four labour codes and your state's rules, with a prioritised fix list."],
  ["Compensation & pay bands", "Benchmarked bands, a promotion framework and an ESOP narrative your team can understand."],
  ["Succession planning", "Critical roles mapped, successors assessed, and a plan the board reviews every year."],
  ["Retained HR counsel", "A senior adviser on call for the hard conversations: exits, investigations, restructurings."],
];

const NOTES = [
  ["Labour codes", "What the four labour codes change for a 200-person company", "Wage definitions, fixed-term employment and gratuity: the three changes that move costs, and what to do first."],
  ["Succession", "The two-page succession plan a board will actually read", "Ready-now, ready-later and emergency cover for every critical role, without a 40-slide deck."],
  ["Compensation", "Pay bands before your Series B, not after", "Why the cost of fixing pay inequity triples once you pass 150 people, and a simple way to start."],
];

export default function Advisory() {
  return (
    <>
      <AdvHeader />
      <section className="border-b border-line px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="rise m-0 text-[13px] font-semibold uppercase tracking-[.22em] text-accent">Benchmark Advisory</p>
            <h1 className="rise rise-2 m-0 mt-6 font-display text-[clamp(52px,7vw,100px)] font-normal leading-[.98] tracking-[-.02em]">
              Before <em>the hire</em>, the structure.
            </h1>
            <p className="rise rise-3 mt-8 max-w-xl text-xl leading-relaxed text-muted">People strategy, succession, policies and labour-law compliance for founder-led Indian companies, from a senior adviser who has sat in the CHRO&apos;s chair.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#engage" className="inline-flex min-h-12 items-center rounded-btn bg-primary px-6 font-semibold text-primary-ink no-underline">
                Book a 30-minute diagnostic
              </a>
              <a href="#practice" className="inline-flex min-h-12 items-center rounded-btn border border-ink px-6 font-semibold no-underline">
                See the practice
              </a>
            </div>
          </div>
          <aside className="rise rise-3 self-end border-l-2 border-accent pl-6">
            <p className="m-0 font-display text-[26px] italic leading-snug">“Most people problems in a growing company are structure problems that arrived early.”</p>
            <p className="m-0 mt-4 text-sm text-muted">The premise behind every Advisory engagement</p>
            <dl className="m-0 mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6">
              {[
                ["4", "labour codes covered in every compliance review"],
                ["30 min", "free diagnostic, no obligation"],
              ].map(([n, l]) => (
                <div key={l}>
                  <dt className="font-display text-4xl">{n}</dt>
                  <dd className="m-0 mt-1 text-sm text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </section>

      <section id="practice" className="scroll-mt-6 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
            <h2 className="m-0 font-display text-[44px] font-normal">The practice</h2>
            <span className="text-sm text-muted">Six areas · one senior adviser per client</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3">
            {PRACTICE.map(([t, d], i) => (
              <article key={t} className="flex flex-col gap-3 border-b border-line py-8 md:pr-8">
                <span className="font-display text-sm italic text-accent">§ {i + 1}</span>
                <h3 className="m-0 font-display text-[26px] font-medium leading-tight">{t}</h3>
                <p className="m-0 leading-relaxed text-muted">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="models" className="scroll-mt-6 bg-primary px-5 py-20 text-primary-ink sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 className="m-0 font-display text-[44px] font-normal leading-[1.05]">Two ways to work with us</h2>
          <div className="grid gap-px bg-white/15 sm:grid-cols-2">
            {[
              ["Project", "A defined piece of work with a fixed fee and a read-out: an HR set-up, a compliance review, pay bands or a succession plan.", ["Fixed fee, agreed up front", "Milestones you can follow in the client portal", "Typically 4 to 10 weeks"]],
              ["Retainer", "A senior adviser on call every month for policy questions, difficult cases and leadership decisions.", ["Monthly fee, cancel with 30 days' notice", "Same-day response on urgent matters", "Quarterly people review with leadership"]],
            ].map(([t, d, pts]) => (
              <article key={t as string} className="flex flex-col gap-4 bg-primary p-8">
                <h3 className="m-0 font-display text-3xl font-normal">{t as string}</h3>
                <p className="m-0 leading-relaxed text-white/80">{d as string}</p>
                <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0 text-sm">
                  {(pts as string[]).map((x) => (
                    <li key={x} className="border-t border-white/15 pt-2">
                      {x}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="notes" className="scroll-mt-6 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
            <h2 className="m-0 font-display text-[44px] font-normal">Notes from the practice</h2>
            <span className="text-sm text-muted">Short, practical, India-specific</span>
          </div>
          <div className="grid gap-10 pt-8 md:grid-cols-3">
            {NOTES.map(([k, t, d]) => (
              <article key={t} className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-[.2em] text-accent">{k}</span>
                <h3 className="m-0 font-display text-[26px] font-medium leading-tight">{t}</h3>
                <p className="m-0 leading-relaxed text-muted">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="engage" className="scroll-mt-6 border-t border-line bg-bg-2 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="m-0 font-display text-[44px] font-normal leading-[1.05]">Book a diagnostic</h2>
            <p className="mt-4 max-w-md text-lg text-muted">Thirty minutes with a principal. You leave with a short written note on what we&apos;d look at first, whether or not you engage us.</p>
          </div>
          <div className="border border-line bg-card p-7">
            <ActionForm action={submitLead} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="brand" value="advisory" />
              <input type="hidden" name="kind" value="advisory" />
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Name
                <input name="name" className="field" required />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Work email
                <input name="email" type="email" className="field" required />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Company
                <input name="company" className="field" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Team size
                <input name="role" className="field" placeholder="e.g. 140 people" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
                What prompted this?
                <textarea name="message" rows={4} className="field" placeholder="An audit, a difficult case, a fundraise, a new leader…" />
              </label>
              <div className="sm:col-span-2">
                <SubmitButton pendingText="Sending…">Request a diagnostic</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      </section>
      <AdvFooter />
    </>
  );
}
