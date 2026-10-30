import "server-only";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "./db";
import { getUser, homeFor, isStaff } from "./auth";
import { brandBySlug } from "./content/brands";

/**
 * Client and participant portals. A client sees only their own
 * organisation's mandates in the brand they signed up with; a participant
 * sees only their own record.
 */
export async function requirePortal(brandSlug: string, roles: ("client" | "participant" | "candidate")[] = ["client"]) {
  const base = brandBySlug(brandSlug)!.base;
  const u = await getUser();
  if (!u) redirect(`${base}/login`);
  if (isStaff(u)) redirect("/console");
  if (u.brandSlug !== brandSlug || !roles.includes(u.role as "client")) redirect(homeFor(u));
  const org = u.orgId ? db.select().from(s.organisations).where(eq(s.organisations.id, u.orgId)).get() ?? null : null;
  const person = u.personId ? db.select().from(s.people).where(eq(s.people.id, u.personId)).get() ?? null : null;
  const brand = db.select().from(s.brands).where(eq(s.brands.slug, brandSlug)).get()!;
  return { u, org, person, brand };
}

export function clientMandates(orgId: number | null, brandId: number) {
  if (!orgId) return [];
  return db
    .select({ m: s.mandates, owner: s.users })
    .from(s.mandates)
    .leftJoin(s.users, eq(s.users.id, s.mandates.ownerUserId))
    .where(and(eq(s.mandates.orgId, orgId), eq(s.mandates.brandId, brandId)))
    .orderBy(desc(s.mandates.openedAt))
    .all();
}

export function clientMandate(orgId: number | null, brandId: number, mandateId: number) {
  const m = db.select().from(s.mandates).where(and(eq(s.mandates.id, mandateId), eq(s.mandates.brandId, brandId))).get();
  if (!m || !orgId || m.orgId !== orgId) return null;
  return m;
}

/** Candidates a client is allowed to see: the presented shortlist onwards. */
export const CLIENT_VISIBLE = ["shortlisted", "interview", "offer", "placed"] as const;

export function presented(mandateId: number) {
  return db
    .select({ e: s.engagements, p: s.people })
    .from(s.engagements)
    .innerJoin(s.people, eq(s.people.id, s.engagements.personId))
    .where(and(eq(s.engagements.mandateId, mandateId), inArray(s.engagements.stage, [...CLIENT_VISIBLE])))
    .orderBy(desc(s.engagements.matchScore))
    .all();
}

export function stageCounts(mandateId: number) {
  const rows = db.select({ stage: s.engagements.stage }).from(s.engagements).where(eq(s.engagements.mandateId, mandateId)).all();
  const c = (st: string[]) => rows.filter((r) => st.includes(r.stage)).length;
  return {
    total: rows.length,
    approached: c(["sourced", "screening", "applied", "shortlisted", "interview", "offer", "placed", "rejected", "withdrawn"]),
    assessed: c(["screening", "shortlisted", "interview", "offer", "placed"]),
    shortlisted: c(["shortlisted", "interview", "offer", "placed"]),
    interview: c(["interview", "offer", "placed"]),
    offer: c(["offer", "placed"]),
    placed: c(["placed"]),
  };
}

export function mandateInvoices(orgId: number, brandId: number) {
  return db.select().from(s.invoices).where(and(eq(s.invoices.orgId, orgId), eq(s.invoices.brandId, brandId))).orderBy(desc(s.invoices.id)).all();
}

export const SEARCH_STAGES = ["Brief", "Map", "Approach", "Assess", "Shortlist", "Appoint", "Settle in"];
export function searchStage(c: ReturnType<typeof stageCounts>, status: string) {
  if (status === "filled" || c.placed) return 6;
  if (c.offer) return 5;
  if (c.shortlisted) return 4;
  if (c.assessed) return 3;
  if (c.approached) return 2;
  if (c.total) return 1;
  return 0;
}

