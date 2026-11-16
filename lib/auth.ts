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
const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "benchmark-hr-auth-secret-key-uelement-2026";

export type SessionUser = typeof s.users.$inferSelect & { brandSlug: string | null };

function createSignedToken(userId: number, expiresAtMs: number): string {
  const payload = `${userId}.${expiresAtMs}`;
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifySignedToken(token: string): { userId: number; expiresAtMs: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uidStr, expStr, sig] = parts;
  const userId = Number(uidStr);
  const expiresAtMs = Number(expStr);
  if (!userId || isNaN(userId) || !expiresAtMs || isNaN(expiresAtMs)) return null;

  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(`${uidStr}.${expStr}`).digest("base64url");
  if (sig.length !== expectedSig.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  } catch {
    return null;
  }

  if (expiresAtMs < Date.now()) return null;
  return { userId, expiresAtMs };
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  // 1. Verify stateless signed session token
  const parsed = verifySignedToken(token);
  if (parsed) {
    try {
      const row = db
        .select({ u: s.users, b: s.brands.slug })
        .from(s.users)
        .leftJoin(s.brands, eq(s.brands.id, s.users.brandId))
        .where(eq(s.users.id, parsed.userId))
        .get();
      if (!row) return null;
      return { ...row.u, brandSlug: row.b ?? null };
    } catch (err) {
      console.error("[auth] error loading user by id:", err);
      return null;
    }
  }

  // 2. Fallback to stateful DB session table for legacy tokens
  try {
    const row = db
      .select({ u: s.users, b: s.brands.slug, exp: s.sessions.expiresAt })
      .from(s.sessions)
      .innerJoin(s.users, eq(s.users.id, s.sessions.userId))
      .leftJoin(s.brands, eq(s.brands.id, s.users.brandId))
      .where(eq(s.sessions.token, token))
      .get();
    if (!row || row.exp < nowTs()) return null;
    return { ...row.u, brandSlug: row.b ?? null };
  } catch {
    return null;
  }
});

export async function signIn(email: string, password: string, remember = true) {
  const u = db.select().from(s.users).where(eq(s.users.email, email.trim().toLowerCase())).get();
  if (!u || !verifyPassword(password, u.passwordHash)) return null;

  const expiresAtStr = addHours(24 * 14);
  const expiresAtMs = Date.now() + 14 * 24 * 3600_000;
  const token = createSignedToken(u.id, expiresAtMs);

  try {
    db.insert(s.sessions).values({ token, userId: u.id, expiresAt: expiresAtStr }).run();
  } catch {
    // Ignore write failures in ephemeral DB
  }

  try {
    db.update(s.users).set({ lastLoginAt: nowTs() }).where(eq(s.users.id, u.id)).run();
  } catch {
    // Ignore
  }

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 14 } : {}),
  });

  return u;
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    try {
      db.delete(s.sessions).where(eq(s.sessions.token, token)).run();
    } catch {
      // Ignore
    }
  }
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
