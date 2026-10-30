import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { TalentFooter, TalentHeader } from "@/components/talent";
import { ActionForm, SubmitButton } from "@/components/client";
import { applyToRole } from "@/app/actions/portal";
import { NOTICE_PERIODS } from "@/lib/content/taxonomy";
import { money, relTime } from "@/lib/time";

export const metadata = { title: "Role" };

export default async function Job({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const tal = db.select().from(s.brands).where(eq(s.brands.slug, "talent")).get()!;
  const r = db
    .select({ m: s.mandates, org: s.organisations, fam: s.jobFamilies.name })
    .from(s.mandates)
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .leftJoin(s.jobFamilies, eq(s.jobFamilies.id, s.mandates.familyId))
    .where(and(eq(s.mandates.id, id), eq(s.mandates.brandId, tal.id)))
    .get();
  if (!r) notFound();
  const { m, org, fam } = r;
  const open = m.status === "open";
  return (
    <>
      <TalentHeader />
      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
        <Link href="/talent/jobs" className="text-sm font-bold text-accent">
          ← All roles
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <article>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">{fam}</span>
            <h1 className="m-0 mt-2 font-display text-[clamp(36px,4.6vw,58px)] font-bold leading-[1.02] tracking-tight">{m.title}</h1>
            <p className="m-0 mt-3 text-lg text-muted">
              {org?.name} · {m.locationLabel} · {m.workMode} · posted {relTime(m.openedAt)}
            </p>
            <dl className="m-0 mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Salary", `${money(m.salaryMin, "INR", true)}–${money(m.salaryMax, "INR", true)}`],
                ["Experience", m.minYears ? `${m.minYears}+ years` : "Open"],
                ["Level", m.seniority],
                ["Openings", String(m.openings)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-card border border-line bg-card p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-faint">{k}</dt>
                  <dd className="m-0 mt-1 font-display text-lg font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <h2 className="mb-2 mt-10 font-display text-2xl font-bold">The role</h2>
            <p className="m-0 text-[17px] leading-relaxed text-muted">{m.description}</p>
            <h2 className="mb-3 mt-8 font-display text-2xl font-bold">What you&apos;ll bring</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {m.skills.map((k) => (
                <li key={k} className="rounded-[6px] border border-line bg-card-2 px-3 py-1.5 text-sm font-semibold">
                  {k}
                </li>
              ))}
            </ul>
            {org && (
              <>
                <h2 className="mb-2 mt-8 font-display text-2xl font-bold">About {org.name}</h2>
                <p className="m-0 text-muted">
                  {org.industry} · {org.sizeBand} people · {org.companyType}. Based in {org.city}.
                </p>
              </>
            )}
          </article>
          <aside className="h-fit rounded-card border border-line bg-card-2 p-6 lg:sticky lg:top-6">
            <h2 className="m-0 font-display text-2xl font-bold">{open ? "Apply in two minutes" : "This role is closed"}</h2>
            {open ? (
              <>
                <p className="mb-5 mt-1 text-sm text-muted">A recruiter replies within three business days, whatever the outcome. Already with ExH1B or another Benchmark business? Use the same email and we&apos;ll link your profile.</p>
                <ActionForm action={applyToRole} className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="mandateId" value={m.id} />
                  <input name="firstName" className="field" placeholder="First name" aria-label="First name" required autoComplete="given-name" />
                  <input name="lastName" className="field" placeholder="Last name" aria-label="Last name" required autoComplete="family-name" />
                  <input name="email" type="email" className="field sm:col-span-2" placeholder="Email" aria-label="Email" required autoComplete="email" />
                  <input name="phone" className="field" placeholder="Phone" aria-label="Phone" autoComplete="tel" />
                  <select name="notice" className="field" aria-label="Notice period" defaultValue="">
                    <option value="">Notice period</option>
                    {NOTICE_PERIODS.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <input name="title" className="field" placeholder="Current title" aria-label="Current title" />
                  <input name="company" className="field" placeholder="Current company" aria-label="Current company" />
                  <input name="linkedin" className="field sm:col-span-2" placeholder="LinkedIn URL" aria-label="LinkedIn URL" />
                  <label className="flex flex-col gap-1.5 text-sm font-semibold sm:col-span-2">
                    CV (PDF, DOCX or TXT, up to 5 MB)
                    <input name="resume" type="file" accept=".pdf,.docx,.txt" className="field !py-2 text-sm" />
                  </label>
                  <textarea name="note" rows={3} className="field sm:col-span-2" placeholder="Why this role? (optional)" aria-label="Why this role" />
                  <label className="flex items-start gap-2 text-sm text-muted sm:col-span-2">
                    <input type="checkbox" name="share" className="mt-1 h-4 w-4" defaultChecked />
                    Consider me for other roles across Benchmark HR Group
                  </label>
                  <div className="sm:col-span-2">
                    <SubmitButton variant="accent" className="w-full" pendingText="Submitting, Jev is reading your CV…">
                      Submit application
                    </SubmitButton>
                  </div>
                </ActionForm>
              </>
            ) : (
              <p className="text-muted">
                <Link href="/talent/jobs">See open roles</Link>
              </p>
            )}
          </aside>
        </div>
      </div>
      <TalentFooter />
    </>
  );
}
