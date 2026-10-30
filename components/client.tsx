"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cx } from "./ui";

export function SubmitButton({ children, className, variant = "primary", size = "md", pendingText }: { children: React.ReactNode; className?: string; variant?: "primary" | "accent" | "outline" | "ghost" | "soft"; size?: "sm" | "md" | "lg"; pendingText?: string }) {
  const { pending } = useFormStatus();
  const v = {
    primary: "bg-primary text-primary-ink hover:brightness-110",
    accent: "bg-accent text-accent-ink hover:brightness-110",
    outline: "border-[1.5px] border-current text-ink hover:bg-bg-2",
    ghost: "text-ink hover:bg-bg-2",
    soft: "bg-accent-soft text-ink",
  }[variant];
  const s = size === "sm" ? "min-h-9 px-3.5 text-sm" : size === "lg" ? "min-h-13 px-7 text-base" : "min-h-11 px-5 text-[15px]";
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cx("inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition disabled:opacity-60", v, s, className)}>
      {pending && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

/** A form wired to a server action with inline success/error feedback. */
export function ActionForm({ action, children, className, resetOnSuccess = true }: { action: (s: FormState, f: FormData) => Promise<FormState>; children: React.ReactNode; className?: string; resetOnSuccess?: boolean }) {
  const [state, formAction] = useActionState(action, null);
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) setKey((k) => k + 1);
  }, [state, resetOnSuccess]);
  return (
    <form key={key} action={formAction} className={className}>
      {children}
      {state?.error && (
        <p role="alert" className="mt-2 rounded-field bg-bad-soft px-3 py-2 text-sm font-semibold text-bad">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p role="status" className="mt-2 rounded-field bg-good-soft px-3 py-2 text-sm font-semibold text-good">
          {state.message}
        </p>
      )}
    </form>
  );
}

/** Calls a server action without a form (toggles, quick buttons). */
export function ActionButton({ action, children, className, title, confirm: confirmText }: { action: () => Promise<unknown>; children: React.ReactNode; className?: string; title?: string; confirm?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          await action();
        });
      }}
      className={cx("disabled:opacity-60", className)}
    >
      {children}
    </button>
  );
}

export function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  useEffect(() => {
    let m: string | null = null;
    try {
      m = localStorage.getItem("exh1b-mode");
    } catch {}
    const v = m === "dark" ? "dark" : "light";
    setMode(v);
    document.querySelectorAll('[data-theme="exh1b"]').forEach((el) => el.setAttribute("data-mode", v));
  }, []);
  const flip = () => {
    const v = mode === "dark" ? "light" : "dark";
    setMode(v);
    try {
      localStorage.setItem("exh1b-mode", v);
    } catch {}
    document.querySelectorAll('[data-theme="exh1b"]').forEach((el) => el.setAttribute("data-mode", v));
  };
  return (
    <button type="button" onClick={flip} aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="inline-flex h-10 w-10 items-center justify-center rounded-btn hover:bg-bg-2">
      {mode === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

/** Country → state → city picker backed by the world directory in the database. */
export function LocationPicker({ countries, defaults, names = { country: "countryCode", state: "stateId", city: "cityId" } }: { countries: { code: string; name: string }[]; defaults?: { country?: string | null; state?: number | null; city?: number | null; cityText?: string | null }; names?: { country: string; state: string; city: string } }) {
  const [country, setCountry] = useState(defaults?.country ?? "");
  const [state, setState] = useState<string>(defaults?.state ? String(defaults.state) : "");
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [city, setCity] = useState<string>(defaults?.city ? String(defaults.city) : "");
  useEffect(() => {
    if (!country) return setStates([]);
    fetch(`/api/geo?country=${country}`)
      .then((r) => r.json())
      .then((d) => setStates(d.states ?? []));
  }, [country]);
  useEffect(() => {
    if (!state) return setCities([]);
    fetch(`/api/geo?state=${state}`)
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []));
  }, [state]);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Country
        <select
          className="field"
          name={names.country}
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setState("");
            setCity("");
          }}
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        State / region
        <select className="field" name={names.state} value={state} onChange={(e) => (setState(e.target.value), setCity(""))} disabled={!states.length}>
          <option value="">{states.length ? "Select state" : country ? "Not listed — type city" : "Choose a country first"}</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {cities.length ? (
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          City
          <select className="field" name={names.city} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          City
          <input className="field" name="cityText" defaultValue={defaults?.cityText ?? ""} placeholder="City" />
        </label>
      )}
    </div>
  );
}

