import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { Badge, ButtonLink, Card, Empty } from "@/components/ui";
import { SlaBadge, STATUS_TONE, PRIORITY_TONE } from "@/components/sla";
import { fmtDate } from "@/lib/time";

export const metadata = { title: "Support" };

export default async function Support() {
  const { person } = await requireMember();
  const tickets = db
    .select({ t: s.tickets, owner: s.users.name })
    .from(s.tickets)
    .leftJoin(s.users, eq(s.users.id, s.tickets.assigneeUserId))
    .where(eq(s.tickets.personId, person.id))
    .orderBy(desc(s.tickets.updatedAt))
    .all();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">Support</h1>
          <p className="m-0 mt-1 text-muted">Every ticket has a named owner and a response time. Annual members get a 4-hour response.</p>
        </div>
        <ButtonLink href="/exh1b/dashboard/support/new">New ticket</ButtonLink>
      </div>
      <Card className="p-4 text-sm">
        <b>Response times:</b> urgent 4h · high 8h · normal 24h · low 48h (business hours, IST).
      </Card>
      {tickets.length === 0 ? (
        <Empty title="No tickets yet">Ask us anything about jobs, your employer, relocation or billing.</Empty>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {tickets.map(({ t, owner }) => (
            <li key={t.id}>
              <Link href={`/exh1b/dashboard/support/${t.id}`} className="block no-underline">
                <Card className="flex flex-wrap items-center gap-3 p-4 transition hover:border-accent">
                  <div className="min-w-0 flex-1">
                    <b className="block">{t.subject}</b>
                    <span className="text-sm text-muted">
                      #{t.id} · {t.category} · opened {fmtDate(t.createdAt)} · {owner ? `Owner: ${owner}` : "Unassigned"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                    <Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                    <SlaBadge t={t} />
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
