import { Badge } from "./ui";
import { parseTs, relTime } from "@/lib/time";

type T = { status: string; slaDueAt: string | null; slaHours: number | null; firstResponseAt: string | null; createdAt: string; escalated: boolean };

export function slaState(t: T) {
  if (!t.slaDueAt) return { tone: "neutral" as const, label: "No SLA" };
  if (t.firstResponseAt) {
    const took = (parseTs(t.firstResponseAt).getTime() - parseTs(t.createdAt).getTime()) / 3600_000;
    const met = t.firstResponseAt <= t.slaDueAt;
    return { tone: met ? ("good" as const) : ("warn" as const), label: `${met ? "Responded" : "Late response"} in ${took < 1 ? "<1" : Math.round(took)}h` };
  }
  if (["resolved", "closed"].includes(t.status)) return { tone: "neutral" as const, label: "Closed" };
  const overdue = parseTs(t.slaDueAt).getTime() < Date.now();
  return overdue ? { tone: "bad" as const, label: `Overdue · was due ${relTime(t.slaDueAt)}` } : { tone: "warn" as const, label: `Reply due ${relTime(t.slaDueAt)}` };
}

export function SlaBadge({ t }: { t: T }) {
  const s = slaState(t);
  return (
    <Badge tone={s.tone}>
      {t.escalated && !t.firstResponseAt ? "Escalated · " : ""}
      {s.label}
    </Badge>
  );
}

export const STATUS_TONE: Record<string, "good" | "warn" | "neutral" | "accent" | "bad"> = { open: "warn", in_progress: "accent", waiting: "neutral", resolved: "good", closed: "neutral" };
export const PRIORITY_TONE: Record<string, "good" | "warn" | "neutral" | "accent" | "bad"> = { low: "neutral", normal: "neutral", high: "warn", urgent: "bad" };
