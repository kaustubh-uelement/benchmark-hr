/**
 * Job families and roles, modelled on the family → role structure used by
 * LinkedIn and Naukri, so the platform serves executive search and
 * non-tech returnees as well as engineers.
 */
export const JOB_FAMILIES: Record<string, { name: string; roles: string[]; skills: string[] }> = {
  "general-management": {
    name: "General Management & Leadership",
    roles: ["Chief Executive Officer", "Chief Operating Officer", "Managing Director", "Business Unit Head", "Country Manager", "GCC Site Leader"],
    skills: ["P&L ownership", "Strategy", "Board reporting", "M&A", "Turnaround", "Org design", "Stakeholder management", "Fundraising"],
  },
  engineering: {
    name: "Software Engineering",
    roles: ["Backend Engineer", "Frontend Engineer", "Full-stack Engineer", "Mobile Engineer", "Engineering Manager", "Staff Engineer", "VP Engineering", "Chief Technology Officer"],
    skills: ["Java", "Go", "Python", "TypeScript", "React", "Node.js", "Kubernetes", "AWS", "Microservices", "System design", "Kotlin", "Distributed systems"],
  },
  data: {
    name: "Data, AI & Analytics",
    roles: ["Data Engineer", "Data Scientist", "ML Engineer", "Analytics Manager", "Head of Data", "Chief Data Officer", "AI Research Scientist"],
    skills: ["Python", "SQL", "Spark", "Machine learning", "LLMs", "MLOps", "dbt", "Snowflake", "Statistics", "PyTorch"],
  },
  product: {
    name: "Product Management",
    roles: ["Product Manager", "Senior Product Manager", "Group Product Manager", "Director of Product", "Chief Product Officer"],
    skills: ["Product strategy", "Roadmapping", "Discovery", "B2B SaaS", "Analytics", "Pricing", "Go-to-market"],
  },
  design: {
    name: "Design & UX",
    roles: ["Product Designer", "UX Researcher", "Design Manager", "Head of Design"],
    skills: ["Figma", "Design systems", "User research", "Interaction design", "Accessibility"],
  },
  infrastructure: {
    name: "IT, Cloud & Infrastructure",
    roles: ["Cloud Architect", "SRE", "DevOps Engineer", "IT Director", "Chief Information Officer", "Data Centre Operations Head"],
    skills: ["AWS", "Azure", "GCP", "Terraform", "Kubernetes", "Networking", "ITIL", "Data centre operations", "VMware"],
  },
  security: {
    name: "Cybersecurity",
    roles: ["Security Engineer", "Security Architect", "SOC Manager", "Head of Security", "Chief Information Security Officer"],
    skills: ["Threat modelling", "IAM", "Cloud security", "SOC", "ISO 27001", "Post-quantum cryptography", "Incident response", "GRC"],
  },
  finance: {
    name: "Finance & Accounting",
    roles: ["Financial Controller", "FP&A Manager", "Finance Director", "Chief Financial Officer", "Treasury Manager", "Head of Tax"],
    skills: ["FP&A", "IFRS", "Ind AS", "Treasury", "Fundraising", "Audit", "SAP FICO", "Taxation", "Investor relations"],
  },
  bfsi: {
    name: "Banking & Financial Services",
    roles: ["Relationship Manager", "Risk Manager", "Credit Head", "Head of Retail Banking", "Chief Risk Officer", "Investment Banking Director"],
    skills: ["Credit risk", "Basel III", "Wealth management", "Payments", "Lending", "Compliance", "Capital markets"],
  },
  sales: {
    name: "Sales & Business Development",
    roles: ["Account Executive", "Enterprise Sales Manager", "Regional Sales Head", "VP Sales", "Chief Revenue Officer", "Partnerships Lead"],
    skills: ["Enterprise sales", "Channel partnerships", "Key accounts", "Salesforce", "Negotiation", "Pipeline management", "SaaS sales"],
  },
  marketing: {
    name: "Marketing & Communications",
    roles: ["Marketing Manager", "Brand Manager", "Growth Lead", "Head of Marketing", "Chief Marketing Officer", "Corporate Communications Head"],
    skills: ["Brand strategy", "Performance marketing", "Content", "PR", "Demand generation", "Product marketing"],
  },
  hr: {
    name: "Human Resources & People",
    roles: ["HR Business Partner", "Talent Acquisition Lead", "Compensation & Benefits Manager", "Head of HR", "Chief Human Resources Officer", "L&D Head"],
    skills: ["Talent acquisition", "Employee relations", "Compensation", "HR policy", "Labour law", "L&D", "HRIS", "Org development"],
  },
  legal: {
    name: "Legal, Risk & Compliance",
    roles: ["Legal Counsel", "Compliance Manager", "Company Secretary", "General Counsel", "Head of Compliance"],
    skills: ["Contracts", "Corporate law", "Regulatory compliance", "DPDP Act", "GDPR", "Company secretarial", "Litigation"],
  },
  operations: {
    name: "Operations & Supply Chain",
    roles: ["Operations Manager", "Supply Chain Manager", "Procurement Head", "Plant Head", "VP Operations"],
    skills: ["Supply chain", "Procurement", "Lean", "Six Sigma", "Logistics", "Vendor management", "S&OP"],
  },
  manufacturing: {
    name: "Manufacturing & Core Engineering",
    roles: ["Design Engineer", "Quality Head", "Production Manager", "R&D Head", "Plant Director"],
    skills: ["Automotive", "Industrial automation", "CAD", "Quality systems", "IATF 16949", "Industry 4.0", "Embedded systems"],
  },
  healthcare: {
    name: "Healthcare & Life Sciences",
    roles: ["Clinical Research Manager", "Medical Affairs Head", "Regulatory Affairs Manager", "Hospital Administrator", "Pharma R&D Director"],
    skills: ["Clinical trials", "GxP", "Regulatory affairs", "Pharmacovigilance", "Healthcare operations", "Biotech"],
  },
  consulting: {
    name: "Consulting & Strategy",
    roles: ["Management Consultant", "Strategy Manager", "Principal", "Partner", "Chief of Staff"],
    skills: ["Strategy", "Business transformation", "Due diligence", "Operating model", "Stakeholder management"],
  },
  customer: {
    name: "Customer Success & Support",
    roles: ["Customer Success Manager", "Support Lead", "Head of Customer Success", "Implementation Manager"],
    skills: ["Customer success", "Onboarding", "Renewals", "Support operations", "SaaS"],
  },
  education: {
    name: "Education & Research",
    roles: ["Professor", "Research Scientist", "Academic Director", "Training Head"],
    skills: ["Research", "Curriculum design", "Grant writing", "Teaching"],
  },
};

