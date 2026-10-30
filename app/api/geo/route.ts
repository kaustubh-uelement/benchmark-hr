import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const country = u.searchParams.get("country");
  const state = u.searchParams.get("state");
  if (country) {
    const states = db.select({ id: s.states.id, name: s.states.name }).from(s.states).where(eq(s.states.countryCode, country)).orderBy(asc(s.states.name)).all();
    return NextResponse.json({ states });
  }
  if (state) {
    const cities = db.select({ id: s.cities.id, name: s.cities.name }).from(s.cities).where(eq(s.cities.stateId, Number(state))).orderBy(asc(s.cities.name)).all();
    return NextResponse.json({ cities });
  }
  return NextResponse.json({ error: "Pass ?country=XX or ?state=ID" }, { status: 400 });
}
