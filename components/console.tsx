import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND_COLORS } from "@/lib/content/brands";
import { cx } from "./ui";

export function PageHead({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-[13px] font-bold text-accent">{eyebrow}</div>}
        <h1 className="m-0 font-display text-[34px] font-normal leading-tight">{title}</h1>
        {sub && <p className="m-0 mt-1 max-w-3xl text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function BrandChip({ slug, name, className }: { slug: string; name: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card-2 px-2 py-0.5 text-xs font-bold", className)}>
      <span className="h-2 w-2 rounded-full" style={{ background: BRAND_COLORS[slug] ?? "#798da6" }} aria-hidden="true" />
      {name}
    </span>
  );
}

/** Single-series horizontal bar list with direct labels (magnitude, one hue). */
export function BarList({ rows, format = (n) => String(n), unit }: { rows: { label: ReactNode; value: number; href?: string; title?: string }[]; format?: (n: number) => string; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {rows.map((r, i) => {
        const inner = (
          <>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-semibold">{r.label}</span>
              <span className="tabular-nums text-muted">
                {format(r.value)}
                {unit ? ` ${unit}` : ""}
              </span>
            </span>
            <span className="mt-1 block h-2 rounded-full bg-bg-2">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(r.value ? 2 : 0, (r.value / max) * 100)}%` }} />
            </span>
          </>
        );
        return (
          <li key={i} title={r.title ?? `${format(r.value)}${unit ? ` ${unit}` : ""}`}>
            {r.href ? (
              <Link href={r.href} className="block rounded-field no-underline hover:opacity-80">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Panel({ title, action, children, className, pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx("min-w-0 rounded-card border border-line bg-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="m-0 font-display text-[19px] font-normal">{title}</h2>
          {action}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Tabs({ items, active }: { items: { key: string; label: ReactNode; href: string }[]; active: string }) {
  return (
    <nav className="scroll-x mb-5 flex gap-1 border-b border-line" aria-label="Filter">
      {items.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? "page" : undefined} className={cx("-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold no-underline", t.key === active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-sm">
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-faint">{k}</dt>
          <dd className="m-0 min-w-0 break-words font-medium">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
