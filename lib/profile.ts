/**
 * One source of truth for profile completeness.
 *
 * The Loom walkthrough showed four signals disagreeing (stepper "100%",
 * strength 40%, dashboard "complete", getting started 3/5). Every screen now
 * reads from profileStatus(), using the same weights the live site uses:
 * name 10, title 15, years 10, 3+ skills 20, resume 30, LinkedIn 15.
 */
type P = {
  firstName: string | null;
  lastName: string | null;
  currentTitle: string | null;
  yearsExperience: number | null;
  skills: string[] | null;
  resumeFilename: string | null;
  linkedinUrl: string | null;
  stepsSaved: number[] | null;
};

export const PROFILE_WEIGHTS = [
  { key: "name", label: "Full name", weight: 10 },
  { key: "title", label: "Current title", weight: 15 },
  { key: "years", label: "Years of experience", weight: 10 },
  { key: "skills", label: "At least 3 skills", weight: 20 },
  { key: "resume", label: "Resume uploaded", weight: 30 },
  { key: "linkedin", label: "LinkedIn profile", weight: 15 },
] as const;

export const validLinkedin = (u: string | null | undefined) =>
  !!u && /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%]+\/?$/i.test(u.trim());

export function profileStatus(p: P) {
  const checks: Record<string, boolean> = {
    name: !!(p.firstName && p.lastName),
    title: !!p.currentTitle,
    years: p.yearsExperience != null && p.yearsExperience >= 0,
    skills: (p.skills?.length ?? 0) >= 3,
    resume: !!p.resumeFilename,
    linkedin: validLinkedin(p.linkedinUrl),
  };
  const items = PROFILE_WEIGHTS.map((w) => ({ ...w, done: checks[w.key] }));
  const strength = items.reduce((a, i) => a + (i.done ? i.weight : 0), 0);
  const label = strength >= 100 ? "Complete" : strength >= 80 ? "Strong" : strength >= 50 ? "Developing" : "Getting started";
  const steps = new Set(p.stepsSaved ?? []);
  return { strength, label, items, stepsSaved: steps.size, complete: strength >= 100 };
}
