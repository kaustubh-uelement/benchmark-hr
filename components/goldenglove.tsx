import Link from "next/link";
import { GoldenGloveMark } from "./marks";
import { getUser, homeFor } from "@/lib/auth";

export async function GGHeader({ portal = false }: { portal?: boolean }) {
  const u = await getUser();
  return (
    <header className="relative z-10 border-b border-line">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-5 sm:px-10">
        <Link href={portal ? "/goldenglove/portal" : "/goldenglove"} className="no-underline" aria-label="Golden Glove home">
          <GoldenGloveMark />
        </Link>
        {!portal && (
          <nav aria-label="Main" className="hidden flex-wrap gap-x-8 md:flex gap-y-2 text-[13px] font-medium uppercase tracking-[.2em] text-muted">
            <a href="#practice" className="no-underline hover:text-[var(--gold-1)]">Practice</a>
            <a href="#method" className="no-underline hover:text-[var(--gold-1)]">Method</a>
            <a href="#appointments" className="no-underline hover:text-[var(--gold-1)]">Appointments</a>
            <a href="#leaders" className="no-underline hover:text-[var(--gold-1)]">For leaders</a>
          </nav>
        )}
        <div className="flex items-center gap-3">
          <Link href={u ? homeFor(u) : "/goldenglove/login"} className="text-[13px] font-medium uppercase tracking-[.2em] text-muted no-underline hover:text-[var(--gold-1)]">
            {u ? (portal ? "" : "Client portal") : "Client sign in"}
          </Link>
          {portal ? (
            <a href="/logout?to=/goldenglove" className="inline-flex min-h-10 items-center border border-[var(--gold-2)] px-4 text-[12px] font-medium uppercase tracking-[.22em] text-[var(--gold-1)] no-underline hover:bg-[var(--accent-soft)]">
              Sign out
            </a>
          ) : (
            <a href="#brief" className="inline-flex min-h-11 items-center bg-[linear-gradient(100deg,var(--gold-1),var(--gold-2))] px-5 text-[12.5px] font-semibold uppercase tracking-[.22em] text-[#0b0d10] no-underline hover:brightness-110">
              Brief a partner
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

export function GGRule({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`h-px bg-[linear-gradient(90deg,transparent,var(--gold-2),transparent)] ${className}`} />;
}

export function GGEyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] font-medium uppercase tracking-[.32em] text-[var(--gold-2)]">{children}</span>;
}

export function GGFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <GoldenGloveMark />
          <p className="m-0 max-w-sm text-sm leading-relaxed text-muted">Retained executive search for boards, founders and investors. A Benchmark HR Group company, Pune · Mumbai · Bengaluru · Gurugram.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <span className="mb-1 text-[12px] uppercase tracking-[.28em] text-[var(--gold-2)]">Contact</span>
          <a href="mailto:partners@goldenglove.in" className="no-underline hover:text-ink">partners@goldenglove.in</a>
          <a href="tel:+918888400044" className="no-underline hover:text-ink">+91 88884 00044</a>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <span className="mb-1 text-[12px] uppercase tracking-[.28em] text-[var(--gold-2)]">Group</span>
          <Link href="/" className="no-underline hover:text-ink">Benchmark HR Group</Link>
          <Link href="/talent" className="no-underline hover:text-ink">Benchmark Talent</Link>
          <Link href="/exh1b" className="no-underline hover:text-ink">ExH1B</Link>
          <Link href="/trustcircle" className="no-underline hover:text-ink">TrustCircle</Link>
          <Link href="/advisory" className="no-underline hover:text-ink">Benchmark Advisory</Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-5 pb-8 text-xs text-faint sm:px-10">© 2026 Golden Glove Executive Search · Benchmark HR Group. Candidate information is held in confidence under India&apos;s DPDP Act.</div>
    </footer>
  );
}
