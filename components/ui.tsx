import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const FONT_SETS: Record<string, string> = {
  group: "family=Gloock&family=Hanken+Grotesk:wght@400;500;600;700;800",
  console: "family=Gloock&family=Hanken+Grotesk:wght@400;500;600;700;800",
  exh1b: "family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700;800",
  "golden-glove": "family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Jost:wght@300;400;500;600",
  trustcircle: "family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Nunito+Sans:wght@400;600;700;800",
  talent: "family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700",
  advisory: "family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=IBM+Plex+Sans:wght@400;500;600;700",
};

/** Fonts are self-hosted via @fontsource (see app/fonts.ts); kept so layouts can declare which set they use. */
export function BrandFonts({ theme }: { theme: keyof typeof FONT_SETS | string }) {
  void theme;
  return null;
}

type BtnVariant = "primary" | "accent" | "ghost" | "outline" | "danger" | "soft";
const btn = (v: BtnVariant, size: "sm" | "md" | "lg") =>
  cx(
    "inline-flex items-center justify-center gap-2 font-semibold transition-[transform,filter,background] active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none no-underline rounded-btn whitespace-nowrap",
    size === "sm" ? "min-h-9 px-3.5 text-sm" : size === "lg" ? "min-h-13 px-7 text-base" : "min-h-11 px-5 text-[15px]",
    v === "primary" && "bg-primary text-primary-ink hover:brightness-110",
    v === "accent" && "bg-accent text-accent-ink hover:brightness-110",
    v === "ghost" && "text-ink hover:bg-bg-2",
    v === "outline" && "border-[1.5px] border-current text-ink hover:bg-bg-2",
    v === "danger" && "bg-bad text-white hover:brightness-110",
    v === "soft" && "bg-accent-soft text-ink hover:brightness-95",
  );

export function Button({ variant = "primary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return <button {...p} className={cx(btn(variant, size), className)} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, href, ...p }: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return <Link href={href} {...p} className={cx(btn(variant, size), className)} />;
}

export function Card({ className, children, ...p }: ComponentProps<"div">) {
  return (
    <div {...p} className={cx("rounded-card bg-card border border-line", className)}>
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "good" | "warn" | "bad" | "accent" | "dark"; children: ReactNode; className?: string }) {
  const t = {
    neutral: "bg-bg-2 text-muted",
    good: "bg-good-soft text-good",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
    accent: "bg-accent-soft text-accent",
    dark: "bg-primary text-primary-ink",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap", t, className)}>{children}</span>;
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5 text-sm font-semibold", className)}>
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-faint">{hint}</span>}
    </label>
  );
}

export function Input(p: ComponentProps<"input">) {
  return <input {...p} className={cx("field", p.className)} />;
}
export function Textarea(p: ComponentProps<"textarea">) {
  return <textarea rows={4} {...p} className={cx("field", p.className)} />;
}
export function Select({ options, placeholder, ...p }: ComponentProps<"select"> & { options: (string | { value: string | number; label: string })[]; placeholder?: string }) {
  return (
    <select {...p} className={cx("field", p.className)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  );
}

export function ChipCheck({ name, value, label, checked, type = "checkbox" }: { name: string; value: string; label: string; checked?: boolean; type?: "checkbox" | "radio" }) {
  return (
    <label className="chip-check relative inline-flex">
      <input type={type} name={name} value={value} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "bad" | "good" | "warn" }) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-faint">{label}</span>
      <span className={cx("font-display text-3xl leading-none", tone === "bad" && "text-bad", tone === "good" && "text-good", tone === "warn" && "text-warn")}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </Card>
  );
}

export function Progress({ value, className, tone = "accent" }: { value: number; className?: string; tone?: "accent" | "good" | "primary" }) {
  return (
    <div className={cx("h-2 rounded-full bg-bg-2 overflow-hidden", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("h-full rounded-full transition-[width] duration-700", tone === "good" ? "bg-good" : tone === "primary" ? "bg-primary" : "bg-accent")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden="true"
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${h} 32% 38%)` }}
    >
      {initials}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line p-8 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children, className }: { eyebrow?: string; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {eyebrow && <span className="text-[13px] font-bold uppercase tracking-[.12em] text-accent">{eyebrow}</span>}
      <h2 className="font-display text-3xl sm:text-4xl leading-[1.08] m-0">{title}</h2>
      {children && <p className="text-muted text-base sm:text-lg leading-relaxed max-w-2xl m-0">{children}</p>}
    </div>
  );
}

export function JevMark({ className, engine }: { className?: string; engine?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent", className)} title={engine === "claude" ? "Jev, running on Claude" : "Jev rules engine"}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
        <path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1z" />
      </svg>
      Jev{engine ? ` · ${engine === "claude" ? "Claude" : "rules"}` : ""}
    </span>
  );
}

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score}% match`}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={score >= 75 ? "var(--good)" : score >= 55 ? "var(--accent)" : "var(--warn)"} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="absolute text-[13px] font-extrabold">{score}%</span>
    </span>
  );
}

export function Notice({ tone = "neutral", title, children }: { tone?: "neutral" | "warn" | "good" | "bad" | "accent"; title?: string; children: ReactNode }) {
  const t = { neutral: "bg-bg-2", warn: "bg-warn-soft", good: "bg-good-soft", bad: "bg-bad-soft", accent: "bg-accent-soft" }[tone];
  return (
    <div className={cx("rounded-card px-4 py-3 text-sm leading-relaxed", t)} role="note">
      {title && <strong className="block mb-0.5">{title}</strong>}
      {children}
    </div>
  );
}

export const STAGE_LABEL: Record<string, string> = {
  matched: "Matched",
  saved: "Saved",
  applied: "Applied",
  sourced: "Sourced",
  screening: "Screening",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  placed: "Placed",
  enrolled: "Enrolled",
  rejected: "Not progressing",
  withdrawn: "Withdrawn",
};

export function StageBadge({ stage }: { stage: string }) {
  const tone = (["placed", "offer"].includes(stage) ? "good" : ["interview", "shortlisted"].includes(stage) ? "accent" : ["rejected", "withdrawn"].includes(stage) ? "bad" : "neutral") as "good";
  return <Badge tone={tone}>{STAGE_LABEL[stage] ?? stage}</Badge>;
}
