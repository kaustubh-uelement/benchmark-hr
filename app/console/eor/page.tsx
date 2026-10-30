import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { EOR_STEPS } from "@/lib/db/schema";
import { Badge, JevMark } from "@/components/ui";
import { ActionButton } from "@/components/client";
import { PageHead } from "@/components/console";
import { moveEor } from "@/app/actions/console";
import { money, relTime } from "@/lib/time";
import { notFound } from "next/navigation";

export const metadata = { title: "EOR cases" };

export default async function Eor() {
  const ctx = await consoleCtx();
  const ex = ctx.all.find((b) => b.slug === "exh1b")!;
  if (!ctx.isGroup && ctx.pickedId !== ex.id) notFound();
  const rows = db
    .select({ c: s.eorCases, p: s.people, org: s.organisations.name, lead: s.leads })
    .from(s.eorCases)
    .innerJoin(s.people, eq(s.people.id, s.eorCases.personId))
    .leftJoin(s.organisations, eq(s.organisations.id, s.eorCases.employerOrgId))
    .leftJoin(s.leads, eq(s.leads.id, s.eorCases.leadId))
    .orderBy(desc(s.eorCases.createdAt))
    .all();
  const active = rows.filter((r) => EOR_STEPS[r.c.step] === "Active");
  const arr = active.reduce((a, r) => a + (r.c.monthlyFee ?? 0) * 12, 0);
  return (
    <>
      <PageHead
        eyebrow="ExH1B · Employer of Record"
        title="EOR cases"
        sub={`Members who want to keep their current employer from India. Jev opens a case the moment a member says Yes in profile step 4. ${active.length} live, ${money(arr, "USD", true)} annual run-rate.`}
        actions={<JevMark />}
      />
      <div className="scroll-x">
        <div className="grid min-w-[1100px] grid-cols-6 gap-3">
          {EOR_STEPS.map((step, i) => {
            const col = rows.filter((r) => r.c.step === i);
            return (
              <section key={step} className="flex flex-col gap-2 rounded-card bg-bg-2 p-2.5" aria-label={step}>
                <header className="flex items-center justify-between px-1 pt-1 text-xs font-bold uppercase tracking-wider text-faint">
                  {i + 1}. {step}
                  <span>{col.length}</span>
                </header>
                {col.map(({ c, p, org, lead }) => (
                  <article key={c.id} className="flex flex-col gap-1.5 rounded-[12px] border border-line bg-card-2 p-3 text-sm">
                    <Link href={`/console/people/${p.id}`} className="font-bold no-underline hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                    <span className="text-xs text-muted">
                      {p.currentTitle}
                      <br />
                      {org ?? p.currentCompany ?? "Employer not linked"} · from {p.countryCode}
                    </span>
                    {c.monthlyFee ? <span className="text-xs font-semibold">{money(c.monthlyFee, c.currency ?? "USD")}/mo</span> : null}
                    {lead && (
                      <Link href={`/console/leads?id=${lead.id}`} className="text-xs">
                        Lead · <Badge tone={lead.status === "won" ? "good" : "accent"}>{lead.status}</Badge>
                      </Link>
                    )}
                    <span className="text-[11px] text-faint">opened {relTime(c.createdAt)}</span>
                    <span className="mt-1 flex gap-1.5">
                      {i > 0 && (
                        <ActionButton action={moveEor.bind(null, c.id, -1)} className="rounded-full border border-line px-2.5 py-1 text-xs font-bold" title="Move back">
                          ←
                        </ActionButton>
                      )}
                      {i < EOR_STEPS.length - 1 && (
                        <ActionButton action={moveEor.bind(null, c.id, 1)} className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-ink">
                          {EOR_STEPS[i + 1]} →
                        </ActionButton>
                      )}
                    </span>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