/** Family → role picker for the job taxonomy. */
export function RolePicker({ families, defaults }: { families: { id: number; name: string; roles: { id: number; name: string }[] }[]; defaults?: { family?: number | null; role?: number | null } }) {
  const [fam, setFam] = useState(defaults?.family ? String(defaults.family) : "");
  const roles = families.find((f) => String(f.id) === fam)?.roles ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Job family
        <select className="field" name="familyId" value={fam} onChange={(e) => setFam(e.target.value)}>
          <option value="">Select a job family</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Target role
        <select className="field" name="roleId" defaultValue={defaults?.role ?? ""} disabled={!roles.length}>
          <option value="">{roles.length ? "Select a role" : "Choose a family first"}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function CostOfLiving({ rows }: { rows: { city: string; rent1bhk: number; rent2bhk: number; groceries: number; transport: number; utilities: number; dining: number }[] }) {
  const [a, setA] = useState(rows[2]?.city ?? rows[0].city);
  const [b, setB] = useState(rows[0].city);
  const [size, setSize] = useState<"1" | "2">("2");
  const A = rows.find((r) => r.city === a)!;
  const B = rows.find((r) => r.city === b)!;
  const lines = [
    ["Rent", size === "1" ? "rent1bhk" : "rent2bhk"],
    ["Groceries", "groceries"],
    ["Transport", "transport"],
    ["Utilities", "utilities"],
    ["Dining out", "dining"],
  ] as const;
  const total = (r: typeof A) => lines.reduce((t, [, k]) => t + r[k], 0);
  const max = Math.max(...lines.map(([, k]) => Math.max(A[k], B[k])));
  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          City A
          <select className="field" value={a} onChange={(e) => setA(e.target.value)}>
            {rows.map((r) => (
              <option key={r.city}>{r.city}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          City B
          <select className="field" value={b} onChange={(e) => setB(e.target.value)}>
            {rows.map((r) => (
              <option key={r.city}>{r.city}</option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1.5 text-sm font-semibold">
          <legend className="mb-1.5">Home</legend>
          <div className="flex gap-2">
            {(["1", "2"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setSize(v)} aria-pressed={size === v} className={cx("min-h-11 flex-1 rounded-btn border-[1.5px] font-bold", size === v ? "border-primary bg-primary text-primary-ink" : "border-line")}>
                {v}BHK
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex flex-col gap-3">
        {lines.map(([label, k]) => (
          <div key={k} className="grid grid-cols-[90px_1fr] items-center gap-3 text-sm sm:grid-cols-[110px_1fr]">
            <span className="font-semibold">{label}</span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-full bg-accent" style={{ width: `${(A[k] / max) * 100}%`, minWidth: 6 }} />
                <span className="tabular-nums text-xs text-muted whitespace-nowrap">{fmt(A[k])}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 rounded-full" style={{ width: `${(B[k] / max) * 100}%`, minWidth: 6, background: "var(--marigold, var(--warn))" }} />
                <span className="tabular-nums text-xs text-muted whitespace-nowrap">{fmt(B[k])}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-bg-2 px-4 py-3 text-sm">
        <span>
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent align-middle" /> <b>{a}</b> {fmt(total(A))}/month
        </span>
        <span>
          <span className="inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: "var(--marigold, var(--warn))" }} /> <b>{b}</b> {fmt(total(B))}/month
        </span>
        <span className="font-bold">{total(A) === total(B) ? "Same cost" : `${total(A) < total(B) ? a : b} is ${Math.round((Math.abs(total(A) - total(B)) / Math.max(total(A), total(B))) * 100)}% cheaper`}</span>
      </div>
      <p className="m-0 text-xs text-faint">Indicative monthly costs for one professional household. Update with a live data feed before launch.</p>
    </div>
  );
}

export function CopyBox({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      <pre className="m-0 whitespace-pre-wrap rounded-field border border-line bg-card-2 p-3 text-sm leading-relaxed">{text}</pre>
      <button
        type="button"
        className="absolute right-2 top-2 rounded-btn bg-primary px-2.5 py-1 text-xs font-bold text-primary-ink"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(() => setDone(true));
          setTimeout(() => setDone(false), 1600);
        }}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
