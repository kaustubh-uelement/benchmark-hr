# Benchmark HR Group — unified platform

One Next.js application and **one database** for the whole Benchmark HR Group: the group website, five subsidiary portals, and the operations console that runs them, with **Jev**, the group's AI assistant and automation layer, built in.

| Business | Route | Design language | Who signs in |
| --- | --- | --- | --- |
| **Benchmark HR Group** | `/` | Navy, burgundy and sand; Gloock + Hanken Grotesk; the BENCHMARK circle mark and the "shortlist" pill (the previous group design) | Team members → console |
| **Golden Glove Executive Search** | `/goldenglove` | Obsidian and gold; Cormorant Garamond + Jost; sharp, editorial | Clients → client room |
| **ExH1B** | `/exh1b` | Passage navy, global teal and marigold; Sora + Manrope; light/dark | Members → dashboard |
| **Benchmark Talent** | `/talent` | Ink, electric blue and lime; Space Grotesk + Inter | Hiring managers → hiring portal; public job board |
| **TrustCircle Outplacements** | `/trustcircle` | Linen, deep pine and sunrise; Fraunces + Nunito Sans; soft | Sponsors and participants |
| **Benchmark Advisory** | `/advisory` | Paper, ink and steel blue; Newsreader + IBM Plex Sans; editorial | Clients → engagements portal |
| **Operations console** | `/console` | Group palette, navy sidebar | Group admin and each business's team |

The ExH1B portal reproduces the candidate journey from the Loom walkthrough (routes `/`, `/auth/login`, `/dashboard`, `/profile` six-step stepper, `/jobs#application-tracker`, `/relocation`, `/dashboard/support`, `/community`, `/dashboard/billing`). It also fixes the issues found in that review: one profile-completeness score, LinkedIn scoring, resume parsing, the country → state → city directory, job families instead of IT-only chips, blurred paywall teasers, an EOR lead pipeline, relocation content by origin country, support SLAs, and quarterly/annual plans.

---

## Quick start

```bash
npm install
npm run db:reset      # creates data/benchmark.db and loads the demo data
npm run dev           # http://localhost:3000
# production
npm run build && npm start
```

Node 20+ is required. The database is created and seeded automatically on first request if it doesn't exist.

### Demo logins (password `Demo@2026`)

| Who | Email | Lands in |
| --- | --- | --- |
| Anand Joshi, group admin | `anand@benchmarkhr.in` | `/console` (all businesses) |
| Ishita Rao, Golden Glove partner | `partner@goldenglove.in` | `/console` (Golden Glove only) |
| Meera Kulkarni, ExH1B lead | `success@exh1b.com` | `/console` (ExH1B only) |
| Rohan Bhide, Talent lead | `hiring@benchmarktalent.in` | `/console` (Talent only) |
| Nandini Bhosale, TrustCircle coach | `coach@trustcircle.in` | `/console` (TrustCircle only) |
| Kavya Menon, Advisory principal | `advisory@benchmarkhr.in` | `/console` (Advisory only) |
| Radhika Iyer, CHRO, Kaveri Digital Bank | `radhika.iyer@kaveridigitalbank.example` | Golden Glove client room |
| Karan Saxena, CEO, Indrayani Payments | `karan.saxena@indrayanipayments.example` | Golden Glove client room |
| Arjun Malhotra, Lumenfield Technologies | `arjun.malhotra@lumenfieldtechnologiesindia.example` | Talent hiring portal |
| Vikram Patwardhan, Sahyadri Mobility | `vikram.patwardhan@sahyadrimobility.example` | TrustCircle sponsor view |
| Sanjay Kulkarni, participant | `sanjay.kulkarni@example.com` | TrustCircle participant view |
| Sneha Patil, Orbitwise SaaS | `sneha.patil@orbitwisesaas.example` | Advisory portal |
| Priya Nair, ExH1B member (active, Seattle) | `priya.nair@example.com` | ExH1B dashboard |
| Aarav Mehta, ExH1B member (lapsed, Dublin) | `aarav.mehta@example.com` | ExH1B dashboard (paywall view) |

