import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { ask } from "@/lib/jev/engine";
import { Avatar, Badge, JevMark } from "@/components/ui";
import { BrandChip, PageHead, Panel } from "@/components/console";

export const metadata = { title: "Ask Jev" };

const EXAMPLES = [
  "CFOs in Pune with 15+ years",
  "Senior data engineers returning from the US who want Bengaluru",
  "Leaders open to EOR with their current employer",
  "Cybersecurity people with ISO 27001",
  "Product leaders in Mumbai",
  "TrustCircle participants in operations",
];

export default async function Ask({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const ctx = await consoleCtx();
  const res = q.trim() ? await ask(q.trim(), ctx.u) : null;
  const ids = res?.rows.map((r) => r.id) ?? [];
  const pb = ids.length ? db.select().from(s.personBrands).where(inArray(s.personBrands.personId, ids)).all() : [];
  const fams = Object.fromEntries(db.select().from(s.jobFamilies).all().map((f) => [f.slug, f.name]));
  void eq;
  const chips = res
    ? [
        ...(res.filter.families ?? []).map((f) => `Family: ${fams[f] ?? f}`),
        ...(res.filter.seniority ?? []).map((x) => `Level: ${x}`),
        ...(res.filter.cities ?? []).map((x) => `City: ${x}`),
        ...(res.filter.countries ?? []).map((x) => `Lives in: ${x}`),
        ...(res.filter.skills ?? []).map((x) => `Skill: ${x}`),
        ...(res.filter.minYears ? [`${res.filter.minYears}+ years`] : []),
        ...(res.filter.openToEor ? ["Open to EOR"] : []),
        ...(res.filter.returnees ? ["Returnee (ExH1B)"] : []),
        ...(res.filter.brands ?? []).map((x) => `Business: ${x}`),
      ]
    : [];
  return (
    <>
      <PageHead
        title={
          <span className="flex items-center gap-3">
            Ask Jev <JevMark engine={res?.engine} />
          </span>
        }
        sub="Search the whole group database in plain language. Results respect your access: other businesses' people appear only if they agreed to group sharing."
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} className="field min-w-0 flex-1 !rounded-full !text-base" placeholder="Who are you looking for?" aria-label="Question for Jev" autoFocus />
        <button type="submit" className="min-h-11 rounded-full bg-accent px-6 font-bold text-accent-ink">
          Ask
        </button>
      </form>
      <div className="mb-6 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <Link key={e} href={`/console/jev/ask?q=${encodeURIComponent(e)}`} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold no-underline hover:border-accent">
            {e}
          </Link>
        ))}
      </div>
      {res && (
        <Panel
          title={`${res.total} ${res.total === 1 ? "person" : "people"}`}
          action={
            <span className="flex flex-wrap justify-end gap-1.5">
              {chips.length ? chips.map((c) => <Badge key={c} tone="accent">{c}</Badge>) : <Badge>No filters understood; showing everyone you can see</Badge>}
            </span>
          }
          pad={false}
        >
          <ul className="m-0 grid list-none gap-0 p-0 md:grid-cols-2">
            {res.rows.map((p) => (
              <li key={p.id} className="border-b border-line md:odd:border-r">
                <Link href={`/console/people/${p.id}`} className="flex items-start gap-3 px-5 py-4 no-underline hover:bg-bg-2">
                  <Avatar name={`${p.firstName} ${p.lastName}`} size={38} />
                  <span className="min-w-0">
                    <b className="block">
                      {p.firstName} {p.lastName}
                    </b>
                    <span className="block text-sm text-muted">
                      {[p.currentTitle, p.currentCompany].filter(Boolean).join(", ")}
                    </span>
                    <span className="block text-xs text-faint">
                      {p.locationLabel} · {p.yearsExperience != null ? `${Math.round(p.yearsExperience)} yrs` : ""} · {p.seniority}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {[...new Set(pb.filter((x) => x.personId === p.id).map((x) => x.brandId))].map((b) => (
                        <BrandChip key={b} slug={ctx.byId[b].slug} name={ctx.byId[b].shortName} />
                      ))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {res.total > res.rows.length && <p className="m-0 px-5 py-3 text-sm text-muted">Showing the first {res.rows.length}. Add a city, level or skill to narrow it down.</p>}
        </Panel>
      )}
    </>
  );
}
