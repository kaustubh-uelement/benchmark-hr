import Link from "next/link";
import type { ReactNode } from "react";
import { getUser, homeFor } from "@/lib/auth";
import { cx } from "./ui";

/** Header used by the Talent, TrustCircle and Advisory sites. Each brand's tokens restyle it. */
export async function BrandHeader({ mark, home, nav, cta, login, portal = false, className }: { mark: ReactNode; home: string; nav: [string, string][]; cta: [string, string]; login: string; portal?: boolean; className?: string }) {
  const u = await getUser();
  return (
    <header className={cx("border-b border-line", className)}>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
        <Link href={portal ? `${home}/portal` : home} className="no-underline" aria-label="Home">
          {mark}
        </Link>
        {!portal && (
          <nav aria-label="Main" className="flex flex-wrap gap-x-6 gap-y-1 text-[15px] font-semibold text-muted">
            {nav.map(([l, h]) => (
              <Link key={h} href={h} className="no-underline hover:text-ink">
                {l}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {portal ? (
            <a href={`/logout?to=${home}`} className="inline-flex min-h-10 items-center rounded-btn border-[1.5px] border-line px-4 text-sm font-bold no-underline hover:bg-bg-2">
              Sign out
            </a>
          ) : (
            <>
              <Link href={u ? homeFor(u) : login} className="inline-flex min-h-10 items-center rounded-btn px-3 text-[15px] font-semibold no-underline hover:bg-bg-2">
                {u ? "My portal" : "Sign in"}
              </Link>
              <Link href={cta[1]} className="inline-flex min-h-10 items-center rounded-btn bg-primary px-4 text-[15px] font-bold text-primary-ink no-underline hover:brightness-110">
                {cta[0]}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function BrandFooter({ mark, line, contact, className }: { mark: ReactNode; line: string; contact: string; className?: string }) {
  return (
    <footer className={cx("border-t border-line bg-bg-2", className)}>
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          {mark}
          <p className="m-0 max-w-sm text-sm leading-relaxed text-muted">{line}</p>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <b className="mb-1 text-ink">Contact</b>
          <a href={`mailto:${contact}`} className="no-underline hover:text-ink">
            {contact}
          </a>
          <a href="tel:+918888400044" className="no-underline hover:text-ink">
            +91 88884 00044
          </a>
          <span>Pune, India</span>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-muted">
          <b className="mb-1 text-ink">Benchmark HR Group</b>
          {[
            ["Group", "/"],
            ["Golden Glove Executive Search", "/goldenglove"],
            ["Benchmark Talent", "/talent"],
            ["ExH1B", "/exh1b"],
            ["TrustCircle Outplacements", "/trustcircle"],
            ["Benchmark Advisory", "/advisory"],
          ].map(([l, h]) => (
            <Link key={h} href={h} className="no-underline hover:text-ink">
              {l}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-5 pb-8 text-xs text-faint sm:px-8">© 2026 Benchmark HR Group. Personal data is handled under India&apos;s DPDP Act.</div>
    </footer>
  );
}

export function PortalBar({ name, sub, label }: { name: string; sub: string; label: string }) {
  return (
    <div className="border-b border-line bg-bg-2">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm sm:px-8">
        <span>
          <b>{name}</b> <span className="text-muted">· {sub}</span>
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-accent">{label}</span>
      </div>
    </div>
  );
}
