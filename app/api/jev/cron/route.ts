import { NextResponse } from "next/server";
import { and, eq, lt } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { emit } from "@/lib/jev/engine";
import { nowTs } from "@/lib/time";

/**
 * Scheduled Jev work. Call hourly from any scheduler (cron, EventBridge,
 * GitHub Actions) with the header  x-cron-secret: $JEV_CRON_SECRET.
 *  - SLA sweep: escalates tickets past their response target
 *  - lapse check: marks expired ExH1B subscriptions and sends the win-back nudge
 */
export async function POST(req: Request) {
  const secret = process.env.JEV_CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  await emit({ type: "schedule.hourly" });
  const lapsed = db.select().from(s.subscriptions).where(and(eq(s.subscriptions.status, "active"), lt(s.subscriptions.currentPeriodEnd, nowTs()))).all();
  for (const sub of lapsed) {
    db.update(s.subscriptions).set({ status: "expired" }).where(eq(s.subscriptions.id, sub.id)).run();
    await emit({ type: "subscription.lapsed", personId: sub.personId });
  }
  return NextResponse.json({ ok: true, lapsed: lapsed.length, at: nowTs() });
}

export const GET = POST;
