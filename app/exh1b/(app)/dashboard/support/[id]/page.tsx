import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { replyTicket } from "@/app/actions/exh1b";
import { ActionForm, SubmitButton } from "@/components/client";
import { Avatar, Badge, Card } from "@/components/ui";
import { SlaBadge, STATUS_TONE, PRIORITY_TONE } from "@/components/sla";
import { fmtDate } from "@/lib/time";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { person, user } = await requireMember();
  const id = Number((await params).id);
  const t = db.select().from(s.tickets).where(and(eq(s.tickets.id, id), eq(s.tickets.personId, person.id))).get();
  if (!t) notFound();
  const owner = t.assigneeUserId ? db.select().from(s.users).where(eq(s.users.id, t.assigneeUserId)).get() : null;
  const names = Object.fromEntries(db.select({ id: s.users.id, name: s.users.name, personId: s.users.personId }).from(s.users).all().map((u) => [u.id, u]));
  const msgs = db.select().from(s.ticketMessages).where(and(eq(s.ticketMessages.ticketId, id), eq(s.ticketMessages.internal, false))).orderBy(asc(s.ticketMessages.createdAt)).all();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/exh1b/dashboard/support" className="text-sm font-bold text-accent">
        ← All tickets
      </Link>
      <div>
        <h1 className="m-0 font-display text-2xl font-extrabold">{t.subject}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge>#{t.id}</Badge>
          <Badge>{t.category}</Badge>
          <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
          <Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
          <SlaBadge t={t} />
        </div>
        <p className="m-0 mt-2 text-sm text-muted">
          Owner: <b className="text-ink">{owner?.name ?? "Being assigned"}</b>
          {owner?.title ? `, ${owner.title}` : ""} · response target {t.slaHours ?? 24}h
        </p>
      </div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {msgs.map((m) => {
          const mine = m.authorUserId === user.id || (m.authorUserId != null && names[m.authorUserId]?.personId === person.id);
          const bot = !!m.authorLabel?.startsWith("Jev");
          const staffName = !mine && !bot ? ((m.authorUserId && names[m.authorUserId]?.name) || m.authorLabel || "ExH1B team") : null;
          return (
            <li key={m.id} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={mine ? `${person.firstName} ${person.lastName}` : bot ? "J ev" : (staffName ?? "Team")} size={34} />
              <Card className={`max-w-[85%] p-4 ${mine ? "bg-accent-soft" : bot ? "border-dashed" : ""}`}>
                <p className="m-0 text-xs font-bold text-faint">
                  {mine ? "You" : bot ? m.authorLabel : staffName} · {fmtDate(m.createdAt, true)}
                </p>
                <p className="m-0 mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{m.body}</p>
              </Card>
            </li>
          );
        })}
      </ol>
      {t.status !== "closed" && (
        <Card className="p-4">
          <ActionForm action={replyTicket} className="flex flex-col gap-3">
            <input type="hidden" name="ticketId" value={t.id} />
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Reply
              <textarea className="field" name="body" rows={3} required />
            </label>
            <div>
              <SubmitButton size="sm">Send reply</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
