import Link from "next/link";
import { and, asc, eq, like, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { BrandChip, PageHead } from "@/components/console";
import { money } from "@/lib/time";

export const metadata = { title: "Organisations" };

export default async function Orgs({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const ctx = await consoleCtx();
  const scoped = ctx.isGroup && !ctx.pickedId ? undefined : sql`exists (select 1 from org_brands ob where ob.org_id = ${s.organisations.id} and ob.brand_id = ${ctx.pickedId ?? -1})`;
  const orgs = db.select().from(s.organisations).where(and(scoped, q ? like(s.organisations.name, `%${q}%`) : undefined)).orderBy(asc(s.organisations.name)).all();
  const ob = db.select().from(s.orgBrands).all();
  const mand = db.select({ org: s.mandates.orgId, n: sql<number>`count(*)` }).from(s.mandates).where(eq(s.mandates.status, "open")).groupBy(s.mandates.orgId).all();
  const fees = db.select({ org: s.invoices.orgId, t: sql<number>`sum(case when ${s.invoices.status} = 'paid' then ${s.invoices.amount} else 0 end)` }).from(s.invoices).groupBy(s.invoices.orgId).all();
  return (
    <>
      <PageHead
        title="Organisations"
        sub="Clients, employers, EOR employers and prospects. One record per company, shared by every business."
        actions={
          <form>
            <input name="q" defaultValue={q} placeholder="Search companies" className="field !min-h-10 !py-2 text-sm" aria-label="Search organisations" />
          </form>
        }
      />
      <div className="scroll-x rounded-card border border-line bg-card">
        <table className="data">
          <thead>
            <tr>
              <th>Organisation</th>
              <th>Industry</th>
              <th>Relationships</th>
              <th>Open mandates</th>
              <th>Fees paid</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/console/organisations/${o.id}`} className="font-bold no-underline hover:underline">
                    {o.name}
                  </Link>
                  <span className="block text-xs text-muted">
                    {o.city} · {o.sizeBand}
                  </span>
                </td>
                <td>{o.industry}</td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    {ob
                      .filter((x) => x.orgId === o.id)
                      .map((x) => (
                        <BrandChip key={x.brandId + x.relationship} slug={ctx.byId[x.brandId].slug} name={`${ctx.byId[x.brandId].shortName} · ${x.relationship.replace("_", " ")}`} />
                      ))}
                  </span>
                </td>
                <td className="tabular-nums">{mand.find((m) => m.org === o.id)?.n ?? 0}</td>
                <td className="tabular-nums">{money(fees.find((f) => f.org === o.id)?.t ?? 0, "INR", true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
