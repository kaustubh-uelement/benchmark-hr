import Link from "next/link";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { Badge, Empty } from "@/components/ui";
import { BrandChip, PageHead, Tabs } from "@/components/console";
import { fmtDate, money, relTime } from "@/lib/time";

export const metadata = { title: "Mandates & roles" };

const STATUS_TONE = { open: "good", on_hold: "warn", filled: "accent", closed: "neutral", draft: "neutral" } as const;
const KIND_LABEL = { search: "Retained search", job: "Role", outplacement: "Programme", advisory: "Advisory project" } as const;

export default async function Mandates({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const { view = "open", q = "" } = await searchParams;
  const ctx = await consoleCtx();
  const { u, pickedId, byId } = ctx;
  const conds = [brandCond(s.mandates.brandId, u, pickedId)];
  if (view === "open") conds.push(inArray(s.mandates.status, ["open", "on_hold"]));
  if (view === "done") conds.push(inArray(s.mandates.status, ["filled", "closed"]));
  if (view === "proposals") conds.push(sql`exists (select 1 from engagements e where e.mandate_id = ${s.mandates.id} and e.stage = 'sourced' and e.source = 'jev')`);
  if (q) conds.push(or(like(s.mandates.title, `%${q}%`), like(s.mandates.locationLabel, `%${q}%`)));

  const rows = db
    .select({ m: s.mandates, org: s.organisations.name, owner: s.users.name })
    .from(s.mandates)
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .leftJoin(s.users, eq(s.users.id, s.mandates.ownerUserId))
    .where(and(...conds))
    .orderBy(desc(s.mandates.openedAt))
    .limit(300)
    .all();
  const ids = rows.map((r) => r.m.id);
  const counts = ids.length
    ? db
        .select({ id: s.engagements.mandateId, stage: s.engagements.stage, n: sql<number>`count(*)` })
        .from(s.engagements)
        .where(inArray(s.engagements.mandateId, ids))
        .groupBy(s.engagements.mandateId, s.engagements.stage)
        .all()
    : [];
  const c = (id: number, stages: string[], source?: string) => counts.filter((x) => x.id === id && stages.includes(x.stage)).reduce((a, x) => a + x.n, 0) + (source ? 0 : 0);
  const props = ids.length
    ? Object.fromEntries(
        db
          .select({ id: s.engagements.mandateId, n: sql<number>`count(*)` })
          .from(s.engagements)
          .where(and(inArray(s.engagements.mandateId, ids), eq(s.engagements.stage, "sourced"), eq(s.engagements.source, "jev")))
          .groupBy(s.engagements.mandateId)
          .all()
          .map((r) => [r.id, r.n]),
      )
    : {};

  const tab = (k: string) => `/console/mandates?view=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  return (
    <>
      <PageHead
        title="Mandates & roles"
        sub="Golden Glove searches, Talent and ExH1B roles, TrustCircle programmes and Advisory projects: one list, one pipeline model."
        actions={
          <>
            <form className="flex">
              <input type="hidden" name="view" value={view} />
              <input name="q" defaultValue={q} placeholder="Search title or city" className="field !min-h-10 !py-2 text-sm" aria-label="Search mandates" />
            </form>
            <Link href="/console/mandates/new" className="inline-flex min-h-10 items-center rounded-btn bg-primary px-4 text-sm font-bold text-primary-ink no-underline">
              New mandate
            </Link>
          </>
        }
      />
      <Tabs
        active={view}
        items={[
          { key: "open", label: "Open", href: tab("open") },
          { key: "proposals", label: "Jev proposals waiting", href: tab("proposals") },
          { key: "done", label: "Filled & closed", href: tab("done") },
          { key: "all", label: "All", href: tab("all") },
        ]}
      />
      {rows.length === 0 ? (
        <Empty title="No mandates here">Try another tab or clear the search.</Empty>
      ) : (
        <div className="scroll-x rounded-card border border-line bg-card">
          <table className="data">
            <thead>
              <tr>
                <th>Mandate</th>
                <th>Business</th>
                <th>Client</th>
                <th>Pipeline</th>
                <th>Fee</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ m, org, owner }) => (
                <tr key={m.id}>
                  <td className="min-w-[240px]">
                    <Link href={`/console/mandates/${m.id}`} className="font-bold no-underline hover:underline">
                      {m.title}
                    </Link>
                    <span className="block text-xs text-muted">
                      {KIND_LABEL[m.kind]} · {m.locationLabel ?? "—"} · opened {relTime(m.openedAt)}
                    </span>
                  </td>
                  <td>
                    <BrandChip slug={byId[m.brandId].slug} name={byId[m.brandId].shortName} />
                  </td>
                  <td className="min-w-[150px]">
                    {org ?? "—"}
                    {m.confidential && (
                      <Badge tone="dark" className="ml-1.5">
                        Confidential
                      </Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs">
                    {m.kind === "outplacement" ? (
                      <span>{c(m.id, ["enrolled"])} enrolled · {c(m.id, ["placed"])} landed</span>
                    ) : m.kind === "advisory" ? (
                      <span>Project</span>
                    ) : (
                      <span>
                        {c(m.id, ["applied", "screening", "sourced"])} in · {c(m.id, ["shortlisted", "interview"])} short · {c(m.id, ["offer", "placed"])} offer
                      </span>
                    )}
                    {!!props[m.id] && (
                      <Badge tone="accent" className="ml-2">
                        ✦ {props[m.id]} to review
                      </Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap tabular-nums">{money(m.feeAmount, m.feeCurrency ?? "INR", true)}</td>
                  <td className="whitespace-nowrap">{owner ?? "—"}</td>
                  <td>
                    <Badge tone={STATUS_TONE[m.status]}>{m.status.replace("_", " ")}</Badge>
                    {m.targetDate && m.status === "open" && <span className="block text-[11px] text-faint">target {fmtDate(m.targetDate)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
