import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { Avatar, Badge } from "@/components/ui";
import { BrandChip, KV, PageHead, Panel } from "@/components/console";
import { fmtDate, money } from "@/lib/time";

export const metadata = { title: "Organisation" };

export default async function Org({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const ctx = await consoleCtx();
  const o = db.select().from(s.organisations).where(eq(s.organisations.id, id)).get();
  if (!o) notFound();
  const rel = db.select().from(s.orgBrands).where(eq(s.orgBrands.orgId, id)).all();
  if (!ctx.isGroup && !rel.some((r) => r.brandId === ctx.pickedId)) notFound();
  const contacts = db.select({ c: s.orgContacts, p: s.people }).from(s.orgContacts).innerJoin(s.people, eq(s.people.id, s.orgContacts.personId)).where(eq(s.orgContacts.orgId, id)).all();
  const mandates = db.select().from(s.mandates).where(and(eq(s.mandates.orgId, id), brandCond(s.mandates.brandId, ctx.u))).orderBy(desc(s.mandates.openedAt)).all();
  const invoices = db.select().from(s.invoices).where(and(eq(s.invoices.orgId, id), brandCond(s.invoices.brandId, ctx.u))).orderBy(desc(s.invoices.issuedAt)).all();
  const employees = db.select().from(s.people).where(eq(s.people.currentCompany, o.name)).limit(12).all();
  return (
    <>
      <PageHead
        eyebrow={
          <Link href="/console/organisations" className="no-underline">
            ← Organisations
          </Link>
        }
        title={o.name}
        sub={`${o.industry} · ${o.city} · ${o.sizeBand} · ${o.companyType}`}
        actions={rel.map((r) => (
          <BrandChip key={r.brandId + r.relationship} slug={ctx.byId[r.brandId].slug} name={`${ctx.byId[r.brandId].shortName} · ${r.relationship.replace("_", " ")}`} />
        ))}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Panel title={`Mandates · ${mandates.length}`} pad={false}>
            <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
              {mandates.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <span>
                    <Link href={`/console/mandates/${m.id}`} className="font-bold no-underline hover:underline">
                      {m.title}
                    </Link>
                    <span className="block text-xs text-muted">
                      {ctx.byId[m.brandId].shortName} · opened {fmtDate(m.openedAt)}
                    </span>
                  </span>
                  <Badge tone={m.status === "open" ? "good" : "neutral"}>{m.status.replace("_", " ")}</Badge>
                </li>
              ))}
              {!mandates.length && <li className="px-5 py-4 text-sm text-muted">No mandates you can see.</li>}
            </ul>
          </Panel>
          <Panel title="Invoices" pad={false}>
            <div className="scroll-x">
              <table className="data">
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="font-bold">{i.number}</td>
                      <td>{i.description}</td>
                      <td className="tabular-nums">{money(i.amount, i.currency)}</td>
                      <td>
                        <Badge tone={i.status === "paid" ? "good" : i.status === "overdue" ? "bad" : "warn"}>{i.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {!invoices.length && (
                    <tr>
                      <td className="text-muted">No invoices.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <aside className="flex flex-col gap-5">
          <Panel title="Details">
            <KV items={[["Website", o.website], ["Country", o.countryCode], ["Type", o.companyType]]} />
            {o.description && <p className="m-0 mt-3 text-sm text-muted">{o.description}</p>}
          </Panel>
          <Panel title="Contacts">
            {contacts.map(({ c, p }) => (
              <Link key={p.id} href={`/console/people/${p.id}`} className="mb-2 flex items-center gap-2.5 no-underline">
                <Avatar name={`${p.firstName} ${p.lastName}`} size={30} />
                <span className="text-sm">
                  <b>
                    {p.firstName} {p.lastName}
                  </b>
                  <span className="block text-xs text-muted">{c.title}</span>
                </span>
              </Link>
            ))}
            {!contacts.length && <p className="m-0 text-sm text-muted">No contacts recorded.</p>}
          </Panel>
          {employees.length > 0 && (
            <Panel title="People who work here">
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
                {employees.map((p) => (
                  <li key={p.id}>
                    <Link href={`/console/people/${p.id}`}>
                      {p.firstName} {p.lastName}
                    </Link>{" "}
                    <span className="text-muted">· {p.currentTitle}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
