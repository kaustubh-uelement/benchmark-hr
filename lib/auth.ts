import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema as s } from "./db";
import { verifyPassword } from "./password";
import { addHours, nowTs } from "./time";
import { brandBySlug } from "./content/brands";

const COOKIE = "bhr_session";

export type SessionUser = typeof s.users.$inferSelect & { brandSlug: string | null };

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = db
    .select({ u: s.users, b: s.brands.slug, exp: s.sessions.expiresAt })
    .from(s.sessions)
    .innerJoin(s.users, eq(s.users.id, s.sessions.userId))
    .leftJoin(s.brands, eq(s.brands.id, s.users.brandId))
    .where(eq(s.sessions.token, token))
    .get();
  if (!row || row.exp < nowTs()) return null;
  return { ...row.u, brandSlug: row.b ?? null };
});

export async function signIn(email: string, password: string, remember = true) {
  const u = db.select().from(s.users).where(eq(s.users.email, email.trim().toLowerCase())).get();
  if (!u || !verifyPassword(password, u.passwordHash)) return null;
  const token = crypto.randomBytes(32).toString("base64url");
  db.insert(s.sessions).values({ token, userId: u.id, expiresAt: addHours(24 * 14) }).run();
  db.update(s.users).set({ lastLoginAt: nowTs() }).where(eq(s.users.id, u.id)).run();
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", ...(remember ? { maxAge: 60 * 60 * 24 * 14 } : {}) });
  return u;
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(s.sessions).where(eq(s.sessions.token, token)).run();
  jar.delete(COOKIE);
}

/** Where each role lands after signing in. */
export function homeFor(u: { role: string; brandSlug?: string | null }) {
  if (u.role === "group_admin" || u.role === "brand_admin" || u.role === "recruiter") return "/console";
  const base = brandBySlug(u.brandSlug ?? "")?.base ?? "/";
  if (u.brandSlug === "exh1b") return "/exh1b/dashboard";
  return `${base}/portal`;
}

export const isStaff = (u: { role: string } | null) => !!u && ["group_admin", "brand_admin", "recruiter"].includes(u.role);

export async function requireUser(opts: { roles?: SessionUser["role"][]; login?: string } = {}) {
  const u = await getUser();
  if (!u) redirect(opts.login ?? "/login");
  if (opts.roles && !opts.roles.includes(u.role)) redirect(homeFor(u));
  return u;
}

export async function requireStaff() {
  return requireUser({ roles: ["group_admin", "brand_admin", "recruiter"], login: "/login?next=/console" });
}
