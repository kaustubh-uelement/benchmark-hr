/**
 * Demo dataset for the whole Benchmark HR Group — deterministic, so every
 * reset produces the same people, mandates and history.
 *
 * Everything here is fictional except Benchmark HR's own public-facing facts
 * (founder, team names, client testimonials on the group site). Organisation
 * names are invented; replace with real data during migration.
 */
import type Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as s from "./schema";
import { BRANDS } from "../content/brands";
import { countryList, STATES, COST_OF_LIVING } from "../content/geo";
import { JOB_FAMILIES, SENIORITY, COMPANY_TYPES, EMPLOYMENT_TYPES } from "../content/taxonomy";
import { RELOCATION_ITEMS } from "../content/relocation";
import { AUTOMATIONS } from "../jev/automations";
import { scoreMatch } from "../jev/match";
import { parseResume } from "../jev/parse";
import { hashPassword } from "../password";
import { daysAgo, daysAhead } from "../time";

type DB = BetterSQLite3Database<typeof s>;

/* deterministic PRNG */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20261029);
const pick = <T,>(a: readonly T[]) => a[Math.floor(R() * a.length)];
const int = (lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
const sample = <T,>(a: readonly T[], n: number) => {
  const c = [...a];
  const out: T[] = [];
  while (out.length < n && c.length) out.push(c.splice(Math.floor(R() * c.length), 1)[0]);
  return out;
};
const chance = (p: number) => R() < p;

const FIRST_F = ["Priya", "Ananya", "Neha", "Kavya", "Sneha", "Pooja", "Aditi", "Riya", "Shruti", "Meghna", "Ishita", "Tanvi", "Radhika", "Nandini", "Swati", "Lakshmi", "Divya", "Pallavi", "Aparna", "Gauri", "Madhura", "Sanjana", "Vaishnavi", "Rutuja", "Shalini", "Farah", "Zoya", "Simran", "Harpreet", "Anjali"];
const FIRST_M = ["Aarav", "Rohan", "Vikram", "Arjun", "Siddharth", "Karthik", "Rahul", "Aditya", "Nikhil", "Varun", "Sameer", "Abhishek", "Kunal", "Rajesh", "Sandeep", "Amit", "Manish", "Prasad", "Omkar", "Tejas", "Harsh", "Imran", "Faisal", "Gurpreet", "Anirudh", "Shreyas", "Mihir", "Kedar", "Sunil", "Venkat"];
const LAST = ["Sharma", "Iyer", "Nair", "Kulkarni", "Deshpande", "Joshi", "Patil", "Menon", "Reddy", "Rao", "Gupta", "Mehta", "Shah", "Banerjee", "Chatterjee", "Mukherjee", "Agarwal", "Bhatt", "Pillai", "Naidu", "Gokhale", "Apte", "Sawant", "Khan", "Siddiqui", "Singh", "Gill", "Kapoor", "Malhotra", "Verma", "Saxena", "Pandey", "Bhosale", "Kamat", "Hegde", "Shetty", "Krishnan", "Subramanian", "Das", "Ghosh"];

/* Fictional organisations. [name, industry, country, city, size, companyType] */
const INDIA_ORGS: [string, string, string, string, string, string][] = [
  ["Kaveri Digital Bank", "Banking", "IN", "Mumbai", "5,000+", "Indian conglomerate"],
  ["Sahyadri Mobility", "Automotive", "IN", "Pune", "1,000–5,000", "Enterprise product company"],
  ["Lumenfield Technologies India", "Software (GCC)", "IN", "Bengaluru", "1,000–5,000", "Global capability centre (GCC)"],
  ["Aranya Healthcare", "Healthcare", "IN", "Hyderabad", "1,000–5,000", "Enterprise product company"],
  ["Vyomika Aerospace", "Aerospace", "IN", "Bengaluru", "200–1,000", "Mid/late-stage startup"],
  ["Tarangini Telecom", "Telecom", "IN", "Gurugram", "5,000+", "Indian conglomerate"],
  ["Indrayani Payments", "Fintech", "IN", "Pune", "200–1,000", "Mid/late-stage startup"],
  ["Merukand Capital", "Asset management", "IN", "Mumbai", "50–200", "Small/mid services company"],
  ["Nilgiri Fresh Foods", "FMCG", "IN", "Chennai", "1,000–5,000", "Indian conglomerate"],
  ["Orbitwise SaaS", "B2B SaaS", "IN", "Pune", "50–200", "Early-stage startup"],
  ["Pragatika Renewables", "Energy", "IN", "Ahmedabad", "200–1,000", "Mid/late-stage startup"],
  ["Quantaloom Analytics", "Data & AI", "IN", "Hyderabad", "200–1,000", "Mid/late-stage startup"],
  ["Rivaan Retail", "Retail", "IN", "Mumbai", "5,000+", "Indian conglomerate"],
  ["Sarthika Logistics", "Logistics", "IN", "New Delhi", "1,000–5,000", "Enterprise product company"],
  ["Trinetra Semiconductors", "Semiconductors", "IN", "Bengaluru", "200–1,000", "Mid/late-stage startup"],
  ["Ashvika Pharma", "Pharmaceuticals", "IN", "Ahmedabad", "1,000–5,000", "Enterprise product company"],
  ["Zenrise Learning", "EdTech", "IN", "Noida", "200–1,000", "Mid/late-stage startup"],
  ["Kalpavriksh General Insurance", "Insurance", "IN", "Mumbai", "1,000–5,000", "Indian conglomerate"],
  ["Northgate Bank GCC", "Banking (GCC)", "IN", "Chennai", "5,000+", "Global capability centre (GCC)"],
  ["Coralbay Consulting India", "IT services", "IN", "Kochi", "1,000–5,000", "Large services company"],
];
const ABROAD_ORGS: [string, string, string, string, string, string][] = [
  ["Halcyon Cloud Inc.", "Cloud software", "US", "Seattle", "5,000+", "Enterprise product company"],
  ["Brightwater Systems LLC", "Fintech", "US", "Jersey City", "1,000–5,000", "Enterprise product company"],
  ["Redwood Peak Analytics", "Data & AI", "US", "San Jose", "200–1,000", "Mid/late-stage startup"],
  ["Granite Harbor Health", "Healthcare", "US", "Boston", "5,000+", "Enterprise product company"],
  ["Fernhill Software Ltd", "Software", "GB", "London", "200–1,000", "Mid/late-stage startup"],
  ["Blue Cedar Health", "Healthtech", "IE", "Dublin", "200–1,000", "Mid/late-stage startup"],
  ["Corvane Analytics GmbH", "Analytics", "DE", "Munich", "200–1,000", "Enterprise product company"],
  ["Dunemark Holdings", "Investment", "AE", "Dubai", "1,000–5,000", "Indian conglomerate"],
  ["Kestrel Robotics Pte", "Robotics", "SG", "Singapore", "50–200", "Early-stage startup"],
  ["Maple Ridge Financial", "Banking", "CA", "Toronto", "5,000+", "Enterprise product company"],
];

const ABROAD_SPREAD = ["US", "US", "US", "US", "US", "US", "US", "US", "GB", "GB", "CA", "IE", "DE", "AE", "SG", "AU", "US", "US", "GB", "AE"];
const EXH1B_FAMILIES = ["engineering", "engineering", "engineering", "data", "data", "product", "infrastructure", "security", "finance", "bfsi", "sales", "marketing", "hr", "design", "healthcare", "operations"];
const INDIA_FAMILIES = ["engineering", "data", "product", "finance", "bfsi", "sales", "marketing", "hr", "operations", "manufacturing", "infrastructure", "security", "legal", "customer"];

export function seed(db: DB, raw: Database.Database, opts: { reset?: boolean } = {}) {
  raw.transaction(() => {
    if (opts.reset) {
      const tables = raw.prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%' and name not like '__drizzle%'").all() as { name: string }[];
      raw.pragma("defer_foreign_keys = ON");
      for (const t of tables) raw.prepare(`delete from "${t.name}"`).run();
      raw.prepare("delete from sqlite_sequence").run();
    } else {
      const n = (raw.prepare("select count(*) n from brands").get() as { n: number }).n;
      if (n > 0) return;
    }
    run(db);
  })();
}

function run(db: DB) {
  const PW = hashPassword("Demo@2026");

  /* brands */
  const brandId: Record<string, number> = {};
  BRANDS.forEach((b, i) => {
    const r = db.insert(s.brands).values({ slug: b.slug, name: b.name, shortName: b.shortName, tagline: b.tagline, description: b.description, kind: b.kind, status: b.status, domain: b.domain, sort: i }).returning({ id: s.brands.id }).get();
    brandId[b.slug] = r.id;
  });

  /* geography */
  const countries = countryList();
  for (const c of countries) db.insert(s.countries).values({ code: c.code, name: c.name, region: c.region }).run();
  const cityId: Record<string, number> = {};
  for (const [cc, sts] of Object.entries(STATES)) {
    for (const [st, cs] of sts) {
      const sr = db.insert(s.states).values({ countryCode: cc, name: st }).returning({ id: s.states.id }).get();
      for (const c of cs) {
        const cr = db.insert(s.cities).values({ stateId: sr.id, countryCode: cc, name: c, isMetro: cc === "IN" && Object.keys(COST_OF_LIVING).includes(c) }).returning({ id: s.cities.id }).get();
        cityId[`${cc}:${c}`] = cr.id;
      }
    }
  }
  const stateOfCity = (cc: string, city: string) => {
    for (const [i, [st, cs]] of (STATES[cc] ?? []).entries()) if (cs.includes(city)) return { name: st, idx: i };
    return null;
  };
  const stateIdCache: Record<string, number> = {};
  const stateId = (cc: string, st: string) => {
    const k = `${cc}:${st}`;
    if (!stateIdCache[k]) {
      const r = db.select({ id: s.states.id }).from(s.states).where(eq(s.states.name, st)).all();
      stateIdCache[k] = r[0]?.id;
    }
    return stateIdCache[k];
  };

  for (const [city, v] of Object.entries(COST_OF_LIVING))
    db.insert(s.costOfLiving).values({ city, rent1bhk: v[0], rent2bhk: v[1], groceries: v[2], transport: v[3], utilities: v[4], dining: v[5] }).run();

  /* taxonomy */
  const familyId: Record<string, number> = {};
  const roleId: Record<string, number> = {};
  for (const [slug, f] of Object.entries(JOB_FAMILIES)) {
    const r = db.insert(s.jobFamilies).values({ slug, name: f.name }).returning({ id: s.jobFamilies.id }).get();
    familyId[slug] = r.id;
    for (const role of f.roles) roleId[`${slug}:${role}`] = db.insert(s.jobRoles).values({ familyId: r.id, name: role }).returning({ id: s.jobRoles.id }).get().id;
  }

  /* relocation */
  RELOCATION_ITEMS.forEach((it, i) => db.insert(s.relocationItems).values({ ...it, sort: i }).run());

  /* staff users */
  const staff = (email: string, name: string, role: (typeof s.users.$inferInsert)["role"], brand: string | null, title: string) =>
    db.insert(s.users).values({ email, name, passwordHash: PW, role, brandId: brand ? brandId[brand] : null, title, lastLoginAt: daysAgo(int(0, 3)) }).returning({ id: s.users.id }).get().id;

  const U = {
    anand: staff("anand@benchmarkhr.in", "Anand Joshi", "group_admin", null, "Founder & CEO, Benchmark HR Group"),
    admin: staff("admin@benchmarkhr.in", "Platform Administrator", "group_admin", null, "Platform administrator"),
    gg: staff("partner@goldenglove.in", "Ishita Rao", "brand_admin", "golden-glove", "Search Partner, Golden Glove"),
    ggr: staff("research@goldenglove.in", "Mihir Gokhale", "recruiter", "golden-glove", "Research Associate, Golden Glove"),
    ex: staff("success@exh1b.com", "Meera Kulkarni", "brand_admin", "exh1b", "Member Success Lead, ExH1B"),
    exs: staff("support@exh1b.com", "Farhan Shaikh", "recruiter", "exh1b", "Support & Relocation Specialist, ExH1B"),
    exeor: staff("employers@exh1b.com", "Nikhil Deshpande", "recruiter", "exh1b", "Employer Partnerships (EOR), ExH1B"),
    tc: staff("coach@trustcircle.in", "Nandini Bhosale", "brand_admin", "trustcircle", "Lead Transition Coach, TrustCircle"),
    tal: staff("hiring@benchmarktalent.in", "Rohan Bhide", "brand_admin", "talent", "Hiring Lead, Benchmark Talent"),
    talr: staff("recruiter@benchmarktalent.in", "Swati Apte", "recruiter", "talent", "Senior Recruiter, Benchmark Talent"),
    adv: staff("advisory@benchmarkhr.in", "Kavya Menon", "brand_admin", "advisory", "Principal, Benchmark Advisory"),
  };

  /* organisations */
  const orgId: Record<string, number> = {};
  for (const [name, industry, cc, city, size, type] of [...INDIA_ORGS, ...ABROAD_ORGS]) {
    orgId[name] = db.insert(s.organisations).values({ name, industry, countryCode: cc, city, sizeBand: size, companyType: type, website: `https://www.${name.toLowerCase().replace(/[^a-z]+/g, "")}.example`, createdAt: daysAgo(int(120, 900)) }).returning({ id: s.organisations.id }).get().id;
  }
  const orgBrand = (org: string, brand: string, rel: "client" | "employer" | "eor_employer" | "prospect", owner?: number) =>
    db.insert(s.orgBrands).values({ orgId: orgId[org], brandId: brandId[brand], relationship: rel, ownerUserId: owner ?? null, since: daysAgo(int(30, 700)) }).onConflictDoNothing().run();

  /* people */
  type PersonRow = typeof s.people.$inferSelect;
  const people: PersonRow[] = [];
  const usedEmails = new Set<string>();

  function salaryUsd(sen: string) {
    return ({ Junior: 25000, Mid: 35000, Senior: 50000, Principal: 75000, Leadership: 110000, CXO: 180000, Board: 200000 } as Record<string, number>)[sen] ?? 50000;
  }
  function salaryInr(sen: string) {
    return ({ Junior: 1000000, Mid: 2000000, Senior: 4000000, Principal: 6500000, Leadership: 10000000, CXO: 25000000, Board: 0 } as Record<string, number>)[sen] ?? 3000000;
  }
  function roleFor(fam: string, sen: string) {
    const roles = JOB_FAMILIES[fam].roles;
    if (sen === "CXO" || sen === "Board") return roles[roles.length - 1];
    if (sen === "Leadership") return roles[Math.max(0, roles.length - 2 - (R() < 0.3 ? 1 : 0))];
    const idx = Math.min(roles.length - 1, Math.max(0, Math.floor((SENIORITY.indexOf(sen as (typeof SENIORITY)[number]) / (SENIORITY.length - 1)) * roles.length + (R() - 0.5))));
    return roles[idx];
  }
  function resumeFor(first: string, last: string, title: string, company: string, years: number, skills: string[], city: string, li: string) {
    const start = new Date().getFullYear() - Math.round(years);
    return `${first} ${last}
${city} · ${li}

${title} at ${company}
${start + Math.round(years / 2)} – present

Summary
${Math.round(years)} years of experience across product companies and global teams. Known for ${skills.slice(0, 2).join(" and ")}.

Experience
${title}, ${company} (${start + Math.round(years / 2)} – present)
- Led initiatives in ${skills.slice(0, 3).join(", ")}
Previous role, ${pick(INDIA_ORGS)[0]} (${start} – ${start + Math.round(years / 2)})
- Built and shipped work in ${skills.slice(2, 5).join(", ")}

Skills
${skills.join(", ")}

Education
B.Tech / MBA, ${pick(["IIT Bombay", "NIT Trichy", "BITS Pilani", "COEP Pune", "IIM Ahmedabad", "Anna University", "VJTI Mumbai", "IIIT Hyderabad"])}`;
  }

  function addPerson(o: {
    first?: string; last?: string; female?: boolean; fam: string; sen: string; cc: string; city: string;
    company?: string; brand: string; rel: (typeof s.personBrands.$inferInsert)["relationship"]; exec?: boolean;
    years?: number; email?: string; full?: boolean; created?: number; openToEor?: boolean | null; prefCities?: string[];
  }) {
    const female = o.female ?? chance(0.45);
    const first = o.first ?? pick(female ? FIRST_F : FIRST_M);
    const last = o.last ?? pick(LAST);
    let email = o.email ?? `${first}.${last}`.toLowerCase() + "@example.com";
    let k = 2;
    while (usedEmails.has(email)) email = `${first}.${last}${k++}`.toLowerCase() + "@example.com";
    usedEmails.add(email);
    const fam = JOB_FAMILIES[o.fam];
    const skills = [...sample(fam.skills, int(4, Math.min(8, fam.skills.length))), ...(chance(0.5) ? sample(["Leadership", "Agile", "Stakeholder management", "People management", "SQL", "Excel"], 1) : [])];
    const years = o.years ?? ({ Junior: int(1, 3), Mid: int(4, 7), Senior: int(7, 12), Principal: int(11, 16), Leadership: int(14, 22), CXO: int(18, 28), Board: int(25, 35) } as Record<string, number>)[o.sen];
    const title = roleFor(o.fam, o.sen);
    const company = o.company ?? (o.cc === "IN" ? pick(INDIA_ORGS)[0] : pick(ABROAD_ORGS.filter((a) => a[2] === o.cc).length ? ABROAD_ORGS.filter((a) => a[2] === o.cc) : ABROAD_ORGS)[0]);
    const li = `https://www.linkedin.com/in/${first.toLowerCase()}-${last.toLowerCase()}-${int(10, 99)}`;
    const full = o.full ?? chance(0.8);
    const st = stateOfCity(o.cc, o.city);
    const prefs = (o.prefCities ?? sample(["Pune", "Bengaluru", "Hyderabad", "Mumbai", "Gurugram", "Chennai", "New Delhi", "Noida", "Ahmedabad", "Kochi"], int(1, 3))).map((c) => cityId[`IN:${c}`]).filter(Boolean);
    const abroad = o.cc !== "IN";
    const resumeText = full ? resumeFor(first, last, title, company, years, skills, o.city, li) : null;
    const row = db
      .insert(s.people)
      .values({
        firstName: first,
        lastName: last,
        email,
        phone: abroad ? null : `+91 9${int(100000000, 999999999)}`,
        linkedinUrl: full || chance(0.5) ? li : null,
        headline: `${title} · ${skills.slice(0, 3).join(" · ")}`,
        currentTitle: full ? title : chance(0.5) ? title : null,
        currentCompany: company,
        yearsExperience: full ? years : chance(0.5) ? years : null,
        seniority: o.sen,
        familyId: familyId[o.fam],
        roleId: roleId[`${o.fam}:${title}`] ?? null,
        skills: full ? skills : skills.slice(0, int(0, 3)),
        countryCode: o.cc,
        stateId: st ? stateId(o.cc, st.name) : null,
        cityId: cityId[`${o.cc}:${o.city}`] ?? null,
        locationLabel: `${o.city}, ${countries.find((c) => c.code === o.cc)?.name}`,
        returnTimeline: abroad ? pick(["Immediate (within 3 months)", "Within 6 months", "Within 6 months", "Within 1 year", "More than 1 year", "Casually looking", "Not sure yet"]) : null,
        openToEor: abroad ? (o.openToEor ?? chance(0.3)) : null,
        employmentTypes: sample(EMPLOYMENT_TYPES.slice(0, 4), int(1, 2)).concat(["Full-time"]).filter((v, i, a) => a.indexOf(v) === i),
        workMode: pick(["On-site / Hybrid", "On-site / Hybrid", "Remote", "Either"]),
        preferredCityIds: abroad || chance(0.5) ? prefs : [],
        anywhereInIndia: chance(0.2),
        remoteScope: chance(0.3) ? pick(["Anywhere", "Current country", "Chosen countries"]) : null,
        preferredCompanyTypes: sample(COMPANY_TYPES, int(1, 3)),
        noticePeriod: pick(["30 days", "60 days", "90 days", "Immediate", "60 days"]),
        visaStatus: abroad ? pick(o.cc === "US" ? ["H-1B (US)", "H-1B (US)", "Green card (US)", "Indian citizen"] : ["Indian citizen", "OCI cardholder", "Permanent resident (other)"]) : "Indian citizen",
        salaryMin: abroad ? salaryUsd(o.sen) : salaryInr(o.sen),
        salaryMax: abroad ? Math.round(salaryUsd(o.sen) * 1.4) : Math.round(salaryInr(o.sen) * 1.4),
        salaryCurrency: abroad ? "USD" : "INR",
        profileVisibility: chance(0.4) ? "shareable" : "private",
        resumeFilename: resumeText ? `${first}_${last}_CV.pdf` : null,
        resumeText,
        resumeParsedAt: resumeText ? daysAgo(int(1, 120)) : null,
        stepsSaved: full ? [1, 2, 3, 4, 5, 6] : [1, 2, 3].slice(0, int(1, 3)),
        isExecutive: !!o.exec,
        sourceBrandId: brandId[o.brand],
        createdAt: daysAgo(o.created ?? int(5, 600)),
        updatedAt: daysAgo(int(0, 30)),
      })
      .returning()
      .get();
    db.insert(s.personBrands).values({ personId: row.id, brandId: brandId[o.brand], relationship: o.rel, since: row.createdAt }).run();
    const share = chance(0.75);
    db.insert(s.consents).values([
      { personId: row.id, purpose: "ai_matching", granted: chance(0.92), source: `${o.brand} signup`, capturedAt: row.createdAt },
      { personId: row.id, purpose: "group_sharing", granted: share, source: `${o.brand} signup`, capturedAt: row.createdAt },
      { personId: row.id, purpose: "marketing", granted: chance(0.5), source: `${o.brand} signup`, capturedAt: row.createdAt },
    ]).run();
    people.push(row);
    return row;
  }

  /* — ExH1B members (abroad) — */
  const exMembers: PersonRow[] = [];
  // Demo member from the Loom walkthrough: based outside the US, subscription lapsed.
  const aarav = addPerson({ first: "Aarav", last: "Mehta", female: false, fam: "data", sen: "Senior", cc: "IE", city: "Dublin", company: "Blue Cedar Health", brand: "exh1b", rel: "member", email: "aarav.mehta@example.com", full: true, created: 160, openToEor: false, prefCities: ["Pune", "Bengaluru"], years: 9 });
  // Active member in the US who wants to keep his employer from India.
  const priya = addPerson({ first: "Priya", last: "Nair", female: true, fam: "engineering", sen: "Principal", cc: "US", city: "Seattle", company: "Halcyon Cloud Inc.", brand: "exh1b", rel: "member", email: "priya.nair@example.com", full: true, created: 75, openToEor: true, prefCities: ["Bengaluru", "Hyderabad"], years: 13 });
  exMembers.push(aarav, priya);
  for (let i = 0; i < 68; i++) {
    const cc = pick(ABROAD_SPREAD);
    const city = pick(STATES[cc].flatMap(([, cs]) => cs));
    exMembers.push(addPerson({ fam: pick(EXH1B_FAMILIES), sen: pick(["Mid", "Senior", "Senior", "Senior", "Principal", "Principal", "Leadership"]), cc, city, brand: "exh1b", rel: "member" }));
  }

  /* — Golden Glove executives (India) — */
  const execs: PersonRow[] = [];
  for (let i = 0; i < 30; i++) {
    const fam = pick(["general-management", "engineering", "finance", "bfsi", "hr", "sales", "marketing", "security", "data", "operations", "infrastructure", "legal"]);
    execs.push(addPerson({ fam, sen: pick(["Leadership", "Leadership", "CXO", "CXO"]), cc: "IN", city: pick(["Mumbai", "Bengaluru", "Pune", "Gurugram", "Hyderabad", "Chennai", "New Delhi"]), brand: "golden-glove", rel: "executive", exec: true, full: true }));
  }
  // The "one record, many brands" journey: a returnee from ExH1B who is now on a Golden Glove shortlist.
  const neha =
    exMembers.find((p, i) => i >= 2 && p.countryCode === "US" && p.familyId === familyId.engineering && (p.seniority === "Leadership" || p.seniority === "Principal")) ??
    exMembers.find((p, i) => i >= 2 && p.countryCode === "US" && (p.seniority === "Leadership" || p.seniority === "Principal")) ??
    exMembers[5];
  db.update(s.consents).set({ granted: true }).where(eq(s.consents.personId, neha.id)).run();
  db.insert(s.personBrands).values({ personId: neha.id, brandId: brandId["golden-glove"], relationship: "executive", since: daysAgo(20) }).run();

  /* — Benchmark Talent candidates (India) — */
  const talentPeople: PersonRow[] = [];
  for (let i = 0; i < 40; i++) {
    talentPeople.push(addPerson({ fam: pick(INDIA_FAMILIES), sen: pick(["Mid", "Senior", "Senior", "Principal", "Leadership"]), cc: "IN", city: pick(["Pune", "Bengaluru", "Hyderabad", "Mumbai", "Chennai", "Gurugram", "Noida", "Ahmedabad", "Kochi", "Kolkata"]), brand: "talent", rel: "candidate" }));
  }

  /* — TrustCircle participants — */
  const tcPeople: PersonRow[] = [];
  const tcOrgs = ["Sahyadri Mobility", "Rivaan Retail", "Trinetra Semiconductors"];
  for (let i = 0; i < 20; i++) {
    const org = tcOrgs[i % 3];
    const p = addPerson({ ...(i === 0 ? { first: "Sanjay", last: "Kulkarni", female: false, email: "sanjay.kulkarni@example.com", fam: "operations", sen: "Leadership" } : { fam: pick(["operations", "manufacturing", "sales", "finance", "engineering", "hr", "marketing"]), sen: pick(["Senior", "Principal", "Leadership", "Leadership"]) }), cc: "IN", city: INDIA_ORGS.find((o) => o[0] === org)![3], company: org, brand: "trustcircle", rel: "participant", full: true });
    tcPeople.push(p);
  }
  const sanjay = tcPeople[0];

  /* — client contacts — */
  const contact = (org: string, first: string, last: string, female: boolean, title: string, brand: string) => {
    const o = INDIA_ORGS.find((x) => x[0] === org)!;
    const p = addPerson({ first, last, female, fam: title.includes("HR") || title.includes("People") ? "hr" : "general-management", sen: "Leadership", cc: "IN", city: o[3], company: org, brand, rel: "client_contact", full: false, email: `${first}.${last}@${org.toLowerCase().replace(/[^a-z]+/g, "")}.example`.toLowerCase() });
    db.update(s.people).set({ currentTitle: title }).where(eq(s.people.id, p.id)).run();
    db.insert(s.orgContacts).values({ orgId: orgId[org], personId: p.id, title, isPrimary: true }).run();
    return { ...p, currentTitle: title };
  };
  const cRadhika = contact("Kaveri Digital Bank", "Radhika", "Iyer", true, "Chief Human Resources Officer", "golden-glove");
  const cVikram = contact("Sahyadri Mobility", "Vikram", "Patwardhan", false, "Head of HR", "trustcircle");
  const cArjun = contact("Lumenfield Technologies India", "Arjun", "Malhotra", false, "VP Engineering & Site Leader", "talent");
  const cSneha = contact("Orbitwise SaaS", "Sneha", "Patil", true, "Co-founder & CEO", "advisory");
  const cKaran = contact("Indrayani Payments", "Karan", "Saxena", false, "Founder & CEO", "golden-glove");

  /* client & member users */
  const user = (p: PersonRow, role: "client" | "candidate" | "participant", brand: string, org?: string) =>
    db.insert(s.users).values({ email: p.email, name: `${p.firstName} ${p.lastName}`, passwordHash: PW, role, brandId: brandId[brand], personId: p.id, orgId: org ? orgId[org] : null, title: p.currentTitle, lastLoginAt: daysAgo(int(0, 10)) }).returning({ id: s.users.id }).get().id;
  const UA = user(aarav, "candidate", "exh1b");
  const UP = user(priya, "candidate", "exh1b");
  const US_ = user(sanjay, "participant", "trustcircle");
  const UR = user(cRadhika, "client", "golden-glove", "Kaveri Digital Bank");
  const UV = user(cVikram, "client", "trustcircle", "Sahyadri Mobility");
  const UAr = user(cArjun, "client", "talent", "Lumenfield Technologies India");
  const USn = user(cSneha, "client", "advisory", "Orbitwise SaaS");
  const UK = user(cKaran, "client", "golden-glove", "Indrayani Payments");
  // a few more member logins so the community has real authors
  const memberUsers = exMembers.slice(2, 14).map((p) => ({ p, id: user(p, "candidate", "exh1b") }));

  /* org ↔ brand relationships */
  for (const [name] of INDIA_ORGS) orgBrand(name, "exh1b", "employer", U.ex);
  ["Kaveri Digital Bank", "Indrayani Payments", "Tarangini Telecom", "Aranya Healthcare", "Pragatika Renewables", "Northgate Bank GCC"].forEach((o) => orgBrand(o, "golden-glove", "client", U.gg));
  ["Lumenfield Technologies India", "Quantaloom Analytics", "Vyomika Aerospace", "Trinetra Semiconductors", "Zenrise Learning", "Northgate Bank GCC", "Orbitwise SaaS"].forEach((o) => orgBrand(o, "talent", "client", U.tal));
  tcOrgs.forEach((o) => orgBrand(o, "trustcircle", "client", U.tc));
  ["Orbitwise SaaS", "Merukand Capital", "Nilgiri Fresh Foods", "Sarthika Logistics", "Ashvika Pharma"].forEach((o) => orgBrand(o, "advisory", "client", U.adv));
  ["Halcyon Cloud Inc.", "Brightwater Systems LLC", "Fernhill Software Ltd", "Redwood Peak Analytics"].forEach((o) => orgBrand(o, "exh1b", "eor_employer", U.exeor));
  ["Coralbay Consulting India", "Kalpavriksh General Insurance"].forEach((o) => orgBrand(o, "group", "prospect", U.anand));

  /* mandates */
  type MandateRow = typeof s.mandates.$inferSelect;
  const mandates: MandateRow[] = [];
  const minYearsFor = (sen: string) => ({ Junior: 1, Mid: 4, Senior: 7, Principal: 11, Leadership: 14, CXO: 18, Board: 20 } as Record<string, number>)[sen];
  function addMandate(o: { brand: string; org: string; kind: MandateRow["kind"]; fam: string; sen: string; city: string; title?: string; confidential?: boolean; fee?: number; feeModel?: string; status?: MandateRow["status"]; owner: number; opened?: number; description?: string; openings?: number; mode?: string }) {
    const f = JOB_FAMILIES[o.fam];
    const title = o.title ?? roleFor(o.fam, o.sen);
    const sal = salaryInr(o.sen);
    const row = db
      .insert(s.mandates)
      .values({
        brandId: brandId[o.brand],
        orgId: orgId[o.org],
        kind: o.kind,
        title,
        familyId: familyId[o.fam],
        roleId: roleId[`${o.fam}:${title}`] ?? null,
        seniority: o.sen,
        locationLabel: `${o.city}, India`,
        cityId: cityId[`IN:${o.city}`] ?? null,
        countryCode: "IN",
        workMode: o.mode ?? pick(["On-site / Hybrid", "On-site / Hybrid", "On-site / Hybrid", "Remote"]),
        employmentType: "Full-time",
        description:
          o.description ??
          `${INDIA_ORGS.find((x) => x[0] === o.org)?.[1] ?? "Growing"} business hiring a ${title} to own outcomes across ${f.skills.slice(0, 2).join(" and ").toLowerCase()}. You will work with the leadership team and build a team of your own.`,
        skills: sample(f.skills, int(4, Math.min(6, f.skills.length))),
        minYears: minYearsFor(o.sen),
        salaryMin: o.kind === "job" || o.kind === "search" ? Math.round(sal * 0.9) : null,
        salaryMax: o.kind === "job" || o.kind === "search" ? Math.round(sal * 1.5) : null,
        currency: "INR",
        openings: o.openings ?? 1,
        status: o.status ?? "open",
        confidential: !!o.confidential,
        feeModel: o.feeModel ?? (o.kind === "search" ? "retained" : o.kind === "job" ? "contingent" : "fixed"),
        feeAmount: o.fee ?? (o.kind === "search" ? Math.round(sal * 0.25) : o.kind === "job" ? Math.round(sal * 0.0833) : null),
        feeCurrency: "INR",
        ownerUserId: o.owner,
        openedAt: daysAgo(o.opened ?? int(3, 90)),
        targetDate: daysAhead(int(20, 90)),
      })
      .returning()
      .get();
    mandates.push(row);
    return row;
  }

  // ExH1B returnee roles
  const exJobs: MandateRow[] = [];
  for (let i = 0; i < 42; i++) {
    const org = pick(INDIA_ORGS);
    const fam = pick(EXH1B_FAMILIES);
    exJobs.push(addMandate({ brand: "exh1b", org: org[0], kind: "job", fam, sen: pick(["Mid", "Senior", "Senior", "Principal", "Principal", "Leadership"]), city: pick(["Pune", "Bengaluru", "Bengaluru", "Hyderabad", "Mumbai", "Gurugram", "Chennai", "Noida", "Ahmedabad", "Kochi", org[3]]), owner: U.ex, opened: int(1, 40) }));
  }
  // Benchmark Talent roles
  const talentJobs: MandateRow[] = [];
  const talentClients = ["Lumenfield Technologies India", "Quantaloom Analytics", "Vyomika Aerospace", "Trinetra Semiconductors", "Zenrise Learning", "Northgate Bank GCC", "Orbitwise SaaS"];
  for (let i = 0; i < 22; i++) {
    const org = talentClients[i % talentClients.length];
    const o = INDIA_ORGS.find((x) => x[0] === org)!;
    talentJobs.push(addMandate({ brand: "talent", org, kind: "job", fam: pick(INDIA_FAMILIES), sen: pick(["Mid", "Senior", "Senior", "Principal", "Principal"]), city: o[3], owner: pick([U.tal, U.talr]), opened: int(2, 70), status: i > 18 ? "filled" : "open", openings: chance(0.3) ? int(2, 4) : 1 }));
  }
  // Golden Glove searches
  const ggSearches = [
    addMandate({ brand: "golden-glove", org: "Kaveri Digital Bank", kind: "search", fam: "engineering", sen: "CXO", title: "Chief Technology Officer", city: "Mumbai", confidential: true, owner: U.gg, opened: 34, fee: 9000000, mode: "On-site / Hybrid", description: "Confidential replacement search. The bank is moving its core platform to cloud-native architecture and needs a CTO who has run a regulated technology estate at scale and can work with the RBI." }),
    addMandate({ brand: "golden-glove", org: "Kaveri Digital Bank", kind: "search", fam: "bfsi", sen: "CXO", title: "Chief Risk Officer", city: "Mumbai", confidential: true, owner: U.gg, opened: 18, fee: 7500000, mode: "On-site / Hybrid" }),
    addMandate({ brand: "golden-glove", org: "Indrayani Payments", kind: "search", fam: "finance", sen: "CXO", title: "Chief Financial Officer", city: "Pune", owner: U.gg, opened: 41, fee: 6000000, mode: "On-site / Hybrid", description: "Pre-IPO payments company seeking its first CFO to lead fundraising, audit readiness and the listing process." }),
    addMandate({ brand: "golden-glove", org: "Tarangini Telecom", kind: "search", fam: "general-management", sen: "CXO", title: "Chief Operating Officer", city: "Gurugram", confidential: true, owner: U.gg, opened: 9, fee: 10000000, mode: "On-site / Hybrid" }),
    addMandate({ brand: "golden-glove", org: "Aranya Healthcare", kind: "search", fam: "hr", sen: "CXO", title: "Chief Human Resources Officer", city: "Hyderabad", owner: U.gg, opened: 52, fee: 5000000, mode: "On-site / Hybrid" }),
    addMandate({ brand: "golden-glove", org: "Pragatika Renewables", kind: "search", fam: "general-management", sen: "Board", title: "Independent Director", city: "Ahmedabad", owner: U.gg, opened: 25, fee: 3000000, mode: "On-site / Hybrid", feeModel: "fixed" }),
    addMandate({ brand: "golden-glove", org: "Northgate Bank GCC", kind: "search", fam: "general-management", sen: "Leadership", title: "GCC Site Leader", city: "Chennai", owner: U.gg, opened: 63, fee: 8000000, status: "filled", mode: "On-site / Hybrid" }),
    addMandate({ brand: "golden-glove", org: "Indrayani Payments", kind: "search", fam: "security", sen: "CXO", title: "Chief Information Security Officer", city: "Pune", owner: U.gg, opened: 4, fee: 4500000, mode: "On-site / Hybrid" }),
  ];
  // TrustCircle programmes
  const tcProgrammes = [
    addMandate({ brand: "trustcircle", org: "Sahyadri Mobility", kind: "outplacement", fam: "operations", sen: "Leadership", title: "Plant consolidation transition programme", city: "Pune", owner: U.tc, opened: 45, fee: 2400000, feeModel: "fixed", openings: 8, description: "Career transition support for leaders affected by the consolidation of two plants into one." }),
    addMandate({ brand: "trustcircle", org: "Rivaan Retail", kind: "outplacement", fam: "sales", sen: "Senior", title: "Regional restructuring support", city: "Mumbai", owner: U.tc, opened: 30, fee: 1500000, feeModel: "fixed", openings: 6 }),
    addMandate({ brand: "trustcircle", org: "Trinetra Semiconductors", kind: "outplacement", fam: "engineering", sen: "Senior", title: "Design-centre transition programme", city: "Bengaluru", owner: U.tc, opened: 12, fee: 1200000, feeModel: "fixed", openings: 6 }),
  ];
  // Advisory projects
  const advProjects = [
    addMandate({ brand: "advisory", org: "Orbitwise SaaS", kind: "advisory", fam: "hr", sen: "Leadership", title: "HR foundations: policies, payroll and handbook", city: "Pune", owner: U.adv, opened: 40, fee: 900000, description: "Setting up HR from scratch for a 120-person SaaS company: policies, payroll partner, POSH committee and an employee handbook." }),
    addMandate({ brand: "advisory", org: "Merukand Capital", kind: "advisory", fam: "hr", sen: "Leadership", title: "Succession plan for the investment team", city: "Mumbai", owner: U.adv, opened: 22, fee: 650000 }),
    addMandate({ brand: "advisory", org: "Nilgiri Fresh Foods", kind: "advisory", fam: "hr", sen: "Leadership", title: "Labour codes compliance review", city: "Chennai", owner: U.adv, opened: 15, fee: 1100000 }),
    addMandate({ brand: "advisory", org: "Sarthika Logistics", kind: "advisory", fam: "hr", sen: "Leadership", title: "Compensation benchmarking and pay bands", city: "New Delhi", owner: U.adv, opened: 60, fee: 750000, status: "closed" }),
    addMandate({ brand: "advisory", org: "Ashvika Pharma", kind: "advisory", fam: "hr", sen: "Leadership", title: "Retained HR advisory (annual)", city: "Ahmedabad", owner: U.adv, opened: 120, fee: 1800000, feeModel: "retainer" }),
  ];

  /* engagements */
  const asMatchPerson = (p: PersonRow) => ({ skills: p.skills, familyId: p.familyId, seniority: p.seniority, yearsExperience: p.yearsExperience, cityId: p.cityId, preferredCityIds: p.preferredCityIds, anywhereInIndia: p.anywhereInIndia, workMode: p.workMode, salaryMin: p.salaryMin, salaryCurrency: p.salaryCurrency });
  const asMatchMandate = (m: MandateRow) => ({ skills: m.skills, familyId: m.familyId, seniority: m.seniority, minYears: m.minYears, cityId: m.cityId, countryCode: m.countryCode, workMode: m.workMode, salaryMax: m.salaryMax, currency: m.currency, locationLabel: m.locationLabel });
  const engage = (m: MandateRow, p: PersonRow, stage: s.Stage, source: (typeof s.engagements.$inferInsert)["source"], ago: number, extra: Partial<typeof s.engagements.$inferInsert> = {}) => {
    const sc = scoreMatch(asMatchPerson(p), asMatchMandate(m));
    return db
      .insert(s.engagements)
      .values({ mandateId: m.id, personId: p.id, brandId: m.brandId, stage, source, matchScore: sc.score, matchReasons: { reasons: sc.reasons, gaps: sc.gaps }, createdAt: daysAgo(ago + int(1, 5)), updatedAt: daysAgo(ago), ...extra })
      .onConflictDoNothing()
      .returning()
      .get();
  };

  const openRoles = [...exJobs, ...talentJobs.filter((t) => t.status === "open")];
  for (const p of exMembers) {
    const ranked = openRoles.map((m) => ({ m, sc: scoreMatch(asMatchPerson(p), asMatchMandate(m)).score })).sort((a, b) => b.sc - a.sc).slice(0, 6);
    ranked.forEach(({ m }, i) => {
      let stage: s.Stage = "matched";
      if (p === priya) stage = (["interview", "applied", "saved", "matched", "matched", "matched"] as s.Stage[])[i];
      else if (p === aarav) stage = (["applied", "saved", "matched", "matched", "matched", "matched"] as s.Stage[])[i];
      else if (chance(0.35)) stage = pick(["saved", "applied", "applied", "screening", "interview", "offer"] as s.Stage[]);
      engage(m, p, stage, stage === "matched" ? "jev" : "applied", int(0, 30), stage === "saved" || stage === "matched" ? { relevance: chance(0.3) ? (chance(0.8) ? "relevant" : "not_relevant") : null } : {});
    });
  }
  // a couple of returnees placed
  for (const p of exMembers.slice(20, 23)) engage(pick(exJobs), p, "placed", "applied", int(5, 40));

  for (const m of talentJobs) {
    const pool = [...talentPeople, ...exMembers.slice(30, 45)];
    const ranked = pool.map((p) => ({ p, sc: scoreMatch(asMatchPerson(p), asMatchMandate(m)).score })).sort((a, b) => b.sc - a.sc).slice(0, int(5, 9));
    ranked.forEach(({ p }, i) => {
      const stage: s.Stage = m.status === "filled" && i === 0 ? "placed" : pick(["applied", "applied", "screening", "screening", "shortlisted", "interview", "offer", "rejected"] as s.Stage[]);
      engage(m, p, stage, pick(["applied", "sourced", "jev"] as const), int(0, 25), { clientDecision: stage === "shortlisted" || stage === "interview" ? pick(["pending", "interested"] as const) : null });
    });
  }

  const shareable = new Set(
    (db.select({ personId: s.consents.personId }).from(s.consents).where(and(eq(s.consents.purpose, "group_sharing"), eq(s.consents.granted, true))).all() as { personId: number }[]).map((r) => r.personId),
  );
  // Neha's cross-brand journey on the CTO search
  engage(ggSearches[0], neha, "shortlisted", "jev", 6, { clientDecision: "pending", notes: `Returned from the US via ExH1B. ${neha.yearsExperience ?? 15} years in ${JOB_FAMILIES[Object.keys(familyId).find((k) => familyId[k] === neha.familyId) ?? "engineering"].name.toLowerCase()}; strong on regulated environments.` });
  for (const m of ggSearches) {
    // a handful of on-profile leaders for each search, so the longlists are realistic
    const famSlug = Object.keys(familyId).find((k) => familyId[k] === m.familyId) ?? "general-management";
    const city = (m.locationLabel ?? "Mumbai").split(",")[0];
    for (let k = 0; k < 5; k++) execs.push(addPerson({ fam: famSlug, sen: k < 3 ? (m.seniority ?? "CXO") : "Leadership", cc: "IN", city: k % 2 ? city : pick(["Mumbai", "Bengaluru", "Pune", "Gurugram", "Hyderabad"]), brand: "golden-glove", rel: "executive", exec: true, full: true }));
    const pool = [...execs, ...exMembers.filter((p) => (p.seniority === "Leadership" || p.seniority === "Principal") && shareable.has(p.id)), neha];
    const ranked = pool.map((p) => ({ p, sc: scoreMatch(asMatchPerson(p), asMatchMandate(m)).score })).sort((a, b) => b.sc - a.sc).slice(0, 10);
    ranked.forEach(({ p }, i) => {
      let stage: s.Stage = (["shortlisted", "shortlisted", "interview", "shortlisted", "screening", "screening", "sourced", "sourced", "sourced", "rejected"] as s.Stage[])[i];
      if (m.status === "filled" && i === 0) stage = "placed";
      engage(m, p, stage, i < 4 ? "sourced" : "jev", int(0, 20), {
        clientDecision: stage === "shortlisted" ? pick(["pending", "pending", "interested"] as const) : stage === "interview" ? "interested" : null,
        notes: stage === "shortlisted" || stage === "interview" ? pick(["Strong regulatory track record; would need relocation support.", "Led a comparable transformation; references excellent.", "Open to a conversation; notice period 3 months.", "Culturally a strong fit; compensation expectations at the top of band."]) : null,
      });
    });
  }

  tcProgrammes.forEach((m, pi) => {
    tcPeople.filter((_, i) => i % 3 === pi).forEach((p) => {
      engage(m, p, "enrolled", "enrolled", int(3, 40));
      // coaching plan
      ["Transition kick-off", "Story and CV refresh", "LinkedIn and market approach", "Interview practice", "Offer evaluation"].forEach((topic, k) =>
        db.insert(s.coachingSessions).values({ personId: p.id, mandateId: m.id, coachUserId: U.tc, topic, scheduledAt: k < 2 ? daysAgo(30 - k * 10) : daysAhead(k * 6 - 6), status: k < 2 ? "done" : "planned", notes: k < 2 ? "Good energy; clear on target roles." : null }).run(),
      );
      // matched openings from across the group
      openRoles.map((m2) => ({ m2, sc: scoreMatch(asMatchPerson(p), asMatchMandate(m2)).score })).sort((a, b) => b.sc - a.sc).slice(0, 4).forEach(({ m2 }, k) => engage(m2, p, k === 0 ? "applied" : "matched", k === 0 ? "applied" : "jev", int(0, 10)));
    });
  });

  advProjects.forEach((m, i) => {
    const dl = [
      ["Discovery interviews with leadership", "done"],
      ["Current-state assessment", i === 3 ? "done" : "done"],
      ["Draft recommendations", i === 3 ? "done" : "doing"],
      ["Policy / framework documents", i === 3 ? "done" : "todo"],
      ["Leadership read-out", i === 3 ? "done" : "todo"],
    ] as const;
    dl.forEach(([title, st], k) => db.insert(s.deliverables).values({ mandateId: m.id, title, status: st, dueAt: daysAhead(k * 10 - 20), ownerUserId: U.adv }).run());
  });

  /* invoices */
  let invN = 1;
  const inv = (brand: string, org: string, m: MandateRow | null, description: string, amount: number, status: "draft" | "sent" | "paid" | "overdue", issued: number) =>
    db.insert(s.invoices).values({ brandId: brandId[brand], orgId: orgId[org], mandateId: m?.id ?? null, number: `BHR-${brand.slice(0, 2).toUpperCase()}-2026-${String(invN++).padStart(3, "0")}`, description, amount, currency: "INR", status, issuedAt: daysAgo(issued), dueAt: daysAgo(issued - 30), paidAt: status === "paid" ? daysAgo(issued - 20) : null, createdBy: "finance" }).run();
  ggSearches.forEach((m, i) => {
    const org = INDIA_ORGS.find((x) => orgId[x[0]] === m.orgId)![0];
    inv("golden-glove", org, m, `Retainer 1 of 3 — ${m.title}`, Math.round((m.feeAmount ?? 0) / 3), i % 3 === 0 ? "sent" : "paid", int(10, 60));
    if (i % 2 === 0) inv("golden-glove", org, m, `Retainer 2 of 3 — ${m.title} (shortlist)`, Math.round((m.feeAmount ?? 0) / 3), i === 0 ? "overdue" : "sent", int(3, 35));
  });
  talentJobs.filter((m) => m.status === "filled").forEach((m) => inv("talent", INDIA_ORGS.find((x) => orgId[x[0]] === m.orgId)![0], m, `Placement fee — ${m.title}`, m.feeAmount ?? 300000, "paid", int(15, 50)));
  tcProgrammes.forEach((m) => inv("trustcircle", INDIA_ORGS.find((x) => orgId[x[0]] === m.orgId)![0], m, `Programme fee — ${m.title}`, m.feeAmount ?? 0, "paid", int(10, 40)));
  advProjects.forEach((m, i) => inv("advisory", INDIA_ORGS.find((x) => orgId[x[0]] === m.orgId)![0], m, `${m.feeModel === "retainer" ? "Quarterly retainer" : "Milestone 1"} — ${m.title}`, Math.round((m.feeAmount ?? 0) / (m.feeModel === "retainer" ? 4 : 2)), i === 2 ? "sent" : "paid", int(5, 60)));

  /* ExH1B plans & subscriptions */
  const plan = (code: string, name: string, region: "IN" | "INTL", currency: string, amount: number, interval: "month" | "quarter" | "year", consults: number, features: string[]) =>
    db.insert(s.plans).values({ brandId: brandId.exh1b, code, name, region, currency, amount, interval, consultationsIncluded: consults, features }).returning().get();
  const baseFeatures = ["Personalised job discovery with match reasons", "Application tracker", "Relocation Hub and checklist", "Community access"];
  const P = {
    inM: plan("exh1b-in-month", "Monthly", "IN", "INR", 9499, "month", 1, [...baseFeatures, "One 15-minute intro call"]),
    inQ: plan("exh1b-in-quarter", "Quarterly", "IN", "INR", 24999, "quarter", 2, [...baseFeatures, "Two 30-minute career consultations", "Resume review"]),
    inY: plan("exh1b-in-year", "Annual", "IN", "INR", 89999, "year", 6, [...baseFeatures, "Six 30-minute consultations", "Resume review", "Priority support (4-hour response)"]),
    inM2: plan("exh1b-intl-month", "Monthly", "INTL", "USD", 99, "month", 1, [...baseFeatures, "One 15-minute intro call"]),
    inQ2: plan("exh1b-intl-quarter", "Quarterly", "INTL", "USD", 259, "quarter", 2, [...baseFeatures, "Two 30-minute career consultations", "Resume review"]),
    inY2: plan("exh1b-intl-year", "Annual", "INTL", "USD", 949, "year", 6, [...baseFeatures, "Six 30-minute consultations", "Resume review", "Priority support (4-hour response)"]),
  };
  const subscribe = (p: PersonRow, pl: typeof P.inM, status: "active" | "cancelled" | "expired", startedAgo: number) => {
    const periodDays = pl.interval === "month" ? 30 : pl.interval === "quarter" ? 91 : 365;
    const sub = db.insert(s.subscriptions).values({ personId: p.id, brandId: brandId.exh1b, planId: pl.id, status, regionDetected: p.countryCode === "IN" ? "IN" : "INTL", startedAt: daysAgo(startedAgo), currentPeriodEnd: status === "active" ? daysAhead(int(5, periodDays)) : daysAgo(int(10, 70)), cancelledAt: status !== "active" ? daysAgo(int(10, 70)) : null }).returning().get();
    const cycles = Math.max(1, Math.min(6, Math.floor(startedAgo / periodDays)));
    for (let c = 0; c < cycles; c++) db.insert(s.payments).values({ subscriptionId: sub.id, personId: p.id, amount: pl.amount, currency: pl.currency, status: chance(0.05) ? "failed" : "captured", gatewayRef: `pay_${Math.floor(R() * 1e14).toString(36)}`, createdAt: daysAgo(startedAgo - c * periodDays) }).run();
    return sub;
  };
  subscribe(aarav, P.inM2, "cancelled", 150);
  subscribe(priya, P.inY2, "active", 70);
  exMembers.slice(2).forEach((p) => {
    if (chance(0.55)) subscribe(p, pick([P.inM2, P.inM2, P.inQ2, P.inY2]), pick(["active", "active", "active", "cancelled", "expired"] as const), int(20, 300));
  });

  /* consultations */
  db.insert(s.consultations).values([
    { personId: priya.id, brandId: brandId.exh1b, topic: "EOR options with Halcyon Cloud", status: "done", scheduledAt: daysAgo(40), consultantUserId: U.exeor },
    { personId: priya.id, brandId: brandId.exh1b, topic: "Bengaluru vs Hyderabad: offers and cost of living", status: "scheduled", scheduledAt: daysAhead(3, 13), consultantUserId: U.ex },
    { personId: aarav.id, brandId: brandId.exh1b, topic: "15-minute intro call", status: "done", scheduledAt: daysAgo(140), consultantUserId: U.ex },
  ]).run();

  /* leads & EOR */
  const lead = (v: typeof s.leads.$inferInsert) => db.insert(s.leads).values(v).returning().get();
  const eorPeople = exMembers.filter((p) => p.openToEor).slice(0, 7);
  eorPeople.forEach((p, i) => {
    const employer = p === priya ? "Halcyon Cloud Inc." : pick(ABROAD_ORGS)[0];
    const l = lead({ brandId: brandId.exh1b, kind: "eor", name: `${p.firstName} ${p.lastName}`, email: p.email, company: employer, roleTitle: p.currentTitle, message: "Wants to keep working for current employer from India.", personId: p.id, orgId: orgId[employer], status: p === priya ? "proposal" : pick(["new", "contacted", "qualified", "proposal", "won"] as const), ownerUserId: U.exeor, score: int(60, 92), valueEstimate: int(12, 30) * 12 * 1000, currency: "USD", source: "exh1b_profile", respondBy: daysAgo(i * 3 - 1), createdAt: daysAgo(int(5, 80)) });
    if (p === priya || i % 2 === 0) db.insert(s.eorCases).values({ personId: p.id, employerOrgId: orgId[employer], leadId: l.id, step: p === priya ? 2 : int(0, 5), originCountry: p.countryCode, monthlyFee: int(800, 1400), currency: "USD", startDate: daysAhead(int(20, 90)), createdAt: l.createdAt }).run();
  });
  const enquiry = (brand: string, kind: (typeof s.leads.$inferInsert)["kind"], name: string, email: string, company: string, msg: string, status: (typeof s.leads.$inferInsert)["status"], ago: number, owner: number, value?: number) =>
    lead({ brandId: brandId[brand], kind, name, email, company, message: msg, status, ownerUserId: owner, score: int(40, 95), valueEstimate: value ?? null, currency: "INR", source: "website", respondBy: daysAgo(ago - 1), createdAt: daysAgo(ago), orgId: orgId[company] ?? null });
  enquiry("golden-glove", "search_brief", "Karan Saxena", "karan.saxena@indrayanipayments.example", "Indrayani Payments", "We need a CISO before our next audit cycle. Can we talk this week?", "won", 6, U.gg, 4500000);
  enquiry("golden-glove", "search_brief", "Deepa Raman", "deepa@kalpavriksh.example", "Kalpavriksh General Insurance", "Looking for a Chief Actuary, confidential.", "qualified", 3, U.gg, 5500000);
  enquiry("golden-glove", "search_brief", "Tom Becker", "t.becker@corvane.example", "Corvane Analytics GmbH", "Setting up an India GCC; need a site leader in Pune.", "new", 1, U.gg, 7000000);
  enquiry("talent", "hiring", "Arjun Malhotra", "arjun.malhotra@lumenfieldtechnologiesindia.example", "Lumenfield Technologies India", "Six backend engineers and two SREs for Q1.", "won", 25, U.tal, 2400000);
  enquiry("talent", "hiring", "Ritu Bansal", "ritu@zenrise.example", "Zenrise Learning", "Hiring a Head of Data.", "contacted", 4, U.talr, 600000);
  enquiry("talent", "hiring", "Gautam Rege", "gautam@coralbay.example", "Coralbay Consulting India", "Volume hiring for a new delivery centre in Kochi.", "new", 0, U.tal, 3000000);
  enquiry("trustcircle", "outplacement", "Vikram Patwardhan", "vikram.patwardhan@sahyadrimobility.example", "Sahyadri Mobility", "Plant consolidation affecting ~40 managers.", "won", 50, U.tc, 2400000);
  enquiry("trustcircle", "outplacement", "Leena Dsouza", "leena@tarangini.example", "Tarangini Telecom", "Exploring outplacement for a restructuring next quarter.", "qualified", 5, U.tc, 3000000);
  enquiry("advisory", "advisory", "Sneha Patil", "sneha.patil@orbitwisesaas.example", "Orbitwise SaaS", "Need HR set up end to end.", "won", 45, U.adv, 900000);
  enquiry("advisory", "advisory", "Harish Kamat", "harish@nilgiri.example", "Nilgiri Fresh Foods", "Labour codes readiness review.", "won", 20, U.adv, 1100000);
  enquiry("advisory", "advisory", "Pooja Hegde", "pooja@pragatika.example", "Pragatika Renewables", "POSH training and committee setup.", "new", 2, U.adv, 250000);
  enquiry("group", "enquiry", "Manoj Pillai", "manoj@coralbay.example", "Coralbay Consulting India", "Want to understand which Benchmark business fits our leadership hiring plus HR audit.", "contacted", 7, U.anand);
  enquiry("group", "enquiry", "Anjali Verma", "anjali@kalpavriksh.example", "Kalpavriksh General Insurance", "Board advisory and a CHRO search.", "new", 1, U.anand);

  /* support tickets */
  const CATS = ["Work from India with same employer", "Job Opportunities", "Profile", "ExH1B Platform", "Relocation", "Finance", "Other"];
  const slaFor = (pr: string) => ({ urgent: 4, high: 8, normal: 24, low: 48 } as Record<string, number>)[pr];
  const ticket = (brand: string, p: PersonRow | null, uid: number | null, subject: string, category: string, message: string, status: (typeof s.tickets.$inferInsert)["status"], priority: "low" | "normal" | "high" | "urgent", ago: number, assignee: number, replies: [string, string][] = []) => {
    const created = daysAgo(ago, 6);
    const sla = slaFor(priority);
    const due = new Date(new Date(created.replace(" ", "T") + "Z").getTime() + sla * 3600_000);
    const firstResp = replies.length ? daysAgo(Math.max(0, ago - 0.2), 9) : null;
    const t = db
      .insert(s.tickets)
      .values({ brandId: brandId[brand], personId: p?.id ?? null, userId: uid, subject, category, message, status, priority, assigneeUserId: assignee, slaHours: sla, slaDueAt: due.toISOString().slice(0, 19).replace("T", " "), firstResponseAt: firstResp, resolvedAt: status === "resolved" || status === "closed" ? daysAgo(Math.max(0, ago - 2)) : null, escalated: !firstResp && status === "open" && ago > 1, createdAt: created, updatedAt: daysAgo(Math.max(0, ago - 1)) })
      .returning()
      .get();
    db.insert(s.ticketMessages).values({ ticketId: t.id, authorUserId: uid, authorLabel: p ? `${p.firstName} ${p.lastName}` : "Member", body: message, createdAt: created }).run();
    replies.forEach(([who, body], i) => db.insert(s.ticketMessages).values({ ticketId: t.id, authorUserId: who === "staff" ? assignee : uid, authorLabel: who === "staff" ? null : p ? `${p.firstName} ${p.lastName}` : "Member", body, createdAt: daysAgo(Math.max(0, ago - 0.2 - i * 0.5), 9 + i) }).run());
    return t;
  };
  ticket("exh1b", aarav, UA, "Can I keep working for Blue Cedar from Pune?", CATS[0], "My employer is open to me working from India for a year. What would the EOR set-up look like and who pays the costs?", "resolved", "normal", 62, U.exeor, [["staff", "Hi Aarav, yes. ExH1B can act as your employer in India while you keep working for Blue Cedar. I've attached the one-page overview for your manager."], ["member", "Thanks, sharing with my manager now."]]);
  ticket("exh1b", aarav, UA, "Profile strength stuck at 40%", CATS[2], "I've filled in every step but the meter still says 40% and LinkedIn shows 0/15.", "resolved", "normal", 58, U.exs, [["staff", "Thanks for flagging. This was a scoring bug, now fixed, and your resume details have been read into your profile. You should see 100% now."]]);
  ticket("exh1b", priya, UP, "Payroll start date for EOR", CATS[0], "Halcyon has agreed. When can payroll in India start if I land on 15 January?", "in_progress", "high", 2, U.exeor, [["staff", "Great news. We need the signed employer consent by 20 December to run January payroll. I'll send the contract draft today."]]);
  ticket("exh1b", priya, UP, "Lease registration in Bengaluru", CATS[4], "Is registration mandatory for an 11-month lease in Bengaluru?", "waiting", "low", 4, U.exs, [["staff", "Usually 11-month agreements are notarised rather than registered, but your bank may ask for a registered one as address proof. Can you tell me which bank you're opening with?"]]);
  const subj = [
    ["Refund for duplicate charge", CATS[5], "I was charged twice this month."],
    ["Matches don't include Ahmedabad", CATS[1], "I selected Ahmedabad but see only Bengaluru roles."],
    ["How do I hide my profile from my current employer?", CATS[2], "Worried my employer will see I'm looking."],
    ["OCI for my daughter", CATS[4], "My daughter is a US citizen. How long does OCI take?"],
    ["Can't upload a .docx resume", CATS[3], "The upload spins forever."],
    ["Spouse job search", CATS[1], "Can my wife also use my membership?"],
    ["School admissions mid-year in Pune", CATS[4], "We land in March. Will schools take admissions?"],
    ["Invoice with GST number", CATS[5], "Need a GST invoice for reimbursement."],
    ["Interview scheduling across time zones", CATS[1], "Recruiter keeps booking 3 am slots."],
    ["What happens to my 401(k)?", CATS[5], "Should I roll it over before leaving?"],
  ] as const;
  subj.forEach(([sub, cat, msg], i) => {
    const m = exMembers[3 + i];
    const st = (["open", "open", "in_progress", "resolved", "resolved", "open", "in_progress", "resolved", "waiting", "open"] as const)[i];
    ticket("exh1b", m, memberUsers[i]?.id ?? null, sub, cat, msg, st, (["high", "normal", "normal", "low", "high", "low", "normal", "normal", "normal", "normal"] as const)[i], [0.1, 3, 1, 9, 12, 2.5, 1, 20, 4, 0.5][i], i % 2 ? U.exs : U.ex, st === "open" && i !== 0 && i !== 9 ? [] : st === "open" ? [] : [["staff", "Thanks, we're on it. You'll hear from us within the response time shown on this ticket."]]);
  });
  ticket("golden-glove", cRadhika, UR, "Add our CEO to the shortlist review", "Mandate", "Please give our CEO access to the CTO shortlist before Friday.", "in_progress", "high", 1, U.gg, [["staff", "Done for viewing; we'll send a calendar hold for the review."]]);
  ticket("talent", cArjun, UAr, "Interview feedback form", "Platform", "Can panel members submit feedback without logging in?", "open", "normal", 0.5, U.tal);
  ticket("talent", talentPeople[2], null, "Status of my application", "Application", "Applied two weeks ago, no update.", "open", "normal", 3, U.talr);
  ticket("trustcircle", sanjay, US_, "Reschedule interview practice", "Coaching", "Can we move Thursday's session to the following week?", "resolved", "low", 6, U.tc, [["staff", "Moved to next Wednesday, 11 am."]]);
  ticket("trustcircle", cVikram, UV, "Monthly progress report", "Programme", "Please share the October progress summary for our leadership team.", "open", "normal", 1.5, U.tc);
  ticket("advisory", cSneha, USn, "Review of leave policy draft", "Deliverable", "We have comments on section 4 of the leave policy.", "in_progress", "normal", 2, U.adv, [["staff", "Received. We'll send a revised draft by Monday."]]);

  /* community */
  const thread = (author: { name: string; uid: number | null }, title: string, body: string, tag: string, ago: number, up: number, replies: [string, number | null, boolean, string][] = [], pinned = false) => {
    const t = db.insert(s.threads).values({ brandId: brandId.exh1b, authorUserId: author.uid, authorName: author.name, title, body, tag, upvotes: up, pinned, createdAt: daysAgo(ago), lastActivityAt: daysAgo(Math.max(0, ago - replies.length)) }).returning().get();
    replies.forEach(([name, uid, expert, b], i) => db.insert(s.posts).values({ threadId: t.id, authorUserId: uid, authorName: name, isExpert: expert, body: b, createdAt: daysAgo(Math.max(0, ago - i - 0.3)) }).run());
    return t;
  };
  const mu = (i: number) => ({ name: `${memberUsers[i].p.firstName} ${memberUsers[i].p.lastName.charAt(0)}.`, uid: memberUsers[i].id });
  thread({ name: "Meera Kulkarni", uid: U.ex }, "Start here: how to get the most from ExH1B", "Welcome! Complete your profile to 100% so Jev can match you properly, set your return timeline, and work through the Relocation checklist. Ask anything here; our team answers within one business day.", "General", 120, 48, [], true);
  thread(mu(0), "Bengaluru or Hyderabad for a family of four?", "Two kids (8 and 5), both of us in tech. Commute vs schools vs rent: which city did you pick and why?", "Relocation", 21, 31, [
    [mu(1).name, mu(1).uid, false, "We picked Hyderabad: shorter commutes in the Gachibowli area and rent was about 30% lower than Whitefield for a similar flat."],
    ["Farhan Shaikh", U.exs, true, "The Relocation Hub comparator shows the rent gap. For schools, check IB/IGCSE availability near your office; mid-year admissions are easier in Hyderabad in our experience."],
    [mu(2).name, mu(2).uid, false, "Bengaluru for us because of the job market depth, but we live close to work. That's the trick."],
  ]);
  thread(mu(3), "Did anyone keep their US employer through EOR?", "Curious how employers reacted when you asked.", "Job Search", 14, 22, [
    ["Nikhil Deshpande", U.exeor, true, "Several members have. What helps: a one-page note for your manager on cost, IP and compliance. We'll draft it with you; open a ticket under 'Work from India with same employer'."],
    [mu(4).name, mu(4).uid, false, "Mine agreed for 12 months as a trial. The cost was lower than they expected."],
  ]);
  thread(mu(5), "OCI processing time from the US in 2026?", "Applied through the outsourced centre in SF. How long did yours take?", "Visa/OCI", 9, 17, [[mu(6).name, mu(6).uid, false, "About 7 weeks for us, including the courier."], ["Farhan Shaikh", U.exs, true, "Times vary by consulate; keep your old passport and the OCI together when you travel."]]);
  thread(mu(7), "Salary expectations: converting USD to an India offer", "How do you think about a fair India number vs a US salary?", "Career", 6, 26, [["Meera Kulkarni", U.ex, true, "Compare on take-home and lifestyle, not exchange rate. Your matches show each role's band; we can review an offer with you in a consultation."], [mu(8).name, mu(8).uid, false, "Don't forget RNOR status for the first couple of years; it changed our maths."]]);
  thread(mu(9), "Car or no car in Pune?", "Is it worth buying a car in the first six months?", "Relocation", 3, 8, [[mu(10).name, mu(10).uid, false, "We waited three months and used cabs. Glad we did."]]);
  thread(mu(11), "Has anyone moved back from Ireland?", "Most threads are US-centric. Anything Ireland-specific to sort before leaving?", "Relocation", 2, 5, [["Farhan Shaikh", U.exs, true, "Your checklist now shows Ireland items, including your final payslip, Revenue record and PRSI. Happy to go through it on a call."]]);
  thread(mu(1), "Interview loops in India: how many rounds is normal?", "Had six rounds at one company. Is that typical for principal roles?", "Job Search", 1, 4, []);
  thread(mu(2), "Notice period negotiations", "Companies want 30 days but my H-1B end date is fixed. Any tips?", "Career", 0.5, 2, []);

  /* notifications */
  const notify = (uid: number, title: string, body: string, href: string, ago: number, read = false) => db.insert(s.notifications).values({ userId: uid, title, body, href, read, createdAt: daysAgo(ago) }).run();
  notify(UA, "6 new roles match your profile", "Your top match is 86%. Resubscribe to see them.", "/exh1b/jobs", 1);
  notify(UA, "Ticket resolved", "Profile strength stuck at 40%", "/exh1b/dashboard/support", 50, true);
  notify(UP, "Interview scheduled", "Your interview is confirmed for next week.", "/exh1b/jobs#application-tracker", 1);
  notify(UP, "EOR contract draft ready", "Review and share with Halcyon Cloud.", "/exh1b/dashboard", 2);
  notify(UR, "3 candidates await your decision", "CTO search shortlist updated.", "/goldenglove/portal", 1);
  notify(U.gg, "Jev proposed a longlist", "10 people for the CISO search. Approve before outreach.", "/console/mandates", 3);
  notify(U.ex, "New EOR lead", "Priya Nair (Halcyon Cloud) — respond within 1 business day.", "/console/leads", 60, true);

  /* interactions */
  [
    [priya.id, U.exeor, "call", "Discussed EOR with Priya; Halcyon's HR is supportive, legal reviewing IP clauses."],
    [priya.id, U.ex, "note", "Prefers Bengaluru; Hyderabad if the offer is strong. Kids' school starts in June."],
    [aarav.id, U.ex, "email", "Sent winback note with this week's match count."],
    [neha.id, U.gg, "meeting", "First confidential conversation re: CTO search at a private bank. Interested; wants to understand the board's mandate."],
    [sanjay.id, U.tc, "meeting", "Kick-off done. Targeting plant head or operations director roles in Pune or Chakan."],
  ].forEach(([pid, uid, kind, summary], i) => db.insert(s.interactions).values({ personId: pid as number, userId: uid as number, kind: kind as "note", summary: summary as string, occurredAt: daysAgo(i * 4 + 1) }).run());

  /* Jev automations + history */
  for (const a of AUTOMATIONS) db.insert(s.jevAutomations).values({ key: a.key, name: a.name, description: a.description, trigger: a.trigger, brandScope: a.brandScope, humanApproval: a.humanApproval, enabled: true, runs: int(12, 400), lastRunAt: daysAgo(int(0, 3)) }).run();
  const run = (key: string, trigger: string, entity: string, id: number, brand: string, summary: string, ago: number, status: "ok" | "skipped" | "error" = "ok") => db.insert(s.jevRuns).values({ automationKey: key, trigger, entity, entityId: id, brandId: brandId[brand], status, summary, createdAt: daysAgo(ago, int(5, 17)) }).run();
  const parsed = parseResume(aarav.resumeText ?? "");
  run("resume-parse", "resume.uploaded", "person", aarav.id, "exh1b", `Read resume: ${parsed.currentTitle ?? "title"} · ${parsed.yearsExperience ?? "?"} yrs · ${parsed.skills.length} skills added`, 57);
  run("match-refresh", "profile.updated", "person", aarav.id, "exh1b", "6 matches refreshed; top match 84%", 1);
  run("eor-lead", "profile.updated", "person", priya.id, "exh1b", "EOR lead opened for Halcyon Cloud Inc.; assigned to Nikhil Deshpande", 60);
  run("ticket-triage", "ticket.created", "ticket", 3, "exh1b", "Category confirmed; priority high; SLA 8h; assigned to Nikhil Deshpande", 2);
  run("shortlist-builder", "mandate.created", "mandate", ggSearches[7].id, "golden-glove", "Longlist of 10 proposed from 1,000+ group records; awaiting partner approval", 3);
  run("lead-router", "lead.created", "lead", 3, "golden-glove", "Scored 88; linked to Corvane Analytics GmbH; routed to Ishita Rao", 1);
  run("transition-plan", "outplacement.enrolled", "person", sanjay.id, "trustcircle", "5 coaching sessions planned; 4 matched openings", 40);
  run("winback", "subscription.lapsed", "person", aarav.id, "exh1b", "Nudge sent: 6 new matching roles", 1);
  run("community-concierge", "thread.created", "thread", 8, "exh1b", "Draft reply prepared for moderator", 1);
  run("sla-sweep", "schedule.hourly", "ticket", 0, "group", "2 tickets past SLA escalated", 0);
  run("placement-invoice", "engagement.placed", "mandate", ggSearches[6].id, "golden-glove", "Draft invoice created for final retainer", 8);
  run("resume-parse", "resume.uploaded", "person", exMembers[9].id, "exh1b", "Resume unreadable (scanned image); asked member to upload text PDF", 12, "skipped");
  for (let i = 0; i < 30; i++) {
    const p = pick(exMembers);
    run(pick(["match-refresh", "resume-parse", "ticket-triage", "lead-router"]), "profile.updated", "person", p.id, "exh1b", `Processed ${p.firstName} ${p.lastName}`, int(2, 45));
  }

  /* audit */
  [
    [U.anand, "Anand Joshi", "login", "user", U.anand],
    [U.gg, "Ishita Rao", "approved_longlist", "mandate", ggSearches[0].id],
    [UR, "Radhika Iyer", "viewed_shortlist", "mandate", ggSearches[0].id],
    [U.ex, "Meera Kulkarni", "merged_duplicate", "person", neha.id],
    [U.admin, "Platform Administrator", "updated_automation", "jev_automation", 1],
  ].forEach(([uid, actor, action, entity, id], i) => db.insert(s.auditLog).values({ userId: uid as number, actor: actor as string, action: action as string, entity: entity as string, entityId: id as number, createdAt: daysAgo(i) }).run());

  // relocation progress for demo members
  const items = db.select().from(s.relocationItems).all();
  items.filter((i) => i.appliesTo.includes("*") || i.appliesTo.includes("US")).slice(0, 14).forEach((i) => db.insert(s.relocationProgress).values({ personId: priya.id, itemId: i.id, done: true, updatedAt: daysAgo(int(1, 30)) }).run());
  items.filter((i) => i.appliesTo.includes("*")).slice(0, 4).forEach((i) => db.insert(s.relocationProgress).values({ personId: aarav.id, itemId: i.id, done: true, updatedAt: daysAgo(int(60, 90)) }).run());
}
