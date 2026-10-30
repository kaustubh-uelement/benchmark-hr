import Link from "next/link";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { Badge } from "@/components/ui";
import { ActionSelect } from "@/components/console-client";
import { PageHead, Panel } from "@/components/console";
import { setSessionStatus } from "@/app/actions/console";
import { daysAgo, daysAhead, fmtDate } from "@/lib/time";

export const metadata = { title: "Coaching" };

export default async function Coaching() {
  const ctx = await consoleCtx();
  const rows = (when: "past" | "next") =>
    db
      .select({ c: s.coachingSessions, p: s.people, m: s.mandates, coach: s.users.name })
      .from(s.coachingSessions)
      .innerJoin(s.people, eq(s.people.id, s.coachingSessions.personId))
      .leftJoin(s.mandates, eq(s.mandates.id, s.coachingSessions.mandateId))
      .leftJoin(s.users, eq(s.users.id, s.coachingSessions.coachUserId))
      .where(when === "next" ? and(gte(s.coachingSessions.scheduledAt, daysAgo(1)), lt(s.coachingSessions.scheduledAt, daysAhead(21))) : and(lt(s.coachingSessions.scheduledAt, daysAgo(1)), eq(s.coachingSessions.status, "planned")))
      .orderBy(asc(s.coachingSessions.scheduledAt))
      .all();
  const next = rows("next");
  const overdue = rows("past");
  const list = (r: ReturnType<typeof rows>) => (
    <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
      {r.map(({ c, p, m, coach }) => (
        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <span>
            <b>{c.topic}</b> with{" "}
            <Link href={`/console/people/${p.id}`}>
              {p.firstName} {p.lastName}
            </Link>
            <span className="block text-xs text-muted">
              {fmtDate(c.scheduledAt, true)} · {coach ?? "Coach"} · {m ? <Link href={`/console/mandates/${m.id}`}>{m.title}</Link> : "Self-funded"}
            </span>
          </span>
          <ActionSelect
            label={`Status of ${c.topic}`}
            value={c.status}
            options={[
              { value: "planned", label: "Planned" },
              { value: "done", label: "Done" },
              { value: "missed", label: "Missed" },
            ]}
            onPick={setSessionStatus.bind(null, c.id) as (v: string) => Promise<void>}
          />
        </li>
      ))}
      {!r.length && <li className="px-5 py-4 text-sm text-muted">Nothing here.</li>}
    </ul>
  );
  void ctx;
  return (
    <>
      <PageHead eyebrow="TrustCircle" title="Coaching sessions" sub="Every participant's plan is built by Jev at enrolment: five sessions over the first 30 days, then reviewed by their coach." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title={`Next three weeks · ${next.length}`} pad={false}>
          {list(next)}
        </Panel>
        <Panel title={<span>Not yet marked · {overdue.length} {overdue.length > 0 && <Badge tone="warn">update</Badge>}</span>} pad={false}>
          {list(overdue)}
        </Panel>
      </div>
    </>
  );
}
