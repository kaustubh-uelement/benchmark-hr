"use client";

import { useActionState, useTransition } from "react";
import { CopyBox, type FormState } from "./client";
import { cx } from "./ui";

/** A select that runs a server action on change (stage moves, statuses, assignees). */
export function ActionSelect({ value, options, onPick, label, className }: { value: string; options: { value: string; label: string }[]; onPick: (v: string) => Promise<unknown>; label: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={label}
      value={value}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        start(async () => {
          await onPick(v);
        });
      }}
      className={cx("field !min-h-8 !rounded-full !py-1 !pl-3 text-xs font-bold", pending && "opacity-60", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Button that asks Jev for a draft and shows it in a copyable box. */
export function JevDraft({ action, fields, label = "Draft with Jev", className }: { action: (s: FormState, f: FormData) => Promise<FormState>; fields: Record<string, string | number>; label?: string; className?: string }) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      <form action={run}>
        {Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button type="submit" disabled={pending} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-bold text-accent disabled:opacity-60">
          <span aria-hidden="true">✦</span>
          {pending ? "Jev is writing…" : state?.ok ? "Redraft" : label}
        </button>
      </form>
      {state?.ok && state.message && <CopyBox text={state.message} />}
      {state?.error && <p className="m-0 text-xs text-bad">{state.error}</p>}
    </div>
  );
}
