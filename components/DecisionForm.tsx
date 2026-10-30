"use client";

import { useActionState } from "react";
import { clientDecision } from "@/app/actions/portal";
import { cx } from "./ui";

/** Client's verdict on a presented candidate: meet them, or pass, with an optional note. */
export function DecisionForm({ engagementId, current, meetLabel = "Meet this person", passLabel = "Pass", tone = "gold", who = "partner" }: { engagementId: number; current: string | null; meetLabel?: string; passLabel?: string; tone?: "gold" | "plain"; who?: string }) {
  const [state, action, pending] = useActionState(clientDecision, null);
  const decided = state?.ok ? null : current && current !== "pending" ? current : null;
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="engagementId" value={engagementId} />
      {decided && <p className="m-0 text-sm text-muted">You said: <b className="text-ink">{decided === "interested" ? "meet" : "pass"}</b>. You can change this.</p>}
      <textarea name="note" rows={2} className="field text-sm" placeholder={`A note for your ${who} (optional)`} aria-label={`Note for your ${who}`} />
      <div className="flex flex-wrap gap-2">
        <button
          name="decision"
          value="interested"
          disabled={pending}
          className={cx(
            "min-h-10 px-5 text-sm font-semibold disabled:opacity-60",
            tone === "gold" ? "bg-[linear-gradient(100deg,var(--gold-1),var(--gold-2))] text-[12px] uppercase tracking-[.2em] text-[#0b0d10]" : "rounded-btn bg-primary text-primary-ink",
          )}
        >
          {meetLabel}
        </button>
        <button name="decision" value="declined" disabled={pending} className={cx("min-h-10 border border-line px-5 text-sm font-semibold disabled:opacity-60", tone === "gold" ? "text-[12px] uppercase tracking-[.2em]" : "rounded-btn")}>
          {passLabel}
        </button>
      </div>
      {state?.message && <p role="status" className="m-0 text-sm text-good">{state.message}</p>}
      {state?.error && <p role="alert" className="m-0 text-sm text-bad">{state.error}</p>}
    </form>
  );
}
