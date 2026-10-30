import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema as s } from "./db";
import { getUser } from "./auth";
import { profileStatus } from "./profile";
import { nowTs } from "./time";

export async function requireMember(loginPath = "/exh1b/auth/login") {
  const u = await getUser();
  if (!u) redirect(loginPath);
  if (!u.personId) redirect(u.role === "candidate" || u.role === "participant" ? loginPath : "/console");
  const person = db.select().from(s.people).where(eq(s.people.id, u.personId)).get();
  if (!person) redirect(loginPath);
  return { user: u, person };
}

export function subscriptionOf(personId: number) {
  const row = db
    .select({ sub: s.subscriptions, plan: s.plans })
    .from(s.subscriptions)
    .innerJoin(s.plans, eq(s.plans.id, s.subscriptions.planId))
    .where(eq(s.subscriptions.personId, personId))
    .orderBy(desc(s.subscriptions.startedAt))
    .get();
  const active = !!row && row.sub.status === "active" && row.sub.currentPeriodEnd > nowTs();
  return { sub: row?.sub ?? null, plan: row?.plan ?? null, active };
}

export function memberSnapshot(personId: number) {
  const person = db.select().from(s.people).where(eq(s.people.id, personId)).get()!;
  const status = profileStatus(person);
  const subscription = subscriptionOf(personId);
  const consults = db.select().from(s.consultations).where(eq(s.consultations.personId, personId)).orderBy(desc(s.consultations.createdAt)).all();
  const threadsJoined = db.select({ id: s.posts.id }).from(s.posts).innerJoin(s.users, eq(s.users.id, s.posts.authorUserId)).where(eq(s.users.personId, personId)).all().length +
    db.select({ id: s.threads.id }).from(s.threads).innerJoin(s.users, eq(s.users.id, s.threads.authorUserId)).where(eq(s.users.personId, personId)).all().length;
  const prefsSet = (person.preferredCityIds.length > 0 || person.anywhereInIndia || person.workMode === "Remote") && !!person.familyId;
  const gettingStarted = [
    { key: "profile", label: "Complete your profile", done: status.complete, href: "/exh1b/profile" },
    { key: "resume", label: "Upload your resume", done: !!person.resumeFilename, href: "/exh1b/profile?step=5" },
    { key: "prefs", label: "Set location and role preferences", done: prefsSet, href: "/exh1b/profile?step=3" },
    { key: "consult", label: "Book your intro call", done: consults.length > 0, href: "/exh1b/dashboard#consultation" },
    { key: "community", label: "Say hello in the community", done: threadsJoined > 0, href: "/exh1b/community" },
  ];
  return { person, status, subscription, consults, gettingStarted };
}

export function relevantIncluded(personId: number, mandateId: number) {
  return db.select().from(s.engagements).where(and(eq(s.engagements.personId, personId), eq(s.engagements.mandateId, mandateId))).get();
}
