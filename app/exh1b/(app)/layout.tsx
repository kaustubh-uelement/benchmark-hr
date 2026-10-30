import Link from "next/link";
import { desc, eq, and } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { ExH1BMark } from "@/components/marks";
import { ThemeToggle } from "@/components/client";
import { Avatar } from "@/components/ui";
import { relTime } from "@/lib/time";
import { NavLinks } from "./nav";

export default async function ExAppLayout({ children }: { children: React.ReactNode }) {
  const { user, person } = await requireMember();
  const notes = db.select().from(s.notifications).where(eq(s.notifications.userId, user.id)).orderBy(desc(s.notifications.createdAt)).limit(6).all();
  const unread = db.select().from(s.notifications).where(and(eq(s.notifications.userId, user.id), eq(s.notifications.read, false))).all().length;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2.5 sm:px-6">
          <Link href="/exh1b/dashboard" className="no-underline" aria-label="ExH1B dashboard">
            <ExH1BMark />
          </Link>
          <NavLinks />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <details className="relative">
              <summary className="relative inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-btn hover:bg-bg-2" aria-label={`Notifications, ${unread} unread`}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--marigold)] px-1 text-[10px] font-extrabold text-[#0e2240]">{unread}</span>}
              </summary>
              <div className="absolute right-0 mt-2 w-[min(340px,90vw)] rounded-card border border-line bg-card p-2 shadow-xl">
                {notes.length === 0 && <p className="m-0 p-3 text-sm text-muted">No notifications yet.</p>}
                {notes.map((n) => (
                  <Link key={n.id} href={n.href ?? "#"} className="block rounded-field p-3 no-underline hover:bg-bg-2">
                    <span className="flex items-center gap-2 text-sm font-bold">
                      {!n.read && <span className="h-2 w-2 rounded-full bg-accent" />}
                      {n.title}
                    </span>
                    <span className="block text-xs text-muted">{n.body}</span>
                    <span className="block text-[11px] text-faint">{relTime(n.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </details>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-btn p-1 hover:bg-bg-2" aria-label="Account menu">
                <Avatar name={`${person.firstName} ${person.lastName}`} size={34} />
              </summary>
              <nav aria-label="Account" className="absolute right-0 mt-2 flex w-56 flex-col rounded-card border border-line bg-card p-2 text-sm font-semibold shadow-xl">
                <span className="px-3 py-2 text-xs font-normal text-muted">
                  Signed in as
                  <br />
                  <b className="text-ink">{user.email}</b>
                </span>
                {[
                  ["Profile", "/exh1b/profile"],
                  ["Jobs", "/exh1b/jobs"],
                  ["Billing", "/exh1b/dashboard/billing"],
                  ["Relocation", "/exh1b/relocation"],
                  ["Community", "/exh1b/community"],
                ].map(([l, h]) => (
                  <Link key={h} href={h} className="rounded-field px-3 py-2 no-underline hover:bg-bg-2">
                    {l}
                  </Link>
                ))}
                <a href="/logout?to=/exh1b" className="rounded-field px-3 py-2 text-bad no-underline hover:bg-bg-2">
                  Log out
                </a>
              </nav>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
