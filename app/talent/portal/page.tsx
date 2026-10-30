import Link from "next/link";
import { clientMandates, mandateInvoices, requirePortal, stageCounts } from "@/lib/portal";
import { Badge } from "@/components/ui";
import { fmtDate, money, relTime } from "@/lib/time";

export const metadata = { title: "Hiring portal" };

export default async function TalentPortal() {
  const { u, org, brand } = await requirePortal("talent");
  const rows = clientMandates(u.orgId, brand.id);
  const invoices = org ? mandateInvoices(org.id, brand.id) : [];
  const open = rows.filter((r) => r.m.status === "open");
  const totals = open.map((r) => stageCounts(r.m.id)).reduce((a, c) => ({ s: a.s + c.shortlisted, i: a.i + c.interview, o: a.o + c.offer }), { s: 0, i: 0, o: 0 });
  return (
    <>
      <h1 className="m-0 font-display text-[44px] font-bold tracking-tight">Hi {u.name.split(" ")[0]}, here&apos;s your hiring</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Open roles", open.length],
          ["Shortlisted for you", totals.s],
          ["Interviewing", totals.i],
          ["At offer", totals.o],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-card border border-line bg-card-2 p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-faint">{k}</span>
            <p className="m-0 mt-1 font-display text-4xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 overflow-x-auto rounded-card border border-line bg-card-2">
        <table className="data">
          <thead>
            <tr>
              <th>Role</th>
              <th>Pipeline</th>
              <th>Your recruiter</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, owner }) => {
              const c = stageCounts(m.id);
              const pending = c.shortlisted - c.interview;
              return (
                <tr key={m.id}>
                  <td className="min-w-[240px]">
                    <Link href={`/talent/portal/${m.id}`} className="font-bold">
                      {m.title}
                    </Link>
                    <span className="block text-xs text-muted">
                      {m.locationLabel} · opened {relTime(m.openedAt)}
                      {m.openings > 1 ? ` · ${m.openings} openings` : ""}
                    </span>
                  </td>
                  <td className="min-w-[260px]">
                    <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-[3px] bg-bg-2" aria-hidden="true">
                      {[
                        [c.approached - c.assessed, "bg-ink/25"],
                        [c.assessed - c.shortlisted, "bg-ink/55"],
                        [c.shortlisted - c.offer, "bg-accent"],
                        [c.offer, "bg-[var(--lime)]"],
                      ].map(([n, cls], k) => (Number(n) > 0 ? <span key={k} className={String(cls)} style={{ flex: Number(n) }} /> : null))}
                    </div>
                    <span className="mt-1 block text-xs text-muted">
                      {c.approached} in · {c.assessed} screened · {c.shortlisted} shortlisted · {c.offer} offer
                    </span>
                    {pending > 0 && m.status === "open" && <Badge tone="accent" className="mt-1">{pending} waiting for your feedback</Badge>}
                  </td>
                  <td className="whitespace-nowrap">{owner?.name}</td>
                  <td>
                    <Badge tone={m.status === "open" ? "good" : "neutral"}>{m.status === "filled" ? "Hired" : m.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {invoices.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Invoices</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {invoices.map((i) => (
              <li key={i.id} className="flex flex-wrap justify-between gap-2 rounded-card border border-line bg-card-2 px-5 py-3 text-sm">
                <span>
                  <b>{i.number}</b> · {i.description}
                </span>
                <span>
                  {money(i.amount, i.currency)} · {i.status === "paid" ? `paid ${fmtDate(i.paidAt)}` : i.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
