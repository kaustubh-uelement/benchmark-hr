import Link from "next/link";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { brandCond } from "@/lib/access";
import { BrandFonts, Avatar, JevMark } from "@/components/ui";
import { BenchmarkMark } from "@/components/marks";
import { ActionButton } from "@/components/client";
import { JevAssistant } from "@/components/JevAssistant";
import { markAllRead } from "@/app/actions/console";
import { jevEngine } from "@/lib/jev/llm";
import { nowTs, relTime } from "@/lib/time";
import { ConsoleNav, ScopeSwitcher } from "./nav";

export const metadata = { title: { default: "Operations console", template: "%s · Benchmark console" } };

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const ctx = await consoleCtx();
  const { u, picked, isGroup, all } = ctx;
  const slug = picked?.slug;
  const scope = (col: Parameters<typeof brandCond>[0]) => brandCond(col, u, ctx.pickedId);

  const newLeads = db.select({ n: sql<number>`count(*)` }).from(s.leads).where(and(eq(s.leads.status, "new"), scope(s.leads.brandId))).get()!.n;
  const lateTickets = db
    .select({ n: sql<number>`count(*)` })
    .from(s.tickets)
    .where(and(inArray(s.tickets.status, ["open", "in_progress"]), isNull(s.tickets.firstResponseAt), lt(s.tickets.slaDueAt, nowTs()), scope(s.tickets.brandId)))
    .get()!.n;
  const proposals = db
    .select({ n: sql<number>`count(*)` })
    .from(s.engagements)
    .where(and(eq(s.engagements.stage, "sourced"), eq(s.engagements.source, "jev"), scope(s.engagements.brandId)))
    .get()!.n;
  const notes = db.select().from(s.notifications).where(eq(s.notifications.userId, u.id)).orderBy(desc(s.notifications.createdAt)).limit(8).all();
  const unread = notes.filter((n) => !n.read).length;

  const show = (...brands: string[]) => isGroup && !slug ? true : brands.includes(slug ?? "");
  const groups = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/console" },
        { label: "Ask Jev", href: "/console/jev/ask" },
      ],
    },
    {
      title: "Work",
      items: [
        { label: "Mandates & roles", href: "/console/mandates", count: proposals },
        { label: "People", href: "/console/people" },
        { label: "Organisations", href: "/console/organisations" },
        { label: "Leads & enquiries", href: "/console/leads", count: newLeads },
        { label: "EOR cases", href: "/console/eor", show: show("exh1b") },
        { label: "Coaching", href: "/console/coaching", show: show("trustcircle") },
        { label: "Deliverables", href: "/console/deliverables", show: show("advisory") },
      ],
    },
    {
      title: "Members",
      items: [
        { label: "Support tickets", href: "/console/tickets", count: lateTickets },
        { label: "Community", href: "/console/community", show: show("exh1b") },
        { label: "Billing", href: "/console/billing" },
      ],
    },
    {
      title: "Platform",
      items: [
        { label: "Jev automations", href: "/console/jev" },
        { label: "Audit log", href: "/console/audit" },
      ],
    },
  ];

  return (
    <div data-theme="console" className="themed">
      <BrandFonts theme="console" />
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[264px_1fr]">
        <aside className="bg-[#142841] text-[#f3eee6] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <input type="checkbox" id="console-menu" className="peer sr-only" aria-label="Show menu" />
          <div className="flex items-center justify-between px-5 py-4 lg:hidden">
            <BenchmarkMark light />
            <label htmlFor="console-menu" className="cursor-pointer rounded-full border border-[#f3eee640] px-3 py-1.5 text-sm font-bold">
              Menu
            </label>
          </div>
          <div className="hidden flex-col gap-6 px-4 pb-6 peer-checked:flex lg:flex lg:pt-6">
              <Link href="/console" className="hidden px-1 no-underline lg:block" aria-label="Console home">
                <BenchmarkMark light />
              </Link>
              {isGroup ? (
                <ScopeSwitcher brands={all.map((b) => ({ slug: b.slug, name: b.name }))} value={slug ?? "all"} />
              ) : (
                <div className="rounded-[12px] bg-[#1d3555] px-3 py-2.5 text-sm">
                  <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-[#8798ae]">Working in</span>
                  <b>{picked?.name}</b>
                </div>
              )}
              <ConsoleNav groups={groups} />
              <div className="mt-2 rounded-[12px] border border-[#2c4566] p-3 text-xs leading-relaxed text-[#b3c0cf]">
                <JevMark engine={jevEngine()} className="mb-1.5 !bg-[#f3eee6]" />
                <br />
                {jevEngine() === "claude" ? "Jev is running on Claude. Every proposal about a person still needs a teammate's approval." : "Jev is on its rules engine. Add ANTHROPIC_API_KEY to switch on Claude drafting and search."}
              </div>
            </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:px-8">
            <form action="/console/jev/ask" className="flex min-w-0 flex-1 items-center">
              <label className="sr-only" htmlFor="jevq">
                Ask Jev
              </label>
              <input id="jevq" name="q" placeholder="Ask Jev: “CFOs in Pune with 15+ years who'd consider a startup”" className="field !min-h-10 max-w-xl !rounded-full !py-2 text-sm" />
            </form>
            <details className="relative">
              <summary className="relative inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full hover:bg-bg-2" aria-label={`Notifications, ${unread} unread`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-accent-ink">{unread}</span>}
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-[min(360px,92vw)] rounded-card border border-line bg-card p-2 shadow-xl">
                <div className="flex items-center justify-between px-2 py-1">
                  <b className="text-sm">Notifications</b>
                  {unread > 0 && (
                    <ActionButton action={markAllRead} className="text-xs font-bold text-accent">
                      Mark all read
                    </ActionButton>
                  )}
                </div>
                {notes.length === 0 && <p className="m-0 p-3 text-sm text-muted">Nothing yet.</p>}
                {notes.map((n) => (
                  <Link key={n.id} href={n.href ?? "#"} className="block rounded-field p-2.5 no-underline hover:bg-bg-2">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {!n.read && <span className="h-2 w-2 flex-none rounded-full bg-accent" />}
                      {n.title}
                    </span>
                    <span className="line-clamp-2 block text-xs text-muted">{n.body}</span>
                    <span className="block text-[11px] text-faint">{relTime(n.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </details>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pr-3 hover:bg-bg-2" aria-label="Account menu">
                <Avatar name={u.name} size={32} />
                <span className="hidden text-sm font-semibold sm:inline">{u.name.split(" ")[0]}</span>
              </summary>
              <div className="absolute right-0 z-30 mt-2 flex w-64 flex-col rounded-card border border-line bg-card p-2 text-sm shadow-xl">
                <span className="px-3 py-2 text-muted">
                  <b className="block text-ink">{u.name}</b>
                  {u.title}
                </span>
                <Link href="/" className="rounded-field px-3 py-2 font-semibold no-underline hover:bg-bg-2">
                  Group website
                </Link>
                <a href="/logout?to=/login" className="rounded-field px-3 py-2 font-semibold text-bad no-underline hover:bg-bg-2">
                  Sign out
                </a>
              </div>
            </details>
          </header>
          <main className="mx-auto max-w-[1320px] px-4 py-7 sm:px-8">{children}</main>
        </div>
      </div>
      <JevAssistant surface="console" />
    </div>
  );
}
