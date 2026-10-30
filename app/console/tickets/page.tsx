import Link from "next/link";
import { and, asc, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { Badge, JevMark } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton } from "@/components/client";
import { ActionSelect, JevDraft } from "@/components/console-client";
import { BrandChip, PageHead, Panel, Tabs } from "@/components/console";
import { SlaBadge, PRIORITY_TONE, STATUS_TONE } from "@/components/sla";
import { assignTicket, jevTicketDraft, runSlaSweep, staffReply } from "@/app/actions/console";
import { fmtDate, nowTs, relTime } from "@/lib/time";

export const metadata = { title: "Support tickets" };

export default async function Tickets({ searchParams }: { searchParams: Promise<{ id?: string; view?: string }> }) {
  const { id, view = "open" } = await searchParams;
  const ctx = await consoleCtx();
  const sc = brandCond(s.tickets.brandId, ctx.u, ctx.pickedId);
  const f =
    view === "open"
      ? inArray(s.tickets.status, ["open", "in_progress", "waiting"])
      : view === "late"
        ? and(inArray(s.tickets.status, ["open", "in_progress"]), isNull(s.tickets.firstResponseAt), lt(s.tickets.slaDueAt, nowTs()))
        : view === "mine"
          ? and(eq(s.tickets.assigneeUserId, ctx.u.id), inArray(s.tickets.status, ["open", "in_progress", "waiting"]))
          : view === "done"
            ? inArray(s.tickets.status, ["resolved", "closed"])
            : undefined;
  const rows = db
    .select({ t: s.tickets, who: s.people, assignee: s.users.name })
    .from(s.tickets)
    .leftJoin(s.people, eq(s.people.id, s.tickets.personId))
    .leftJoin(s.users, eq(s.users.id, s.tickets.assigneeUserId))
    .where(and(sc, f))
    .orderBy(asc(s.tickets.slaDueAt))
    .all();
  const sel = id ? db.select().from(s.tickets).where(and(eq(s.tickets.id, Number(id)), sc)).get() : null;
  const msgs = sel
    ? db
        .select({ m: s.ticketMessages, staff: s.users.name, role: s.users.role })
        .from(s.ticketMessages)
        .leftJoin(s.users, eq(s.users.id, s.ticketMessages.authorUserId))
        .where(eq(s.ticketMessages.ticketId, sel.id))
        .orderBy(asc(s.ticketMessages.createdAt))
        .all()
        .filter((r, i) => !(i === 0 && r.m.body.trim() === sel.message.trim()))
        .map((r) => ({ ...r.m, label: r.m.authorLabel ?? r.staff ?? "Member", isStaff: !!r.role && ["group_admin", "brand_admin", "recruiter"].includes(r.role) }))
    : [];
  const person = sel?.personId ? db.select().from(s.people).where(eq(s.people.id, sel.personId)).get() : null;
  const team = sel ? db.select({ id: s.users.id, name: s.users.name }).from(s.users).where(and(inArray(s.users.role, ["group_admin", "brand_admin", "recruiter"]), or(eq(s.users.brandId, sel.brandId), isNull(s.users.brandId)))).all() : [];
  const met = db.select().from(s.tickets).where(and(sc)).orderBy(desc(s.tickets.createdAt)).all().filter((t) => t.firstResponseAt && t.slaDueAt);
  const onTime = met.length ? Math.round((met.filter((t) => t.firstResponseAt! <= t.slaDueAt!).length / met.length) * 100) : 100;
  const tab = (k: string) => `/console/tickets?view=${k}`;

  return (
    <>
      <PageHead
        title="Support tickets"
        sub={`Every ticket gets a category, priority, owner and response clock from Jev the moment it's raised. ${onTime}% of first responses landed on time.`}
        actions={
          <ActionButton action={runSlaSweep} className="inline-flex min-h-10 items-center gap-1.5 rounded-btn border-[1.5px] border-line px-4 text-sm font-bold hover:bg-bg-2">
            ✦ Run SLA sweep
          </ActionButton>
        }
      />
      <Tabs
        active={view}
        items={[
          { key: "open", label: "Open", href: tab("open") },
          { key: "late", label: "Past SLA", href: tab("late") },
          { key: "mine", label: "Assigned to me", href: tab("mine") },
          { key: "done", label: "Resolved", href: tab("done") },
          { key: "all", label: "All", href: tab("all") },
        ]}
      />
      <div className={`grid gap-5 ${sel ? "xl:grid-cols-[minmax(0,1fr)_460px]" : ""}`}>
        <div className="scroll-x rounded-card border border-line bg-card">
          <table className="data">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>From</th>
                <th>Priority</th>
                <th>Response clock</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, who, assignee }) => (
                <tr key={t.id} className={sel?.id === t.id ? "bg-accent-soft" : ""}>
                  <td className="min-w-[230px]">
                    <Link href={`/console/tickets?view=${view}&id=${t.id}`} className="font-bold no-underline hover:underline">
                      {t.subject}
                    </Link>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <BrandChip slug={ctx.byId[t.brandId].slug} name={ctx.byId[t.brandId].shortName} /> {t.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{who ? `${who.firstName} ${who.lastName}` : "—"}</td>
                  <td>
                    <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                  </td>
                  <td>
                    <SlaBadge t={t} />
                  </td>
                  <td className="whitespace-nowrap">{assignee ?? "—"}</td>
                  <td>
                    <Badge tone={STATUS_TONE[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Nothing in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sel && (
          <Panel title={sel.subject} action={<Link href={tab(view)} className="text-sm font-bold">Close</Link>}>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={PRIORITY_TONE[sel.priority]}>{sel.priority}</Badge>
              <SlaBadge t={sel} />
              <span className="text-muted">
                {sel.category} · opened {fmtDate(sel.createdAt, true)}
              </span>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
              {person && (
                <Link href={`/console/people/${person.id}`} className="font-bold">
                  {person.firstName} {person.lastName}
                </Link>
              )}
              <span className="text-muted">Owner</span>
              <ActionSelect label="Assign ticket" value={String(sel.assigneeUserId ?? "")} options={[{ value: "", label: "Unassigned" }, ...team.map((m) => ({ value: String(m.id), label: m.name }))]} onPick={assignTicket.bind(null, sel.id) as (v: string) => Promise<void>} />
            </div>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              <li className="rounded-field bg-bg-2 p-3 text-sm leading-relaxed">
                <b className="block text-xs text-faint">Member · {relTime(sel.createdAt)}</b>
                {sel.message}
              </li>
              {msgs.map((m) => (
                <li key={m.id} className={`rounded-field p-3 text-sm leading-relaxed ${m.internal ? "border border-dashed border-warn bg-warn-soft" : m.isStaff ? "bg-accent-soft" : m.authorUserId ? "bg-bg-2" : "border border-line"}`}>
                  <b className="block text-xs text-faint">
                    {m.label} · {relTime(m.createdAt)}
                  </b>
                  <span className="whitespace-pre-line">{m.body}</span>
                </li>
              ))}
            </ol>
            <JevDraft action={jevTicketDraft} fields={{ ticketId: sel.id }} label="Draft a reply with Jev" className="mt-4" />
            <ActionForm action={staffReply} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="ticketId" value={sel.id} />
              <textarea name="body" rows={4} className="field" placeholder="Write a reply to the member" aria-label="Reply" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="internal" className="h-4 w-4" /> Internal note
                </label>
                <span className="flex items-center gap-2">
                  <select name="status" defaultValue={sel.status === "open" ? "in_progress" : sel.status} className="field !min-h-10 !w-40 !py-1.5 text-sm" aria-label="Status after reply">
                    <option value="in_progress">In progress</option>
                    <option value="waiting">Waiting on member</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <SubmitButton size="sm">Send</SubmitButton>
                </span>
              </div>
            </ActionForm>
            <p className="m-0 mt-3 text-xs text-faint">
              <JevMark className="mr-1" /> The first non-internal reply stops the SLA clock.
            </p>
          </Panel>
        )}
      </div>
    </>
  );
}
