import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "./db";

export const brandRow = (slug: string) => db.select().from(s.brands).where(eq(s.brands.slug, slug)).get()!;
export const brandMap = () => Object.fromEntries(db.select().from(s.brands).all().map((b) => [b.id, b]));

export const countriesList = () => db.select({ code: s.countries.code, name: s.countries.name }).from(s.countries).orderBy(asc(s.countries.name)).all();

export function familiesWithRoles() {
  const fams = db.select().from(s.jobFamilies).orderBy(asc(s.jobFamilies.name)).all();
  const roles = db.select().from(s.jobRoles).all();
  return fams.map((f) => ({ id: f.id, name: f.name, slug: f.slug, roles: roles.filter((r) => r.familyId === f.id).map((r) => ({ id: r.id, name: r.name })) }));
}

export const indiaCities = () =>
  db
    .select({ id: s.cities.id, name: s.cities.name, state: s.states.name })
    .from(s.cities)
    .innerJoin(s.states, eq(s.states.id, s.cities.stateId))
    .where(eq(s.cities.countryCode, "IN"))
    .orderBy(asc(s.states.name), asc(s.cities.name))
    .all();

export const cityNames = (ids: number[]) => (ids.length ? db.select({ id: s.cities.id, name: s.cities.name }).from(s.cities).where(inArray(s.cities.id, ids)).all() : []);

export function personBrandsOf(personId: number) {
  return db
    .select({ slug: s.brands.slug, name: s.brands.shortName, relationship: s.personBrands.relationship, since: s.personBrands.since })
    .from(s.personBrands)
    .innerJoin(s.brands, eq(s.brands.id, s.personBrands.brandId))
    .where(eq(s.personBrands.personId, personId))
    .all();
}

export function audit(actor: { id?: number | null; name: string }, action: string, entity: string, entityId?: number | null, brandId?: number | null, detail?: string) {
  db.insert(s.auditLog).values({ userId: actor.id ?? null, actor: actor.name, action, entity, entityId: entityId ?? null, brandId: brandId ?? null, detail: detail ?? null }).run();
}
