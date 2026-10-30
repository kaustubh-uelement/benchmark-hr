import "server-only";
import { and, eq, inArray, or, sql, type SQL, type Column } from "drizzle-orm";
import { db, schema as s } from "./db";
import type { SessionUser } from "./auth";

/**
 * Brand-level access, enforced in the query layer (not just the UI).
 *
 *  group_admin            → every brand
 *  brand_admin, recruiter → their own brand's records, plus people from other
 *                           brands who granted the "group_sharing" consent
 *  client                 → their organisation's mandates only
 *  candidate/participant  → their own person record only
 */
export function staffBrandIds(u: SessionUser): number[] | null {
  if (u.role === "group_admin") return null;
  return u.brandId ? [u.brandId] : [];
}

/** Condition for any table with a brand_id column, optionally narrowed to one brand the user picked. */
export function brandCond(col: Column, u: SessionUser, pickedBrandId?: number | null): SQL | undefined {
  const allowed = staffBrandIds(u);
  if (pickedBrandId) {
    if (allowed && !allowed.includes(pickedBrandId)) return sql`0`;
    return eq(col, pickedBrandId);
  }
  if (!allowed) return undefined;
  return allowed.length ? inArray(col, allowed) : sql`0`;
}

/** People a staff user may see. */
export function peopleCond(u: SessionUser, pickedBrandId?: number | null): SQL | undefined {
  const allowed = staffBrandIds(u);
  const tagged = (ids: number[]) =>
    sql`exists (select 1 from person_brands pb where pb.person_id = ${s.people.id} and pb.brand_id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)}))`;
  const shared = sql`exists (select 1 from consents c where c.person_id = ${s.people.id} and c.purpose = 'group_sharing' and c.granted = 1)`;
  if (pickedBrandId) {
    // another brand's people: only those who agreed to group sharing
    if (allowed && !allowed.includes(pickedBrandId)) return and(tagged([pickedBrandId]), shared);
    return tagged([pickedBrandId]);
  }
  if (!allowed) return undefined;
  if (!allowed.length) return shared;
  return or(tagged(allowed), shared);
}

export function canSeePerson(u: SessionUser, personId: number) {
  if (u.role === "group_admin") return true;
  if (u.role === "candidate" || u.role === "participant") return u.personId === personId;
  if (u.role === "client") {
    // clients see people only through their own mandates' shortlists
    const r = db
      .select({ id: s.engagements.id })
      .from(s.engagements)
      .innerJoin(s.mandates, eq(s.mandates.id, s.engagements.mandateId))
      .where(and(eq(s.engagements.personId, personId), eq(s.mandates.orgId, u.orgId ?? -1)))
      .get();
    return !!r;
  }
  const c = peopleCond(u);
  return !!db.select({ id: s.people.id }).from(s.people).where(and(eq(s.people.id, personId), c)).get();
}

export function canSeeMandate(u: SessionUser, m: { brandId: number; orgId: number | null }) {
  if (u.role === "group_admin") return true;
  if (u.role === "client") return m.orgId === u.orgId;
  if (u.role === "brand_admin" || u.role === "recruiter") return m.brandId === u.brandId;
  return false;
}
