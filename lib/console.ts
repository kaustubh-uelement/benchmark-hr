import "server-only";
import { cookies } from "next/headers";
import { asc } from "drizzle-orm";
import { db, schema as s } from "./db";
import { requireStaff, type SessionUser } from "./auth";
import { staffBrandIds } from "./access";

export const SCOPE_COOKIE = "bhr_scope";

export type BrandRow = typeof s.brands.$inferSelect;

/**
 * Everything a console page needs: the signed-in staff member, the brands they
 * may work in, and the brand they have narrowed the console to (if any).
 * Brand admins and recruiters are always pinned to their own brand.
 */
export async function consoleCtx() {
  const u = await requireStaff();
  const all = db.select().from(s.brands).orderBy(asc(s.brands.sort)).all();
  const allowedIds = staffBrandIds(u);
  const brands = allowedIds ? all.filter((b) => allowedIds.includes(b.id)) : all;
  const cookieSlug = (await cookies()).get(SCOPE_COOKIE)?.value;
  let picked: BrandRow | null = null;
  if (allowedIds) picked = brands[0] ?? null;
  else if (cookieSlug && cookieSlug !== "all") picked = all.find((b) => b.slug === cookieSlug) ?? null;
  const byId = Object.fromEntries(all.map((b) => [b.id, b])) as Record<number, BrandRow>;
  return { u, all, brands, picked, pickedId: picked?.id ?? null, byId, isGroup: !allowedIds };
}

export type ConsoleCtx = Awaited<ReturnType<typeof consoleCtx>>;

export { BRAND_COLORS } from "./content/brands";

export const staffName = (u: SessionUser) => u.name;
