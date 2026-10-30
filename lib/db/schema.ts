/**
 * Benchmark HR Group — unified database ("Party Graph").
 *
 * One schema serves every brand: the group site, ExH1B, Golden Glove,
 * TrustCircle, Benchmark Talent and Benchmark Advisory. A person or an
 * organisation exists exactly once; brands attach to them through
 * person_brands / org_brands, and visibility across brands is governed by
 * consents plus the brand scope enforced in lib/access.ts.
 *
 * SQLite for development; every type here maps 1:1 to Postgres
 * (swap drizzle-orm/sqlite-core for drizzle-orm/pg-core).
 */
import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const now = sql`(CURRENT_TIMESTAMP)`;
const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();
const bool = (name: string) => integer(name, { mode: "boolean" });

/* ───────────────────────── Group & identity ───────────────────────── */

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  kind: text("kind").$type<"group" | "subsidiary">().notNull(),
  status: text("status").$type<"live" | "beta" | "coming">().notNull().default("live"),
  domain: text("domain"),
  sort: integer("sort").notNull().default(0),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role")
    .$type<"group_admin" | "brand_admin" | "recruiter" | "client" | "candidate" | "participant">()
    .notNull(),
  brandId: integer("brand_id").references(() => brands.id),
  personId: integer("person_id"),
  orgId: integer("org_id"),
  title: text("title"),
  createdAt: text("created_at").notNull().default(now),
  lastLoginAt: text("last_login_at"),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(now),
  expiresAt: text("expires_at").notNull(),
});

/* ───────────────────────── Reference data ───────────────────────── */

export const countries = sqliteTable("countries", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  region: text("region"),
  dialCode: text("dial_code"),
});

export const states = sqliteTable(
  "states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    countryCode: text("country_code").notNull().references(() => countries.code),
    name: text("name").notNull(),
  },
  (t) => [index("states_country").on(t.countryCode)],
);

export const cities = sqliteTable(
  "cities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    stateId: integer("state_id").references(() => states.id),
    countryCode: text("country_code").notNull().references(() => countries.code),
    name: text("name").notNull(),
    isMetro: bool("is_metro").notNull().default(false),
  },
  (t) => [index("cities_state").on(t.stateId), index("cities_country").on(t.countryCode)],
);

export const jobFamilies = sqliteTable("job_families", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const jobRoles = sqliteTable("job_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: integer("family_id").notNull().references(() => jobFamilies.id),
  name: text("name").notNull(),
});

/* ───────────────────────── People (golden record) ───────────────────────── */

export const people = sqliteTable(
  "people",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),
    headline: text("headline"),
    currentTitle: text("current_title"),
    currentCompany: text("current_company"),
    yearsExperience: real("years_experience"),
    seniority: text("seniority"),
    familyId: integer("family_id").references(() => jobFamilies.id),
    roleId: integer("role_id").references(() => jobRoles.id),
    skills: json<string[]>("skills").notNull().default(sql`'[]'`),
    countryCode: text("country_code").references(() => countries.code),
    stateId: integer("state_id").references(() => states.id),
    cityId: integer("city_id").references(() => cities.id),
    locationLabel: text("location_label"),
    returnTimeline: text("return_timeline"),
    openToEor: bool("open_to_eor"),
    employmentTypes: json<string[]>("employment_types").notNull().default(sql`'[]'`),
    workMode: text("work_mode"),
    preferredCityIds: json<number[]>("preferred_city_ids").notNull().default(sql`'[]'`),
    anywhereInIndia: bool("anywhere_in_india").notNull().default(false),
    remoteScope: text("remote_scope"),
    remoteCountries: json<string[]>("remote_countries").notNull().default(sql`'[]'`),
    preferredCompanyTypes: json<string[]>("preferred_company_types").notNull().default(sql`'[]'`),
    preferenceNotes: text("preference_notes"),
    noticePeriod: text("notice_period"),
    visaStatus: text("visa_status"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency").default("USD"),
    additionalInfo: text("additional_info"),
    profileVisibility: text("profile_visibility").$type<"private" | "shareable">().notNull().default("private"),
    resumeFilename: text("resume_filename"),
    resumeText: text("resume_text"),
    resumeParsedAt: text("resume_parsed_at"),
    stepsSaved: json<number[]>("steps_saved").notNull().default(sql`'[]'`),
    isExecutive: bool("is_executive").notNull().default(false),
    sourceBrandId: integer("source_brand_id").references(() => brands.id),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [index("people_family").on(t.familyId), index("people_country").on(t.countryCode)],
);

