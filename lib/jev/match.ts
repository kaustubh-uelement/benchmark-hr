/**
 * Jev match scoring — deterministic and explainable.
 * Every score comes with the reasons and gaps that produced it, so a
 * recruiter (or the candidate) can see why Jev ranked a person where it did.
 */
import { SENIORITY } from "../content/taxonomy";

export type MatchPerson = {
  skills: string[];
  familyId: number | null;
  seniority: string | null;
  yearsExperience: number | null;
  cityId: number | null;
  preferredCityIds: number[];
  anywhereInIndia: boolean;
  workMode: string | null;
  salaryMin: number | null;
  salaryCurrency: string | null;
};

export type MatchMandate = {
  skills: string[];
  familyId: number | null;
  seniority: string | null;
  minYears: number | null;
  cityId: number | null;
  countryCode: string | null;
  workMode: string | null;
  salaryMax: number | null;
  currency: string | null;
  locationLabel?: string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#.]/g, "");

// Rough conversion for comparing salary expectations across currencies.
const TO_USD: Record<string, number> = { USD: 1, INR: 1 / 88, GBP: 1.27, EUR: 1.08, AED: 0.27, SGD: 0.74, CAD: 0.73, AUD: 0.66 };
export const toUsd = (amount: number, cur: string | null) => amount * (TO_USD[cur ?? "USD"] ?? 1);

export function scoreMatch(p: MatchPerson, m: MatchMandate) {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  // Skills: 40
  const want = m.skills.map(norm);
  const have = new Set(p.skills.map(norm));
  const hit = m.skills.filter((s) => have.has(norm(s)));
  const skillRatio = want.length ? hit.length / want.length : 0.5;
  score += 40 * skillRatio;
  if (hit.length) reasons.push(`Has ${hit.slice(0, 4).join(", ")}${hit.length > 4 ? ` +${hit.length - 4}` : ""}`);
  const missing = m.skills.filter((s) => !have.has(norm(s)));
  if (missing.length && want.length) gaps.push(`No evidence yet of ${missing.slice(0, 3).join(", ")}`);

  // Job family: 15
  if (m.familyId && p.familyId === m.familyId) {
    score += 15;
    reasons.push("Same job family");
  } else if (m.familyId) gaps.push("Different job family");

  // Seniority: 15
  const si = (x: string | null) => (x ? SENIORITY.indexOf(x as (typeof SENIORITY)[number]) : -1);
  const ps = si(p.seniority);
  const ms = si(m.seniority);
  if (ps >= 0 && ms >= 0) {
    const d = Math.abs(ps - ms);
    score += d === 0 ? 15 : d === 1 ? 9 : 2;
    if (d === 0) reasons.push(`${p.seniority} level, as required`);
    else if (d === 1) reasons.push(`Close seniority (${p.seniority} vs ${m.seniority})`);
    else gaps.push(`Seniority gap (${p.seniority} vs ${m.seniority})`);
  } else score += 6;

  // Experience: 10
  if (m.minYears && p.yearsExperience != null) {
    if (p.yearsExperience >= m.minYears) {
      score += 10;
      reasons.push(`${Math.round(p.yearsExperience)} years' experience (needs ${m.minYears}+)`);
    } else {
      score += Math.max(0, 10 * (p.yearsExperience / m.minYears) - 3);
      gaps.push(`${Math.round(p.yearsExperience)} years vs ${m.minYears}+ asked`);
    }
  } else score += 5;

  // Location: 12
  const remote = m.workMode === "Remote";
  if (remote && p.workMode !== "On-site / Hybrid") {
    score += 12;
    reasons.push("Open to remote");
  } else if (m.cityId && (p.preferredCityIds.includes(m.cityId) || p.cityId === m.cityId)) {
    score += 12;
    reasons.push(`Wants to be in ${m.locationLabel ?? "this city"}`);
  } else if (m.countryCode === "IN" && p.anywhereInIndia) {
    score += 9;
    reasons.push("Open to anywhere in India");
  } else {
    score += 2;
    gaps.push(`Hasn't listed ${m.locationLabel ?? "this location"}`);
  }

  // Salary: 8
  if (m.salaryMax && p.salaryMin) {
    const ok = toUsd(p.salaryMin, p.salaryCurrency) <= toUsd(m.salaryMax, m.currency) * 1.05;
    if (ok) {
      score += 8;
      reasons.push("Salary expectation within band");
    } else gaps.push("Salary expectation above band");
  } else score += 4;

  return { score: Math.max(1, Math.min(99, Math.round(score))), reasons, gaps };
}
