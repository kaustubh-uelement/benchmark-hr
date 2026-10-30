import Link from "next/link";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { TalentFooter, TalentHeader } from "@/components/talent";
import { money, relTime } from "@/lib/time";
import { WORK_MODES } from "@/lib/content/taxonomy";

export const metadata = { title: "Open roles" };

export default async function Jobs({ searchParams }: { searchParams: Promise<{ q?: string; family?: string; city?: string; mode?: string }> }) {
  const { q = "", family = "", city = "", mode = "" } = await searchParams;
  const tal = db.select().from(s.brands).where(eq(s.brands.slug, "talent")).get()!;
  const all = db
    .select({ m: s.mandates, org: s.organisations.name, fam: s.jobFamilies })
    .from(s.mandates)
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .leftJoin(s.jobFamilies, eq(s.jobFamilies.id, s.mandates.familyId))
    .where(and(eq(s.mandates.brandId, tal.id), eq(s.mandates.status, "open"), q ? or(like(s.mandates.title, `%${q}%`), like(s.mandates.description, `%${q}%`), like(s.organisations.name, `%${q}%`)) : undefined))
    .orderBy(desc(s.mandates.openedAt))
    .all();
  const fams = [...new Map(all.filter((r) => r.fam).map((r) => [r.fam!.slug, r.fam!.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const cities = [...new Set(all.map((r) => r.m.locationLabel?.split(",")[0]).filter(Boolean))].sort() as string[];
  const rows = all.filter((r) => (!family || r.fam?.slug === family) && (!city || r.m.locationLabel?.startsWith(city)) && (!mode || r.m.workMode === mode));
  void asc;
  return (
    <>
      <TalentHeader />
      <section className="border-b border-line bg-card-2 px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <h1 className="m-0 font-display text-[clamp(40px,5vw,64px)] font-bold tracking-tight">Open roles</h1>
          <p className="mt-2 text-lg text-muted">{rows.length} roles with scale-ups and capability centres across India. Every post shows its salary band.</p>
          <form className="mt-7 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
            <input name="q" defaultValue={q} placeholder="Title, skill or company" className="field" aria-label="Search" />
            <select name="family" defaultValue={family} className="field" aria-label="Function">
              <option value="">All functions</option>
              {fams.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
            <select name="city" defaultValue={city} className="field" aria-label="City">
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select name="mode" defaultValue={mode} className="field" aria-label="Work mode">
              <option value="">Any work mode</option>
              {WORK_MODES.filter((w) => w !== "Either").map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
            <button className="min-h-11 rounded-btn bg-ink px-6 font-bold text-white">Search</button>
          </form>
        </div>
      </section>
      <section className="px-5 py-10 sm:px-8">
        <ul className="mx-auto m-0 flex max-w-[1240px] list-none flex-col gap-3 p-0">
          {rows.map(({ m, org, fam }) => (
            <li key={m.id}>
              <Link href={`/talent/jobs/${m.id}`} className="grid gap-3 rounded-card border border-line bg-card-2 p-5 no-underline transition hover:border-accent md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center">
                <span>
                  <b className="block font-display text-xl">{m.title}</b>
                  <span className="text-sm text-muted">
                    {org} · {fam?.name}
                  </span>
                </span>
                <span className="text-sm">
                  {m.locationLabel?.split(",")[0]} · {m.workMode}
                  {m.openings > 1 && <span className="ml-2 rounded-[4px] bg-[var(--lime)] px-1.5 py-0.5 text-xs font-bold text-ink">{m.openings} openings</span>}
                </span>
                <span className="text-sm font-semibold">
                  {money(m.salaryMin, "INR", true)}–{money(m.salaryMax, "INR", true)}
                </span>
                <span className="text-xs text-faint">{relTime(m.openedAt)}</span>
              </Link>
            </li>
          ))}
          {!rows.length && <li className="rounded-card border border-dashed border-line p-10 text-center text-muted">No roles match. Try clearing a filter.</li>}
        </ul>
      </section>
      <TalentFooter />
    </>
  );
}