export const personBrands = sqliteTable(
  "person_brands",
  {
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    brandId: integer("brand_id").notNull().references(() => brands.id),
    relationship: text("relationship")
      .$type<"candidate" | "member" | "participant" | "executive" | "alumni" | "client_contact">()
      .notNull(),
    since: text("since").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.personId, t.brandId, t.relationship] })],
);

export const consents = sqliteTable("consents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  purpose: text("purpose").$type<"group_sharing" | "ai_matching" | "marketing">().notNull(),
  granted: bool("granted").notNull(),
  source: text("source").notNull(),
  capturedAt: text("captured_at").notNull().default(now),
});

/* ───────────────────────── Organisations ───────────────────────── */

export const organisations = sqliteTable("organisations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  industry: text("industry"),
  countryCode: text("country_code").references(() => countries.code),
  city: text("city"),
  sizeBand: text("size_band"),
  companyType: text("company_type"),
  website: text("website"),
  description: text("description"),
  createdAt: text("created_at").notNull().default(now),
});

export const orgBrands = sqliteTable(
  "org_brands",
  {
    orgId: integer("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    brandId: integer("brand_id").notNull().references(() => brands.id),
    relationship: text("relationship").$type<"client" | "employer" | "eor_employer" | "prospect">().notNull(),
    ownerUserId: integer("owner_user_id").references(() => users.id),
    since: text("since").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.brandId, t.relationship] })],
);

export const orgContacts = sqliteTable(
  "org_contacts",
  {
    orgId: integer("org_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    title: text("title"),
    isPrimary: bool("is_primary").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.orgId, t.personId] })],
);

/* ───────────────────────── Mandates & engagements ───────────────────────── */

export const mandates = sqliteTable(
  "mandates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    brandId: integer("brand_id").notNull().references(() => brands.id),
    orgId: integer("org_id").references(() => organisations.id),
    kind: text("kind").$type<"job" | "search" | "outplacement" | "advisory">().notNull(),
    title: text("title").notNull(),
    familyId: integer("family_id").references(() => jobFamilies.id),
    roleId: integer("role_id").references(() => jobRoles.id),
    seniority: text("seniority"),
    locationLabel: text("location_label"),
    cityId: integer("city_id").references(() => cities.id),
    countryCode: text("country_code").references(() => countries.code),
    workMode: text("work_mode"),
    employmentType: text("employment_type"),
    description: text("description"),
    skills: json<string[]>("skills").notNull().default(sql`'[]'`),
    minYears: real("min_years"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: text("currency"),
    openings: integer("openings").notNull().default(1),
    status: text("status").$type<"draft" | "open" | "on_hold" | "filled" | "closed">().notNull().default("open"),
    confidential: bool("confidential").notNull().default(false),
    feeModel: text("fee_model"),
    feeAmount: integer("fee_amount"),
    feeCurrency: text("fee_currency"),
    ownerUserId: integer("owner_user_id").references(() => users.id),
    openedAt: text("opened_at").notNull().default(now),
    targetDate: text("target_date"),
    closedAt: text("closed_at"),
  },
  (t) => [index("mandates_brand").on(t.brandId), index("mandates_org").on(t.orgId)],
);

export const STAGES = [
  "matched",
  "saved",
  "applied",
  "sourced",
  "screening",
  "shortlisted",
  "interview",
  "offer",
  "placed",
  "enrolled",
  "rejected",
  "withdrawn",
] as const;
export type Stage = (typeof STAGES)[number];

export const engagements = sqliteTable(
  "engagements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mandateId: integer("mandate_id").notNull().references(() => mandates.id, { onDelete: "cascade" }),
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    brandId: integer("brand_id").notNull().references(() => brands.id),
    stage: text("stage").$type<Stage>().notNull(),
    source: text("source").$type<"jev" | "applied" | "referral" | "sourced" | "enrolled">().notNull(),
    matchScore: integer("match_score"),
    matchReasons: json<{ reasons: string[]; gaps: string[] }>("match_reasons"),
    relevance: text("relevance").$type<"relevant" | "not_relevant">(),
    clientDecision: text("client_decision").$type<"pending" | "interested" | "declined">(),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("engagement_unique").on(t.mandateId, t.personId),
    index("engagements_person").on(t.personId),
  ],
);

