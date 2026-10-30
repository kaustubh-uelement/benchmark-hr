import Link from "next/link";
import { clientMandates, mandateInvoices, requirePortal, searchStage, SEARCH_STAGES, stageCounts } from "@/lib/portal";
import { GGEyebrow } from "@/components/goldenglove";
import { fmtDate, money, relTime } from "@/lib/time";

export const metadata = { title: "Client room" };

export default async function GGPortal() {
  const { u, org, brand } = await requirePortal("golden-glove");
  const rows = clientMandates(u.orgId, brand.id);
  const invoices = org ? mandateInvoices(org.id, brand.id) : [];
  const due = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  return (
    <>
      <GGEyebrow>Good to see you, {u.name.split(" ")[0]}</GGEyebrow>
      <h1 className="m-0 mt-4 font-display text-[clamp(44px,5vw,72px)] font-medium leading-none">Your searches</h1>
      <div className="mt-12 flex flex-col gap-6">
        {rows.map(({ m, owner }) => {
          const c = stageCounts(m.id);
          const st = searchStage(c, m.status);
          return (
            <Link key={m.id} href={`/goldenglove/portal/${m.id}`} className="group block border border-line bg-card p-7 no-underline transition hover:border-[var(--gold-3)] sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="m-0 font-display text-[38px] font-medium leading-tight group-hover:text-[var(--gold-1)]">{m.title}</h2>
                  <p className="m-0 mt-1 text-sm text-muted">
                    {m.locationLabel} · opened {fmtDate(m.openedAt)} · partner {owner?.name ?? "—"}
                    {m.confidential ? " · confidential" : ""}
                  </p>
                </div>
                <span className="text-[12px] uppercase tracking-[.24em] text-[var(--gold-1)]">{m.status === "filled" ? "Appointed" : SEARCH_STAGES[st]}</span>
              </div>
              <ol className="m-0 mt-8 grid list-none grid-cols-7 gap-1.5 p-0" aria-label={`Stage ${st + 1} of 7`}>
                {SEARCH_STAGES.map((s, i) => (
                  <li key={s} className="flex flex-col gap-2">
                    <span className={`h-[3px] ${i <= st ? "bg-[linear-gradient(90deg,var(--gold-2),var(--gold-1))]" : "bg-line"}`} />
                    <span className={`hidden text-[11px] uppercase tracking-[.16em] sm:block ${i <= st ? "text-ink" : "text-faint"}`}>{s}</span>
                  </li>
                ))}
              </ol>
              <dl className="m-0 mt-7 flex flex-wrap gap-x-12 gap-y-3 text-sm">
                {[
                  ["Approached", c.approached],
                  ["Assessed", c.assessed],
                  ["On shortlist", c.shortlisted],
                  ["Meeting you", c.interview],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-muted">{k}</dt>
                    <dd className="m-0 font-display text-[30px] leading-none">{v}</dd>
                  </div>
                ))}
              </dl>
            </Link>
          );
        })}
        {!rows.length && <p className="text-muted">No searches yet. Your partner will open one after your brief.</p>}
      </div>
      {invoices.length > 0 && (
        <section className="mt-14">
          <GGEyebrow>Retainers</GGEyebrow>
          <ul className="m-0 mt-5 flex list-none flex-col border-t border-line p-0">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-4 text-sm">
                <span>
                  <b className="font-medium">{i.description}</b>
                  <span className="block text-muted">
                    {i.number} · {i.status === "paid" ? `paid ${fmtDate(i.paidAt)}` : `due ${fmtDate(i.dueAt)} (${relTime(i.dueAt)})`}
                  </span>
                </span>
                <span className="font-display text-[22px]">
                  {money(i.amount, i.currency)} <span className={`ml-2 text-[11px] uppercase tracking-[.2em] ${i.status === "paid" ? "text-good" : i.status === "overdue" ? "text-bad" : "text-[var(--gold-1)]"}`}>{i.status}</span>
                </span>
              </li>
            ))}
          </ul>
          {due.length > 0 && <p className="mt-3 text-sm text-muted">{due.length} retainer invoice{due.length > 1 ? "s" : ""} open. Your finance team can pay by bank transfer to the account on the invoice.</p>}
        </section>
      )}
    </>
  );
}
