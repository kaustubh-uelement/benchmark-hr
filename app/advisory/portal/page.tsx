import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { clientMandates, mandateInvoices, requirePortal } from "@/lib/portal";
import { ActionForm, SubmitButton } from "@/components/client";
import { clientMessage } from "@/app/actions/portal";
import { fmtDate, money, nowTs } from "@/lib/time";

export const metadata = { title: "Client portal" };

const LABEL = { todo: "Not started", doing: "In progress", review: "With you for review", done: "Complete" } as const;

export default async function AdvPortal() {
  const { u, org, brand } = await requirePortal("advisory");
  const projects = clientMandates(u.orgId, brand.id);
  const invoices = org ? mandateInvoices(org.id, brand.id) : [];
  return (
    <>
      <h1 className="m-0 font-display text-[clamp(40px,4.6vw,60px)] font-normal">Your engagements</h1>
      <div className="mt-8 flex flex-col gap-8">
        {projects.map(({ m, owner }) => {
          const items = db.select().from(s.deliverables).where(eq(s.deliverables.mandateId, m.id)).orderBy(asc(s.deliverables.dueAt)).all();
          const done = items.filter((d) => d.status === "done").length;
          return (
            <article key={m.id} className="border border-line bg-card">
              <header className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink px-7 py-5">
                <div>
                  <h2 className="m-0 font-display text-[30px] font-medium">{m.title}</h2>
                  <p className="m-0 text-sm text-muted">
                    {m.feeModel === "retainer" ? "Retainer" : "Project"} · since {fmtDate(m.openedAt)} · principal {owner?.name}
                  </p>
                </div>
                <span className="font-display text-xl">
                  {done}/{items.length} <span className="text-sm text-muted">milestones</span>
                </span>
              </header>
              {m.description && <p className="m-0 px-7 pt-5 leading-relaxed text-muted">{m.description}</p>}
              <ol className="m-0 grid list-none gap-0 p-7 md:grid-cols-5">
                {items.map((d, i) => (
                  <li key={d.id} className="relative flex flex-col gap-2 border-t-2 pt-4 md:pr-4" style={{ borderColor: d.status === "done" ? "var(--accent)" : "var(--line)" }}>
                    <span className="font-display text-sm italic text-accent">§ {i + 1}</span>
                    <b className="font-display text-lg font-medium leading-snug">{d.title}</b>
                    <span className={`text-xs font-semibold ${d.status === "done" ? "text-good" : d.status === "review" ? "text-warn" : "text-muted"}`}>{LABEL[d.status]}</span>
                    <span className="text-xs text-faint">
                      {d.status === "done" ? "Delivered" : "Due"} {fmtDate(d.dueAt)}
                      {d.status !== "done" && d.dueAt && d.dueAt < nowTs() ? " · running late" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          );
        })}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="border border-line bg-card p-7">
          <h2 className="m-0 font-display text-2xl font-medium">Invoices</h2>
          <ul className="m-0 mt-4 flex list-none flex-col p-0 text-sm">
            {invoices.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 border-b border-line py-3">
                <span>
                  {i.description}
                  <span className="block text-xs text-faint">{i.number}</span>
                </span>
                <span className="text-right">
                  {money(i.amount, i.currency)}
                  <span className={`block text-xs ${i.status === "paid" ? "text-good" : "text-warn"}`}>{i.status === "paid" ? `paid ${fmtDate(i.paidAt)}` : `due ${fmtDate(i.dueAt)}`}</span>
                </span>
              </li>
            ))}
            {!invoices.length && <li className="py-3 text-muted">No invoices yet.</li>}
          </ul>
        </section>
        <section className="border border-line bg-card p-7">
          <h2 className="m-0 font-display text-2xl font-medium">Ask your principal</h2>
          <ActionForm action={clientMessage} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="mandateId" value={projects[0]?.m.id ?? ""} />
            <textarea name="body" rows={5} className="field" placeholder="A policy question, a difficult case, or feedback on a draft." aria-label="Message" />
            <div>
              <SubmitButton>Send</SubmitButton>
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
