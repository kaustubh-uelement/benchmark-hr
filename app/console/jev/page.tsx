import Link from "next/link";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { jevEngine } from "@/lib/jev/llm";
import { Badge, JevMark, Notice } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { BarList, PageHead, Panel } from "@/components/console";
import { runSlaSweep, toggleAutomation } from "@/app/actions/console";
import { daysAgo, relTime } from "@/lib/time";

export const metadata = { title: "Jev automations" };

export default async function Jev({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  const ctx = await consoleCtx();
  const autos = db.select().from(s.jevAutomations).orderBy(asc(s.jevAutomations.id)).all();
  const runs = db.select().from(s.jevRuns).where(key ? eq(s.jevRuns.automationKey, key) : undefined).orderBy(desc(s.jevRuns.createdAt)).limit(60).all();
  const per = db.select({ k: s.jevRuns.automationKey, n: sql<number>`count(*)` }).from(s.jevRuns).where(gte(s.jevRuns.createdAt, daysAgo(30))).groupBy(s.jevRuns.automationKey).all();
  const queries = db.select({ q: s.jevQueries, who: s.users.name }).from(s.jevQueries).leftJoin(s.users, eq(s.users.id, s.jevQueries.userId)).orderBy(desc(s.jevQueries.createdAt)).limit(10).all();
  const engine = jevEngine();
  const admin = ctx.u.role === "group_admin";
  return (
    <>
      <PageHead
        title={
          <span className="flex items-center gap-3">
            Jev automations <JevMark engine={engine} />
          </span>
        }
        sub="Jev listens to events across every portal and acts on them. Anything that reaches out to a person, or sends money, waits for a teammate's approval."
        actions={
          <>
            <Link href="/console/jev/ask" className="inline-flex min-h-10 items-center rounded-btn bg-primary px-4 text-sm font-bold text-primary-ink no-underline">
              Ask Jev
            </Link>
            <ActionButton action={runSlaSweep} className="inline-flex min-h-10 items-center rounded-btn border-[1.5px] border-line px-4 text-sm font-bold">
              Run SLA sweep now
            </ActionButton>
          </>
        }
      />
      <div className="mb-5">
        <Notice tone={engine === "claude" ? "good" : "accent"} title={engine === "claude" ? "Running on Claude" : "Running on the rules engine"}>
          {engine === "claude"
            ? `Jev drafts replies, outreach and search filters with ${process.env.JEV_MODEL || "claude-sonnet-5-5"}. If a call fails, it falls back to the rules engine for that step and logs it.`
            : "Every automation works without AI: matching, scoring, routing and SLAs are deterministic. Set ANTHROPIC_API_KEY on the server to have Claude write ticket acknowledgements, outreach drafts, community replies and interpret plain-language searches."}
        </Notice>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Panel title={`${autos.filter((a) => a.enabled).length} of ${autos.length} automations on`} pad={false}>
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {autos.map((a) => (
              <li key={a.key} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/console/jev?key=${a.key}`} className="font-bold no-underline hover:underline">
                      {a.name}
                    </Link>
                    <Badge>on {a.trigger}</Badge>
                    {a.humanApproval && <Badge tone="warn">human approves</Badge>}
                    <Badge tone="neutral">{a.brandScope === "all" ? "all businesses" : a.brandScope.replaceAll(",", ", ")}</Badge>
                  </div>
                  <p className="m-0 mt-1 text-sm leading-relaxed text-muted">{a.description}</p>
                  <p className="m-0 mt-1 text-xs text-faint">
                    {a.runs} runs · last {relTime(a.lastRunAt)}
                  </p>
                </div>
                {admin ? (
                  <ActionButton action={toggleAutomation.bind(null, a.key)} className={`relative h-7 w-12 flex-none rounded-full transition ${a.enabled ? "bg-good" : "bg-line"}`} title={a.enabled ? "Turn off" : "Turn on"}>
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${a.enabled ? "left-6" : "left-1"}`} />
                    <span className="sr-only">{a.enabled ? "On" : "Off"}</span>
                  </ActionButton>
                ) : (
                  <Badge tone={a.enabled ? "good" : "neutral"}>{a.enabled ? "On" : "Off"}</Badge>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        <div className="flex flex-col gap-5">
          <Panel title="Runs, last 30 days">
            <BarList rows={autos.map((a) => ({ label: a.name, value: per.find((p) => p.k === a.key)?.n ?? 0, href: `/console/jev?key=${a.key}` }))} />
          </Panel>
          <Panel title="Recent questions to Jev">
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
              {queries.map(({ q, who }) => (
                <li key={q.id}>
                  “{q.question}”
                  <span className="block text-xs text-faint">
                    {who ?? "Website visitor"} · {q.resultCount} results · {q.engine} · {relTime(q.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
      <Panel className="mt-5" title={key ? `Run log · ${autos.find((a) => a.key === key)?.name}` : "Run log"} action={key ? <Link href="/console/jev" className="text-sm font-bold">Show all</Link> : undefined} pad={false}>
        <div className="scroll-x">
          <table className="data">
            <thead>
              <tr>
                <th>When</th>
                <th>Automation</th>
                <th>What happened</th>
                <th>Business</th>
                <th>Engine</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-xs">{relTime(r.createdAt)}</td>
                  <td className="whitespace-nowrap">{r.automationKey}</td>
                  <td className="min-w-[300px]">{r.summary}</td>
                  <td className="whitespace-nowrap">{r.brandId ? ctx.byId[r.brandId].shortName : "Group"}</td>
                  <td>{r.engine}</td>
                  <td>
                    <Badge tone={r.status === "ok" ? "good" : r.status === "skipped" ? "warn" : "bad"}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