export const SENIORITY = ["Junior", "Mid", "Senior", "Principal", "Leadership", "CXO", "Board"] as const;

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Consulting", "Internship", "Temporary"];
export const WORK_MODES = ["On-site / Hybrid", "Remote", "Either"];
export const RETURN_TIMELINES = [
  "Immediate (within 3 months)",
  "Within 6 months",
  "Within 1 year",
  "More than 1 year",
  "Casually looking",
  "Not sure yet",
];
export const COMPANY_TYPES = [
  "Early-stage startup",
  "Mid/late-stage startup",
  "Enterprise product company",
  "Global capability centre (GCC)",
  "Small/mid services company",
  "Large services company",
  "Indian conglomerate",
  "Public sector / PSU",
];
export const NOTICE_PERIODS = ["Immediate", "15 days", "30 days", "60 days", "90 days", "More than 90 days"];
export const VISA_STATUSES = [
  "Indian citizen",
  "OCI cardholder",
  "Foreign national (needs Employment Visa)",
  "H-1B (US)",
  "Green card (US)",
  "Skilled Worker visa (UK)",
  "EU Blue Card",
  "Golden visa / residence (UAE)",
  "Permanent resident (other)",
  "Other",
];

/** Skills dictionary used by Jev's resume parser — every family's skills plus common extras. */
export function allSkills() {
  const s = new Set<string>();
  for (const f of Object.values(JOB_FAMILIES)) f.skills.forEach((k) => s.add(k));
  ["Leadership", "Agile", "Scrum", "Excel", "Power BI", "Tableau", "C++", "C#", ".NET", "Rust", "Scala", "Docker", "Linux", "Kafka", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "Salesforce", "SAP", "Oracle", "ServiceNow", "Jira", "People management", "Six Sigma"].forEach((k) => s.add(k));
  return [...s];
}