export const interactions = sqliteTable("interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").references(() => brands.id),
  personId: integer("person_id").references(() => people.id, { onDelete: "cascade" }),
  orgId: integer("org_id").references(() => organisations.id),
  mandateId: integer("mandate_id").references(() => mandates.id),
  userId: integer("user_id").references(() => users.id),
  kind: text("kind").$type<"note" | "call" | "email" | "meeting" | "interview" | "system">().notNull(),
  summary: text("summary").notNull(),
  occurredAt: text("occurred_at").notNull().default(now),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").references(() => people.id, { onDelete: "cascade" }),
  orgId: integer("org_id").references(() => organisations.id),
  brandId: integer("brand_id").references(() => brands.id),
  kind: text("kind").$type<"resume" | "contract" | "offer" | "report" | "other">().notNull(),
  filename: text("filename").notNull(),
  mime: text("mime"),
  size: integer("size"),
  storagePath: text("storage_path"),
  createdAt: text("created_at").notNull().default(now),
});

/* ───────────────────────── Leads & EOR ───────────────────────── */

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  kind: text("kind").$type<"enquiry" | "eor" | "search_brief" | "outplacement" | "advisory" | "hiring">().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  roleTitle: text("role_title"),
  message: text("message"),
  personId: integer("person_id").references(() => people.id),
  orgId: integer("org_id").references(() => organisations.id),
  status: text("status").$type<"new" | "contacted" | "qualified" | "proposal" | "won" | "lost">().notNull().default("new"),
  ownerUserId: integer("owner_user_id").references(() => users.id),
  score: integer("score"),
  valueEstimate: integer("value_estimate"),
  currency: text("currency"),
  source: text("source").notNull(),
  respondBy: text("respond_by"),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

export const EOR_STEPS = ["Intake", "Employer consent", "Contract", "Payroll setup", "Compliance", "Active"] as const;

export const eorCases = sqliteTable("eor_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  employerOrgId: integer("employer_org_id").references(() => organisations.id),
  leadId: integer("lead_id").references(() => leads.id),
  step: integer("step").notNull().default(0),
  originCountry: text("origin_country"),
  monthlyFee: integer("monthly_fee"),
  currency: text("currency"),
  startDate: text("start_date"),
  createdAt: text("created_at").notNull().default(now),
});

/* ───────────────────────── Support ───────────────────────── */

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  personId: integer("person_id").references(() => people.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  status: text("status").$type<"open" | "in_progress" | "waiting" | "resolved" | "closed">().notNull().default("open"),
  priority: text("priority").$type<"low" | "normal" | "high" | "urgent">().notNull().default("normal"),
  assigneeUserId: integer("assignee_user_id").references(() => users.id),
  slaHours: integer("sla_hours"),
  slaDueAt: text("sla_due_at"),
  firstResponseAt: text("first_response_at"),
  resolvedAt: text("resolved_at"),
  escalated: bool("escalated").notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
  updatedAt: text("updated_at").notNull().default(now),
});

export const ticketMessages = sqliteTable("ticket_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  authorUserId: integer("author_user_id").references(() => users.id),
  authorLabel: text("author_label"),
  body: text("body").notNull(),
  internal: bool("internal").notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
});

/* ───────────────────────── Community ───────────────────────── */

export const threads = sqliteTable("threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  authorUserId: integer("author_user_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tag: text("tag").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  pinned: bool("pinned").notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
  lastActivityAt: text("last_activity_at").notNull().default(now),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  authorUserId: integer("author_user_id").references(() => users.id),
  authorName: text("author_name").notNull(),
  isExpert: bool("is_expert").notNull().default(false),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(now),
});

export const threadVotes = sqliteTable(
  "thread_votes",
  {
    threadId: integer("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.threadId, t.userId] })],
);

/* ───────────────────────── Relocation ───────────────────────── */

export const relocationItems = sqliteTable("relocation_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  section: text("section").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  appliesTo: json<string[]>("applies_to").notNull().default(sql`'["*"]'`),
  sort: integer("sort").notNull().default(0),
});

export const relocationProgress = sqliteTable(
  "relocation_progress",
  {
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    itemId: integer("item_id").notNull().references(() => relocationItems.id, { onDelete: "cascade" }),
    done: bool("done").notNull().default(true),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.personId, t.itemId] })],
);

