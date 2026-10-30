/**
 * Jev resume parser (rules engine). Extracts current title, years of
 * experience and skills from resume text. When ANTHROPIC_API_KEY is set,
 * lib/jev/engine.ts asks Claude first and falls back to this.
 */
import { allSkills, JOB_FAMILIES, SENIORITY } from "../content/taxonomy";

export type ParsedResume = {
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  skills: string[];
  familySlug: string | null;
  seniority: string | null;
  linkedinUrl: string | null;
};

const TITLE_HINTS = [
  "Chief", "Vice President", "VP", "Director", "Head", "Principal", "Staff", "Lead", "Senior", "Manager",
  "Engineer", "Scientist", "Architect", "Analyst", "Consultant", "Controller", "Counsel", "Designer", "Officer",
];

export function parseResume(text: string): ParsedResume {
  const t = text.replace(/\r/g, "");
  const lower = t.toLowerCase();

  // Skills: dictionary match on word boundaries.
  const skills = allSkills().filter((s) => {
    const esc = s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`, "i").test(lower);
  });

  // Years of experience: explicit statement, else span of years mentioned.
  let years: number | null = null;
  const m = lower.match(/(\d{1,2})\+?\s*(?:years|yrs)(?:\s+of)?\s+(?:experience|exp)/);
  if (m) years = Number(m[1]);
  else {
    const ys = [...t.matchAll(/\b(19[89]\d|20[0-2]\d)\b/g)].map((x) => Number(x[1]));
    if (ys.length >= 2) years = Math.max(1, new Date().getFullYear() - Math.min(...ys));
  }

  // Current title: first line that looks like a job title, prefer "Title at Company" / "Title, Company".
  let currentTitle: string | null = null;
  let currentCompany: string | null = null;
  for (const raw of t.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 40)) {
    if (raw.length > 90) continue;
    if (TITLE_HINTS.some((h) => new RegExp(`\\b${h}\\b`).test(raw))) {
      const at = raw.match(/^(.*?)\s+(?:at|@|,|–|-|\|)\s+(.*)$/);
      if (at) {
        currentTitle = at[1].trim();
        currentCompany = at[2].replace(/\(.*?\)/g, "").replace(/\b(19|20)\d{2}.*$/, "").trim() || null;
      } else currentTitle = raw;
      break;
    }
  }

  // Family: the family whose skills overlap most.
  let familySlug: string | null = null;
  let best = 0;
  for (const [slug, f] of Object.entries(JOB_FAMILIES)) {
    const n = f.skills.filter((s) => skills.includes(s)).length + (currentTitle && f.roles.some((r) => currentTitle!.toLowerCase().includes(r.toLowerCase().split(" ")[0])) ? 1 : 0);
    if (n > best) {
      best = n;
      familySlug = slug;
    }
  }

  // Seniority from title and years.
  let seniority: string | null = null;
  const tl = (currentTitle ?? "").toLowerCase();
  if (/\bchief\b|\bc[etfoi]o\b/.test(tl)) seniority = "CXO";
  else if (/vice president|\bvp\b|director|\bhead\b/.test(tl)) seniority = "Leadership";
  else if (/principal|staff|architect/.test(tl)) seniority = "Principal";
  else if (/senior|lead|manager/.test(tl)) seniority = "Senior";
  else if (years != null) seniority = years >= 12 ? "Principal" : years >= 6 ? "Senior" : years >= 3 ? "Mid" : "Junior";
  if (seniority && !SENIORITY.includes(seniority as (typeof SENIORITY)[number])) seniority = null;

  const li = t.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+/i);

  return {
    currentTitle,
    currentCompany,
    yearsExperience: years,
    skills: skills.slice(0, 20),
    familySlug,
    seniority,
    linkedinUrl: li ? (li[0].startsWith("http") ? li[0] : `https://${li[0]}`) : null,
  };
}
