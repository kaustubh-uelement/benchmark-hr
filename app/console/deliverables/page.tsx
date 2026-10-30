import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { ActionSelect } from "@/components/console-client";
import { PageHead } from "@/components/console";
import { consoleCtx } from "@/lib/console";
import { setDeliverableStatus } from "@/app/actions/console";
import { fmtDate, nowTs } from "@/lib/time";
import { Badge } from "@/components/ui";

export const metadata = { title: "Deliverables" };

const COLS = [
  ["todo", "To do"],
  ["doing", "In progress"],
  ["review", "Client review"],
  ["done", "Done"],
] as const;

export default async function Deliverables() {
  await consoleCtx();
  const rows = db
    .select({ d: s.deliverables, m: s.mandates, org: s.organisations.name })
    .from(s.deliverables)
    .innerJoin(s.mandates, eq(s.mandates.id, s.deliverables.mandateId))
    .leftJoin(s.organisations, eq(s.organisations.id, s.mandates.orgId))
    .orderBy(asc(s.deliverables.dueAt))
    .all();
  return (
    <>
      <PageHead eyebrow="Benchmark Advisory" title="Deliverables" sub="Every advisory project's milestones in one board. Clients see the same status in their portal." />
      <div className="scroll-x">
        <div className="grid min-w-[960px] grid-cols-4 gap-3">
          {COLS.map(([k, label]) => (
            <section key={k} className="flex flex-col gap-2 rounded-card bg-bg-2 p-2.5">
              <header className="px-1 pt-1 text-xs font-bold uppercase tracking-wider text-faint">
                {label} · {rows.filter((r) => r.d.status === k).length}
              </header>
              {rows
                .filter((r) => r.d.status === k)
                .map(({ d, m, org }) => (
                  <article key={d.id} className="flex flex-col gap-1.5 rounded-[12px] border border-line bg-card-2 p-3 text-sm">
                    <b>{d.title}</b>
                    <Link href={`/console/mandates/${m.id}`} className="text-xs text-muted">
                      {org} · {m.title}
                    </Link>
                    <span className="text-xs">
                      due {fmtDate(d.dueAt)} {d.status !== "done" && d.dueAt && d.dueAt < nowTs() && <Badge tone="bad">late</Badge>}
                    </span>
                    <ActionSelect label={`Status of ${d.title}`} value={d.status} options={COLS.map(([value, l]) => ({ value, label: l }))} onPick={setDeliverableStatus.bind(null, d.id) as (v: string) => Promise<void>} />
                  </article>
                ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