Every sign-in page lists its demo accounts; click one to fill the form.

---

## One database ("party graph")

`lib/db/schema.ts` defines a single schema used by every business:

- **people**: one golden record per person, matched by email across all brands. A returnee who joins through ExH1B, is placed by Talent and later shortlisted by Golden Glove has **one** record and one history.
- **person_brands / org_brands**: how a person or company relates to each business (member, executive, candidate, participant, client contact; client, employer, EOR employer, prospect).
- **consents**: `group_sharing`, `ai_matching`, `marketing`, each with source and timestamp (DPDP Act).
- **mandates → engagements**: Golden Glove searches, Talent and ExH1B roles, TrustCircle programmes and Advisory projects share one pipeline model.
- **leads, eor_cases, tickets, threads/posts, subscriptions/payments, invoices, coaching_sessions, deliverables, interactions, documents, notifications, audit_log**.
- **jev_automations, jev_runs, jev_queries**: what Jev did and why.

**Access is enforced in the query layer** (`lib/access.ts`), not just the UI:

- The group admin sees everything.
- A business's team sees its own records, plus people from other businesses who granted `group_sharing`.
- Clients see only their organisation's mandates, and only candidates from the presented shortlist onwards.
- Members and participants see only themselves.

Confidential Golden Glove mandates hide the client name in outreach.

SQLite (via Drizzle ORM) runs locally with zero setup. Every column maps 1:1 to Postgres; to move, switch `drizzle-orm/sqlite-core` to `pg-core` and the driver in `lib/db/index.ts`.

### Demo data

`npm run db:reset` loads a deterministic dataset: 205 people, 30 organisations, 80 mandates, 750 pipeline engagements, leads, tickets with SLA history, community threads, 37 subscriptions with Razorpay-style payments, invoices, coaching plans, deliverables and Jev run history.

All organisations, clients, candidates and members are **fictional**. The group's founder and advisers named on the group website, and the client testimonials there, come from Benchmark HR's existing site. The Golden Glove partner bios, its "recent appointments" and the demo team names are placeholders to replace before launch.

---

## Jev — AI assistant and automations

Jev runs everywhere, in two ways:

**1. Automations (event-driven, `lib/jev/engine.ts`).** Toggle them and audit every run at `/console/jev`.

| Automation | Trigger | What it does | Human approves? |
| --- | --- | --- | --- |
| Resume to profile | resume uploaded | Fills title, company, years, skills, family and seniority from the CV; never overwrites what the person typed | — |
| Job matches | profile updated | Re-scores open roles with explained reasons and gaps | — |
| EOR lead capture | member says Yes to keeping their employer | Opens an EOR lead + case, assigns the employer team, sets a 1-day reply target | — |
| Ticket triage & SLA | ticket created | Category, priority, owner, SLA clock, acknowledgement | — |
| SLA sweep | hourly | Escalates tickets past their response target | — |
| Search shortlist builder | mandate created | Ranks consented people from the whole group; proposals wait for a partner | **Yes** |
| Lead scoring & routing | any website form | Scores, links to existing people/companies, routes, sets reply-by | — |
| Placement to invoice | candidate placed | Drafts the fee invoice from mandate terms | **Yes** |
| Outplacement plan | participant enrolled | Five coaching sessions + matched openings across the group | — |
| Lapsed member nudge | subscription lapsed | "N roles match you this week" without revealing them | — |
| Community concierge | new thread | Drafts a first reply for a moderator | **Yes** |

**2. Assistant (`lib/jev/assistant.ts`, `/api/jev/chat`).** "Ask Jev" floats on every site and portal and answers only from what the asker may see:

- **Staff** in the console get group-wide natural-language search ("CFOs in Pune with 15+ years"), live ticket, lead and billing numbers, outreach drafts and ticket-reply drafts.
- **Members and participants** get their own matches, profile gaps, tickets, billing and relocation guidance.
- **Visitors** get each business's FAQs and are pointed to the right form.