export const costOfLiving = sqliteTable("cost_of_living", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  city: text("city").notNull().unique(),
  rent1bhk: integer("rent_1bhk").notNull(),
  rent2bhk: integer("rent_2bhk").notNull(),
  groceries: integer("groceries").notNull(),
  transport: integer("transport").notNull(),
  utilities: integer("utilities").notNull(),
  dining: integer("dining").notNull(),
});

/* ───────────────────────── Billing ───────────────────────── */

export const plans = sqliteTable("plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  region: text("region").$type<"IN" | "INTL">().notNull(),
  currency: text("currency").notNull(),
  amount: integer("amount").notNull(),
  interval: text("interval").$type<"month" | "quarter" | "year">().notNull(),
  features: json<string[]>("features").notNull().default(sql`'[]'`),
  consultationsIncluded: integer("consultations_included").notNull().default(0),
  active: bool("active").notNull().default(true),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  planId: integer("plan_id").notNull().references(() => plans.id),
  status: text("status").$type<"active" | "cancelled" | "past_due" | "expired">().notNull(),
  regionDetected: text("region_detected"),
  startedAt: text("started_at").notNull().default(now),
  currentPeriodEnd: text("current_period_end").notNull(),
  cancelledAt: text("cancelled_at"),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  personId: integer("person_id").references(() => people.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").$type<"captured" | "failed" | "refunded">().notNull(),
  gateway: text("gateway").notNull().default("razorpay"),
  gatewayRef: text("gateway_ref"),
  createdAt: text("created_at").notNull().default(now),
});

export const consultations = sqliteTable("consultations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  topic: text("topic").notNull(),
  status: text("status").$type<"requested" | "scheduled" | "done" | "cancelled">().notNull().default("requested"),
  scheduledAt: text("scheduled_at"),
  consultantUserId: integer("consultant_user_id").references(() => users.id),
  createdAt: text("created_at").notNull().default(now),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  orgId: integer("org_id").references(() => organisations.id),
  mandateId: integer("mandate_id").references(() => mandates.id),
  number: text("number").notNull().unique(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").$type<"draft" | "sent" | "paid" | "overdue">().notNull(),
  issuedAt: text("issued_at"),
  dueAt: text("due_at"),
  paidAt: text("paid_at"),
  createdBy: text("created_by"),
});

/* ───────────────────────── TrustCircle & Advisory ───────────────────────── */

export const coachingSessions = sqliteTable("coaching_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  mandateId: integer("mandate_id").references(() => mandates.id, { onDelete: "cascade" }),
  coachUserId: integer("coach_user_id").references(() => users.id),
  topic: text("topic").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").$type<"planned" | "done" | "missed">().notNull().default("planned"),
  notes: text("notes"),
});

export const deliverables = sqliteTable("deliverables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mandateId: integer("mandate_id").notNull().references(() => mandates.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").$type<"todo" | "doing" | "review" | "done">().notNull().default("todo"),
  dueAt: text("due_at"),
  ownerUserId: integer("owner_user_id").references(() => users.id),
});

/* ───────────────────────── Platform: notifications, audit, Jev ───────────────────────── */

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  read: bool("read").notNull().default(false),
  createdAt: text("created_at").notNull().default(now),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  brandId: integer("brand_id").references(() => brands.id),
  detail: text("detail"),
  createdAt: text("created_at").notNull().default(now),
});

export const jevAutomations = sqliteTable("jev_automations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  trigger: text("trigger").notNull(),
  brandScope: text("brand_scope").notNull().default("all"),
  humanApproval: bool("human_approval").notNull().default(false),
  enabled: bool("enabled").notNull().default(true),
  runs: integer("runs").notNull().default(0),
  lastRunAt: text("last_run_at"),
});

export const jevRuns = sqliteTable("jev_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  automationKey: text("automation_key").notNull(),
  trigger: text("trigger").notNull(),
  entity: text("entity"),
  entityId: integer("entity_id"),
  brandId: integer("brand_id").references(() => brands.id),
  status: text("status").$type<"ok" | "skipped" | "error">().notNull(),
  summary: text("summary").notNull(),
  engine: text("engine").$type<"claude" | "rules">().notNull().default("rules"),
  createdAt: text("created_at").notNull().default(now),
});

export const jevQueries = sqliteTable("jev_queries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  question: text("question").notNull(),
  interpreted: json<Record<string, unknown>>("interpreted"),
  resultCount: integer("result_count").notNull().default(0),
  engine: text("engine").notNull().default("rules"),
  createdAt: text("created_at").notNull().default(now),
});
