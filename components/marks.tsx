/** Brand marks — simple geometric wordmarks until official logo files are supplied. */

export function BenchmarkMark({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const c = light ? "#f3eee6" : "#142841";
  return (
    <span className="inline-flex items-center gap-3 no-underline" style={{ color: c }}>
      <svg width="38" height="38" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="19.5" fill="none" stroke={c} strokeWidth="1.5" />
        <circle cx="21" cy="21" r="13.5" fill="none" stroke={c} strokeWidth="1" opacity=".45" />
        <rect x="16" y="16" width="10" height="10" transform="rotate(45 21 21)" fill={light ? "#e5ded2" : "#490b1a"} />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[23px] tracking-[.05em]">BENCHMARK</span>
          <span className="mt-1.5 text-[10px] font-bold tracking-[.42em]" style={{ color: light ? "#b3c0cf" : "#4a5970" }}>
            HR GROUP
          </span>
        </span>
      )}
    </span>
  );
}

export function ShortlistPill({ accent = "#490b1a", ring = "#e5ded2" }: { accent?: string; ring?: string }) {
  return (
    <span aria-hidden="true" className="relative -top-[.06em] mx-[.06em] inline-flex h-[.78em] items-center rounded-full px-[.12em] align-middle" style={{ background: ring }}>
      <span className="inline-block h-[.58em] w-[.58em] rounded-full" style={{ background: "#798da6", border: `3px solid ${ring}` }} />
      <span className="-ml-[.2em] inline-block h-[.58em] w-[.58em] rounded-full" style={{ background: "#142841", border: `3px solid ${ring}` }} />
      <span className="-ml-[.2em] inline-block h-[.58em] w-[.58em] rounded-full" style={{ background: accent, border: `3px solid ${ring}` }} />
    </span>
  );
}

export function GoldenGloveMark() {
  return (
    <span className="inline-flex items-center gap-3">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e8d6ad" />
            <stop offset=".55" stopColor="#b8913f" />
            <stop offset="1" stopColor="#7a5c1f" />
          </linearGradient>
        </defs>
        <circle cx="17" cy="17" r="15.5" fill="none" stroke="url(#gg)" strokeWidth="1.4" />
        <path d="M17 6 L20.5 14.5 L28 17 L20.5 19.5 L17 28 L13.5 19.5 L6 17 L13.5 14.5 Z" fill="url(#gg)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[22px] font-semibold tracking-[.18em] text-ink">GOLDEN GLOVE</span>
        <span className="mt-1 text-[9.5px] font-medium tracking-[.38em] text-muted">EXECUTIVE SEARCH</span>
      </span>
    </span>
  );
}

export function ExH1BMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="var(--primary)" />
        <path d="M7 23 C 12 9, 22 9, 27 17" fill="none" stroke="var(--marigold)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="7" cy="23" r="2.6" fill="var(--accent)" />
        <circle cx="27" cy="17" r="2.6" fill="var(--marigold)" />
      </svg>
      <span className="font-display text-[21px] font-extrabold tracking-tight">
        Ex<span className="text-accent">H1B</span>
      </span>
    </span>
  );
}

export function TrustCircleMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <circle cx="13" cy="17" r="9" fill="none" stroke="var(--primary)" strokeWidth="2.2" />
        <circle cx="21" cy="17" r="9" fill="none" stroke="var(--accent)" strokeWidth="2.2" />
      </svg>
      <span className="font-display text-[22px] font-semibold">TrustCircle</span>
    </span>
  );
}

export function TalentMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-ink font-display text-[15px] font-bold text-white" aria-hidden="true">
        bt
      </span>
      <span className="font-display text-[20px] font-bold tracking-tight">
        benchmark<span className="text-accent">/</span>talent
      </span>
    </span>
  );
}

export function AdvisoryMark() {
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="font-display text-[24px] font-medium">Benchmark Advisory</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[.3em] text-muted">People · Policy · Compliance</span>
    </span>
  );
}
