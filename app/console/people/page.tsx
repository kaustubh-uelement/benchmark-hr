import Link from "next/link";
import { and, desc, inArray, like, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { peopleCond } from "@/lib/access";
import { Avatar, Badge, Empty } from "@/components/ui";
import { BrandChip, PageHead, Tabs } from "@/components/console";
import { relTime } from "@/lib/time";

export const metadata = { title: "People" };
const PAGE = 50;

export default async function People({ searchParams }: { searchParams: Promise<{ q?: string; rel?: string; page?: string }> }) {
  const { q = "", rel = "all", page = "1" } = await searchParams;
  const ctx = await consoleCtx();
  const { u, pickedId, byId } = ctx;
  const conds = [peopleCond(u, pickedId)];
  if (q) conds.push(or(like(s.people.firstName, `%${q}%`), like(s.people.lastName, `%${q}%`), like(s.people.email, `%${q}%`), like(s.people.currentTitle, `%${q}%`), like(s.people.currentCompany, `%${q}%`), like(s.people.locationLabel, `%${q}%`), sql`(${s.people.firstName} || ' ' || ${s.people.lastName}) like ${`%${q}%`}`));
  if (rel !== "all") conds.push(sql`exists (select 1 from person_brands pb where pb.person_id = ${s.people.id} and pb.relationship = ${rel})`);
  const where = and(...conds);
  const total = db.select({ n: sql<number>`count(*)` }).from(s.people).where(where).get()!.n;
  const pg = Math.max(1, Number(page) || 1);
  const rows = db.select().from(s.people).where(where).orderBy(desc(s.people.updatedAt)).limit(PAGE).offset((pg - 1) * PAGE).all();
  const ids = rows.map((r) => r.id);
  const pb = ids.length ? db.select().from(s.personBrands).where(inArray(s.personBrands.personId, ids)).all() : [];
  const cons = ids.length ? db.select().from(s.consents).where(inArray(s.consents.personId, ids)).all() : [];
  const href = (o: Record<string, string>) => `/console/people?${new URLSearchParams({ q, rel, ...o }).toString()}`;

  return (
    <>
      <PageHead
        title="People"
        sub={`One golden record per person, across every business. ${total.toLocaleString("en-IN")} people you can see${ctx.picked ? ` in ${ctx.picked.shortName}` : ""}. Records from other businesses appear only where the person agreed to group sharing.`}
        actions={
          <form className="flex gap-2">
            <input type="hidden" name="rel" value={rel} />
            <input name="q" defaultValue={q} placeholder="Name, email, title, company, city" className="field !min-h-10 w-72 !py-2 text-sm" aria-label="Search people" />
          </form>
        }
      />
      <Tabs
        active={rel}
        items={[
          { key: "all", label: "Everyone", href: href({ rel: "all", page: "1" }) },
          { key: "member", label: "ExH1B members", href: href({ rel: "member", page: "1" }) },
          { key: "executive", label: "Executives", href: href({ rel: "executive", page: "1" }) },
          { key: "candidate", label: "Candidates", href: href({ rel: "candidate", page: "1" }) },
          { key: "participant", label: "Participants", href: href({ rel: "participant", page: "1" }) },
          { key: "client_contact", label: "Client contacts", href: href({ rel: "client_contact", page: "1" }) },
        ]}
      />
      {rows.length === 0 ? (
        <Empty title="Nobody found">Try a shorter search, or ask Jev in plain language from the bar above.</Empty>
      ) : (
        <div className="scroll-x rounded-card border border-line bg-card">
          <table className="data">
            <thead>
              <tr>
                <th>Person</th>
                <th>Now</th>
                <th>Location</th>
                <th>Businesses</th>
                <th>Consent</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const share = cons.find((c) => c.personId === p.id && c.purpose === "group_sharing");
                const ai = cons.find((c) => c.personId === p.id && c.purpose === "ai_matching");
                return (
                  <tr key={p.id}>
                    <td className="min-w-[220px]">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={`${p.firstName} ${p.lastName}`} size={32} />
                        <span className="min-w-0">
                          <Link href={`/console/people/${p.id}`} className="font-bold no-underline hover:underline">
                            {p.firstName} {p.lastName}
                          </Link>
                          <span className="block truncate text-xs text-muted">{p.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="min-w-[200px]">
                      {p.currentTitle ?? "—"}
                      <span className="block text-xs text-muted">
                        {p.currentCompany ?? ""}
                        {p.yearsExperience != null ? ` · ${Math.round(p.yearsExperience)} yrs` : ""}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{p.locationLabel ?? "—"}</td>
                    <td>
                      <span className="flex flex-wrap gap-1">
                        {[...new Set(pb.filter((x) => x.personId === p.id).map((x) => x.brandId))].map((b) => (
                          <BrandChip key={b} slug={byId[b].slug} name={byId[b].shortName} />
                        ))}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <Badge tone={share?.granted ? "good" : "neutral"}>{share?.granted ? "Group" : "Brand only"}</Badge> {ai && !ai.granted && <Badge tone="warn">No AI</Badge>}
                    </td>
                    <td className="whitespace-nowrap text-xs text-muted">{relTime(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {total > PAGE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">
            {(pg - 1) * PAGE + 1}–{Math.min(total, pg * PAGE)} of {total}
          </span>
          <span className="flex gap-2">
            {pg > 1 && (
              <Link href={href({ page: String(pg - 1) })} className="rounded-btn border border-line px-3 py-1.5 font-bold no-underline">
                Previous
              </Link>
            )}
            {pg * PAGE < total && (
              <Link href={href({ page: String(pg + 1) })} className="rounded-btn border border-line px-3 py-1.5 font-bold no-underline">
                Next
              </Link>
            )}
          </span>
        </div>
      )}
    </>
  );
}