**Engines.** With `ANTHROPIC_API_KEY` set, Jev uses Claude (model `JEV_MODEL`, default `claude-sonnet-5-5`) to read CVs, interpret searches and write replies and drafts. Without a key, every capability falls back to the deterministic rules engine, so the platform works offline and in demos. Each answer is labelled with the engine that produced it.

**Scheduling.** Call `POST /api/jev/cron` hourly (header `x-cron-secret: $JEV_CRON_SECRET`) to run the SLA sweep and expire lapsed subscriptions. The console also has a "Run SLA sweep" button.

---

## Brand domains

`proxy.ts` (Next.js 16's replacement for middleware) serves each business from its own domain out of this one deployment. For example, `goldenglove.in/portal` is rewritten to `/goldenglove/portal`. Defaults:

```
exh1b.com → /exh1b    goldenglove.in → /goldenglove    trustcircle.in → /trustcircle
talent.benchmarkhr.in → /talent    advisory.benchmarkhr.in → /advisory    benchmarkhr.in → group
```

Override with `BRAND_DOMAINS="exh1b.com=/exh1b,goldenglove.in=/goldenglove"`. Sign-in cookies are per domain, so a person signs in separately on each brand domain. The console lives on the group domain.

---

## Configuration

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Turns on Claude for Jev (optional) |
| `JEV_MODEL` | Claude model for Jev (default `claude-sonnet-5-5`) |
| `JEV_CRON_SECRET` | Protects `/api/jev/cron` |
| `DATABASE_PATH` | SQLite file location (default `data/benchmark.db`) |
| `BRAND_DOMAINS` | Domain → route-prefix map |

## Hosting

The app is stateful (a SQLite file plus uploaded CVs in `data/`). Run it on a VM or container with a persistent volume (AWS Lightsail/EC2, a VPS, Render with a disk), behind HTTPS. For serverless hosting such as Vercel, move to Postgres and object storage first.

## Testing

`npm run typecheck` checks types. `npm run test:e2e` drives real browsers through 15 checks against a running app (set `BASE`, default `http://localhost:3000`; needs `playwright` with Chromium):

- group enquiry → Jev-routed lead
- Golden Glove confidential registration
- client shortlist decision → partner notified
- Talent application with CV parsing
- new search → Jev longlist → partner approval → outreach draft
- ticket reply stops the SLA clock
- TrustCircle referral into a Talent pipeline
- ExH1B sign-up → EOR lead
- the Jev assistant
- no client-side errors

Run it on a fresh `npm run db:reset`.

## Not yet production

- **Payments:** Razorpay checkout is simulated. It records the subscription and payment exactly as the webhook would. Wiring live keys and the webhook is the next step.
- **Email/WhatsApp:** notifications are in-app only; plug in a provider (SES, Postmark, Gupshup) in `lib/jev/engine.ts → notify`.
- **Authentication:** email and password with scrypt hashes and httpOnly sessions. Google sign-in and password reset are not wired.
- **Content:** relocation, visa and tax guidance is marked "pending sign-off" and needs a qualified adviser's review. Brand marks are geometric placeholders until official logo files arrive.

## Project map

```
app/(group)        group website, business pages, unified sign-in
app/exh1b          ExH1B site + member portal
app/goldenglove    Golden Glove site, client sign-in, client room
app/talent         Talent site, job board, applications, hiring portal
app/trustcircle    TrustCircle site, sponsor + participant portal
app/advisory       Advisory site, client portal
app/console        operations console (all businesses)
app/api            geo directory, documents, Jev chat, Jev cron
app/actions        server actions (auth, leads, exh1b, portal, console)
lib/db             schema, connection, seed
lib/jev            engine (automations), assistant, matching, CV parsing, Claude connector
lib/access.ts      brand-level access rules used by every query
proxy.ts           brand domain routing
```
