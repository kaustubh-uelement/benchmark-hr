export type BrandSlug = "group" | "golden-glove" | "talent" | "exh1b" | "trustcircle" | "advisory";

export type BrandDef = {
  slug: BrandSlug;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  kind: "group" | "subsidiary";
  status: "live" | "beta" | "coming";
  base: string; // route prefix in this app
  domain: string; // production domain (see middleware.ts)
  accent: string; // used for brand chips in the console
};

export const BRANDS: BrandDef[] = [
  {
    slug: "group",
    name: "Benchmark HR Group",
    shortName: "Benchmark HR",
    tagline: "Find the leader. Build the team.",
    description: "Executive search, team hiring, returnee careers, outplacement and HR advisory for founder-led businesses that take their people seriously.",
    kind: "group",
    status: "live",
    base: "/",
    domain: "benchmarkhr.in",
    accent: "#490b1a",
  },
  {
    slug: "golden-glove",
    name: "Golden Glove Executive Search",
    shortName: "Golden Glove",
    tagline: "The leader",
    description: "Retained, partner-led search for CXO, board and rare specialist roles, in India and across borders.",
    kind: "subsidiary",
    status: "live",
    base: "/goldenglove",
    domain: "goldenglove.in",
    accent: "#b8913f",
  },
  {
    slug: "talent",
    name: "Benchmark Talent",
    shortName: "Talent",
    tagline: "The team",
    description: "Mid-senior and specialist hiring for scale-ups and global capability centres.",
    kind: "subsidiary",
    status: "live",
    base: "/talent",
    domain: "talent.benchmarkhr.in",
    accent: "#2747f5",
  },
  {
    slug: "exh1b",
    name: "ExH1B",
    shortName: "ExH1B",
    tagline: "Coming home",
    description: "Careers in India for professionals returning from abroad, and India employment for their current employers.",
    kind: "subsidiary",
    status: "live",
    base: "/exh1b",
    domain: "exh1b.com",
    accent: "#127c7a",
  },
  {
    slug: "trustcircle",
    name: "TrustCircle Outplacements",
    shortName: "TrustCircle",
    tagline: "The next chapter",
    description: "Career transition for leaders and teams going through restructuring or change.",
    kind: "subsidiary",
    status: "live",
    base: "/trustcircle",
    domain: "trustcircle.in",
    accent: "#2f6b5c",
  },
  {
    slug: "advisory",
    name: "Benchmark Advisory",
    shortName: "Advisory",
    tagline: "Before the hire",
    description: "People strategy, succession, policies and compliance, on retainer or as a project.",
    kind: "subsidiary",
    status: "live",
    base: "/advisory",
    domain: "advisory.benchmarkhr.in",
    accent: "#3d5a80",
  },
];

export const brandBySlug = (s: string) => BRANDS.find((b) => b.slug === s);

export const COMING_NEXT = [
  { name: "Benchmark Interim", line: "Interim executives and specialists on short notice." },
  { name: "GCC LaunchPad", line: "Leadership and first-100 hiring for new capability centres." },
  { name: "BoardBench", line: "Independent directors and board advisory." },
  { name: "LeaderLens", line: "Leadership assessment and 360 reviews." },
];

/** Brand identity colours for chips and markers (always shown with the brand name). */
export const BRAND_COLORS: Record<string, string> = {
  group: "#490b1a",
  "golden-glove": "#a8842f",
  talent: "#2747f5",
  exh1b: "#127c7a",
  trustcircle: "#2f6b5c",
  advisory: "#3d5a80",
};
