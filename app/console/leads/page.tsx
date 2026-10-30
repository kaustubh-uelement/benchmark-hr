import Link from "next/link";
import { and, desc, eq, inArray, isNull, like, or } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { Badge, JevMark, ScoreRing } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/client";
import { BrandChip, KV, PageHead, Panel, Tabs } from "@/components/console";
import { updateLead } from "@/app/actions/console";
import { fmtDate, money, nowTs, relTime } from "@/lib/time";

export const metadata = { title: "Leads & enquiries" };

const STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const TONE = { new: "warn", contacted: "accent", qualified: "accent", proposal: "accent", won: "good", lost: "neutral" } as const;

export default async function Leads({ searchParams }: { searchParams: Promise<{ id?: string; status?: string }> }) {
  const { id, status = "open" } = await searchParams;
  const ctx = await consoleCtx();
  const sc = brandCond(s.leads.brandId, ctx.u, ctx.pickedId);
  const filter = status === "open" ? inArray(s.leads.status, ["new", "contacted", "qualified", "proposal"]) : status === "all" ? undefined : eq(s.leads.status, status as "new");
  const rows = db
    .select({ l: s.leads, owner: s.users.name })
    .from(s.leads)
    .leftJoin(s.users, eq(s.users.id, s.leads.ownerUserId))
    .where(and(sc, filter))
    .orderBy(desc(s.leads.createdAt))
    .all();
  const sel = id ? db.select().from(s.leads).where(and(eq(s.leads.id, Number(id)), sc)).get() : null;
  const staff = db
    .select({ id: s.users.id, name: s.users.name, brandId: s.users.brandId })
    .from(s.users)
    .where(and(inArray(s.users.role, ["group_admin", "brand_admin", "recruiter"]), sel ? or(eq(s.users.brandId, sel.brandId), isNull(s.users.brandId)) : undefined))
    .all();
  const leadNotes = sel ? db.select().from(s.interactions).where(and(eq(s.interactions.brandId, sel.brandId), like(s.interactions.summary, `Lead #${sel.id}:%`))).orderBy(desc(s.interactions.occurredAt)).all() : [];
  const tab = (k: string) => `/console/leads?status=${k}`;

  return (
    <>
      <PageHead title="Leads & enquiries" sub="Every form across the group's websites lands here. Jev scores each one, links it to existing people and companies, routes it and sets a reply-by time." actions={<JevMark />} />
      <Tabs
        active={status}
        items={[
          { key: "open", label: "Open", href: tab("open") },
          ...STATUSES.map((x) => ({ key: x, label: x[0].toUpperCase() + x.slice(1), href: tab(x) })),
          { key: "all", label: "All", href: tab("all") },
        ]}
      />
      <div className={`grid gap-5 ${sel ? "xl:grid-cols-[1fr_400px]" : ""}`}>
        <div className="scroll-x rounded-card border border-line bg-card">
          <table className="data">
            <thead>
              <tr>
                <th>Score</th>
                <th>Who</th>
                <th>Business</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Reply by</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ l, owner }) => {
                const late = l.status === "new" && l.respondBy && l.respondBy < nowTs();
                return (
                  <tr key={l.id} className={sel?.id === l.id ? "bg-accent-soft" : ""}>
                    <td>
                      <ScoreRing score={l.score ?? 0} size={40} />
                    </td>
                    <td className="min-w-[200px]">
                      <Link href={`/console/leads?status=${status}&id=${l.id}`} className="font-bold no-underline hover:underline">
                        {l.name}
                      </Link>
                      <span className="block text-xs text-muted">
                        {[l.roleTitle, l.company].filter(Boolean).join(", ") || l.email}
                      </span>
                    </td>
                    <td>
                      <BrandChip slug={ctx.byId[l.brandId].slug} name={ctx.byId[l.brandId].shortName} />
                    </td>
                    <td className="whitespace-nowrap">{l.kind.replace("_", " ")}</td>
                    <td className="whitespace-nowrap">{owner ?? "—"}</td>
                    <td className="whitespace-nowrap">{late ? <Badge tone="bad">Late · {relTime(l.respondBy)}</Badge> : <span className="text-xs text-muted">{l.status === "new" ? relTime(l.respondBy) : "—"}</span>}</td>
                    <td>
                      <Badge tone={TONE[l.status]}>{l.status}</Badge>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No leads in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sel && (
          <Panel title={sel.name} action={<Link href={`/console/leads?status=${status}`} className="text-sm font-bold">Close</Link>}>
            <KV
              items={[
                ["Business", ctx.byId[sel.brandId].name],
                ["Email", <a key="e" href={`mailto:${sel.email}`}>{sel.email}</a>],
                ["Phone", sel.phone],
                ["Company", sel.orgId ? <Link key="o" href={`/console/organisations/${sel.orgId}`}>{sel.company}</Link> : sel.company],
                ["Role", sel.roleTitle],
                ["Person", sel.personId ? <Link key="p" href={`/console/people/${sel.personId}`}>Open record</Link> : "New to the group"],
                ["Value", sel.valueEstimate ? money(sel.valueEstimate, sel.currency ?? "INR") : null],
                ["Source", sel.source],
                ["Received", fmtDate(sel.createdAt, true)],
              ]}
            />
            {sel.message && <blockquote className="m-0 mt-4 rounded-field bg-bg-2 p-3 text-sm leading-relaxed">{sel.message}</blockquote>}
            <ActionForm action={updateLead} resetOnSuccess={false} className="mt-5 flex flex-col gap-3">
              <input type="hidden" name="id" value={sel.id} />
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  Status
                  <select name="status" defaultValue={sel.status} className="field">
                    {STATUSES.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  Owner
                  <select name="ownerUserId" defaultValue={sel.ownerUserId ?? ""} className="field">
                    {staff.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <textarea name="note" rows={2} className="field" placeholder="Add a note (optional)" aria-label="Note" />
              <SubmitButton size="sm">Save</SubmitButton>
            </ActionForm>
            {leadNotes.length > 0 && (
              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0 text-sm">
                {leadNotes.map((n) => (
                  <li key={n.id}>
                    {n.summary.replace(`Lead #${sel.id}: `, "")}
                    <span className="block text-xs text-faint">{relTime(n.occurredAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
