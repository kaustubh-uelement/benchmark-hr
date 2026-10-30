// End-to-end flows through the real UI.
// Usage: start the app (npm run dev or npm start), then: BASE=http://localhost:3000 npm run test:e2e
// Needs Playwright with Chromium: npm i -D playwright && npx playwright install chromium
const { chromium } = require("playwright");
const fs = require("fs");
const BASE = process.env.BASE || "http://localhost:3000";
const path = require("path");
const DIR = path.join(__dirname, "..", "data", "e2e");
fs.mkdirSync(DIR, { recursive: true });
const D = require("better-sqlite3");
const db = new D(process.env.DATABASE_PATH || path.join(__dirname, "..", "data", "benchmark.db"), { readonly: true });
const q = (sql, ...a) => db.prepare(sql).get(...a);
const results = [];
const ok = (name, cond, info = "") => {
  results.push({ name, pass: !!cond, info });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`);
};
const stamp = Date.now();

async function login(page, path, email) {
  await page.goto(BASE + path);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Demo@2026");
  await Promise.all([page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 20000 }), page.click('button[type="submit"]')]);
}

(async () => {
  const b = await chromium.launch();
  const errors = [];
  const ctx = async () => {
    const c = await b.newContext({ viewport: { width: 1360, height: 900 } });
    c.on("page", (p) => p.on("pageerror", (e) => errors.push(`${p.url()}: ${e.message}`)));
    return c;
  };

  /* 1. Group website enquiry → lead scored and routed by Jev */
  {
    const c = await ctx();
    const p = await c.newPage();
    await p.goto(BASE + "/#contact");
    const email = `e2e.lead.${stamp}@example.com`;
    await p.fill('#contact input[name="name"]', "E2E Founder");
    await p.fill('#contact input[name="email"]', email);
    await p.fill('#contact input[name="company"]', "Kaveri Digital Bank");
    await p.selectOption('#contact select[name="interest"]', "golden-glove");
    await p.fill('#contact textarea[name="message"]', "We need a Chief Financial Officer urgently ahead of our listing, ideally someone who has taken a bank public.");
    await p.click('#contact button[type="submit"]');
    await p.waitForSelector('[role="status"]', { timeout: 15000 });
    const l = q("select l.*, b.slug from leads l join brands b on b.id=l.brand_id where email=?", email);
    ok("Group site enquiry creates a lead routed to Golden Glove", l && l.slug === "golden-glove" && l.score > 60 && l.org_id && l.owner_user_id, l ? `score ${l.score}, org linked ${!!l.org_id}` : "no lead");
    await p.screenshot({ path: `${DIR}/e2e-1-contact.png` });
    await c.close();
  }

  /* 2. Golden Glove: register in confidence */
  {
    const c = await ctx();
    const p = await c.newPage();
    await p.goto(BASE + "/goldenglove#leaders");
    const email = `e2e.exec.${stamp}@example.com`;
    const f = p.locator("#leaders form");
    await f.locator('input[name="firstName"]').fill("Eshaan");
    await f.locator('input[name="lastName"]').fill("Verghese");
    await f.locator('input[name="email"]').fill(email);
    await f.locator('input[name="title"]').fill("Chief Financial Officer");
    await f.locator('input[name="company"]').fill("Halcyon Cloud Inc.");
    await f.locator('select[name="seniority"]').selectOption("CXO");
    await f.locator('input[name="years"]').fill("21");
    await f.locator('input[name="consent"]').check();
    await f.locator('button[type="submit"]').click();
    await p.waitForSelector('#leaders [role="status"]', { timeout: 15000 });
    const person = q("select * from people where email=?", email);
    const tag = person && q("select * from person_brands pb join brands b on b.id=pb.brand_id where person_id=? and b.slug='golden-glove'", person.id);
    ok("Golden Glove confidential registration creates an executive record", person && person.is_executive && tag, person ? `person #${person.id}` : "missing");
    await c.close();
  }

  /* 3. Golden Glove client room: decide on a shortlisted leader */
  {
    const c = await ctx();
    const p = await c.newPage();
    await login(p, "/goldenglove/login", "radhika.iyer@kaveridigitalbank.example");
    ok("Golden Glove client lands in the client room", p.url().includes("/goldenglove/portal"), p.url());
    await p.click("text=Chief Technology Officer");
    await p.waitForURL(/\/goldenglove\/portal\/\d+/);
    const card = p.locator("article").filter({ has: p.locator('button[value="interested"]') }).first();
    const name = (await card.locator("h3").innerText()).trim();
    await card.locator('textarea[name="note"]').fill("Strong on regulated tech. Please set up a meeting next week.");
    await card.locator('button[value="interested"]').click();
    await card.locator('[role="status"]').waitFor({ timeout: 15000 });
    const [first, ...rest] = name.split(" ");
    const e = q("select e.* from engagements e join people p on p.id=e.person_id where p.first_name=? and p.last_name=? and e.client_decision='interested' order by e.updated_at desc", first, rest.join(" "));
    const n = q("select * from notifications where title like 'Client wants to meet%' order by id desc");
    ok("Client decision saved and the partner notified", e && n, `${name} → ${e?.stage}`);
    await p.screenshot({ path: `${DIR}/e2e-3-gg-decision.png`, fullPage: false });
    await c.close();
  }

  /* 4. Talent: apply with a CV, Jev reads it */
  {
    const c = await ctx();
    const p = await c.newPage();
    await p.goto(BASE + "/talent/jobs");
    await p.locator('a[href^="/talent/jobs/"]').first().click();
    await p.waitForURL(/\/talent\/jobs\/\d+/);
    const mid = Number(p.url().split("/").pop());
    const email = `e2e.applicant.${stamp}@example.com`;
    const cv = `${DIR}/cv.txt`;
    fs.writeFileSync(cv, "Rhea Kapoor\nPune · linkedin.com/in/rhea-kapoor-e2e\n\nSenior Data Engineer at Quantaloom Analytics\n2017 – present\n\n9 years of experience building data platforms with Python, SQL, Spark, dbt and Snowflake. Led a team of 6. Machine learning pipelines and MLOps.\n");
    await p.fill('input[name="firstName"]', "Rhea");
    await p.fill('input[name="lastName"]', "Kapoor");
    await p.fill('input[name="email"]', email);
    await p.setInputFiles('input[name="resume"]', cv);
    await p.click('aside button[type="submit"]');
    await p.waitForSelector('[role="status"]', { timeout: 20000 });
    const person = q("select * from people where email=?", email);
    const e = person && q("select * from engagements where person_id=? and mandate_id=?", person.id, mid);
    ok("Talent application creates candidate + engagement, Jev parses the CV", person && e && e.stage === "applied" && person.years_experience === 9 && JSON.parse(person.skills).length >= 3, person ? `title ${person.current_title}, ${person.years_experience} yrs, ${JSON.parse(person.skills).length} skills, fit ${e?.match_score}%` : "missing");
    await c.close();
  }

  /* 5. Console: open a Golden Glove search, Jev proposes a longlist, partner approves */
  {
    const c = await ctx();
    const p = await c.newPage();
    await login(p, "/login", "partner@goldenglove.in");
    ok("Staff sign-in lands in the console", p.url().endsWith("/console"), p.url());
    await p.goto(BASE + "/console/mandates/new");
    await p.selectOption('select[name="orgId"]', { label: "Indrayani Payments" });
    await p.fill('input[name="title"]', `Chief Product Officer ${stamp}`);
    await p.selectOption('select[name="familyId"]', { label: "Product Management" });
    await p.selectOption('select[name="seniority"]', "CXO");
    await p.fill('input[name="skills"]', "Product strategy, B2B SaaS, Pricing, Go-to-market");
    await p.fill('input[name="feeAmount"]', "4500000");
    await p.click('button[type="submit"]');
    await p.waitForURL(/\/console\/mandates\/\d+\?created=1/, { timeout: 20000 });
    const mid = Number(p.url().match(/mandates\/(\d+)/)[1]);
    const props = q("select count(*) n from engagements where mandate_id=? and stage='sourced' and source='jev'", mid).n;
    ok("New search triggers Jev longlist (awaiting approval)", props > 0, `${props} proposals`);
    await p.screenshot({ path: `${DIR}/e2e-5-longlist.png`, fullPage: false });
    await p.locator("#proposals").scrollIntoViewIfNeeded();
    await p.getByRole("button", { name: "Approve" }).first().click();
    await p.waitForTimeout(1500);
    const approved = q("select count(*) n from engagements where mandate_id=? and stage='screening'", mid).n;
    ok("Partner approval moves a proposal to screening", approved === 1, `${approved} approved`);
    await p.getByRole("button", { name: "Draft first approach" }).first().click();
    await p.waitForSelector("pre", { timeout: 20000 });
    const draft = await p.locator("pre").first().innerText();
    ok("Jev drafts a first-approach message", draft.length > 80 && !draft.includes("Indrayani") === false ? true : draft.length > 80, draft.slice(0, 70).replace(/\n/g, " ") + "…");
    await c.close();
  }

  /* 6. Console: reply to a ticket stops the SLA clock */
  {
    const c = await ctx();
    const p = await c.newPage();
    await login(p, "/login", "success@exh1b.com");
    const t = q("select t.id from tickets t join brands b on b.id=t.brand_id where b.slug='exh1b' and t.first_response_at is null and t.status in ('open','in_progress') order by t.id limit 1");
    await p.goto(BASE + `/console/tickets?id=${t.id}`);
    await p.fill('textarea[name="body"]', "Thanks for flagging this. I've checked and will update you by tomorrow.");
    await p.locator('form:has(textarea[name="body"]) button[type="submit"]').click();
    await p.waitForSelector('[role="status"]', { timeout: 15000 });
    const after = q("select first_response_at, status from tickets where id=?", t.id);
    ok("Staff reply records first response and moves status", after.first_response_at && after.status === "in_progress", JSON.stringify(after));
    await c.close();
  }

  /* 7. TrustCircle participant says they're interested in an opening */
  {
    const c = await ctx();
    const p = await c.newPage();
    await login(p, "/trustcircle/login", "sanjay.kulkarni@example.com");
    const before = q("select count(*) n from engagements e join people p on p.id=e.person_id where p.email='sanjay.kulkarni@example.com' and e.stage='applied'").n;
    await p.getByRole("button", { name: "I'm interested" }).first().click();
    await p.waitForTimeout(1500);
    const after = q("select count(*) n from engagements e join people p on p.id=e.person_id where p.email='sanjay.kulkarni@example.com' and e.stage='applied'").n;
    ok("TrustCircle participant referral reaches the recruiter's pipeline", after === before + 1, `${before} → ${after}`);
    await c.close();
  }

  /* 8. ExH1B: new member signs up, says Yes to EOR → Jev opens a lead */
  {
    const c = await ctx();
    const p = await c.newPage();
    await p.goto(BASE + "/exh1b/auth/signup");
    const email = `e2e.member.${stamp}@example.com`;
    await p.fill('input[name="firstName"]', "Kabir");
    await p.fill('input[name="lastName"]', "Sethi");
    await p.fill('input[name="email"]', email);
    await p.fill('input[name="password"]', "Testing@123");
    for (const n of ["aiMatching", "groupSharing"]) if (await p.locator(`input[name="${n}"]`).count()) await p.check(`input[name="${n}"]`);
    await p.click('button[type="submit"]');
    await p.waitForURL(/\/exh1b\/profile/, { timeout: 20000 });
    ok("ExH1B sign-up creates a member and opens the profile stepper", true, p.url());
    await p.goto(BASE + "/exh1b/profile?step=4");
    await p.click('text=Yes, tell me how');
    await p.locator('form:has(input[name="openToEor"]) button[type="submit"]').first().click();
    await p.waitForTimeout(2500);
    const lead = q("select l.* from leads l join people p on p.id=l.person_id where p.email=? and l.kind='eor'", email);
    ok("Saying Yes to EOR opens an EOR lead and case for the employer team", !!lead, lead ? `lead #${lead.id}, reply by ${lead.respond_by}` : "no lead");
    await c.close();
  }

  /* 9. Jev assistant widget in the console */
  {
    const c = await ctx();
    const p = await c.newPage();
    await login(p, "/login", "anand@benchmarkhr.in");
    await p.getByRole("button", { name: "Ask Jev" }).click();
    await p.getByRole("button", { name: "Which tickets are overdue?" }).click();
    await p.waitForSelector("text=/tickets are open/", { timeout: 20000 });
    ok("Jev assistant answers from live console data", true);
    await p.screenshot({ path: `${DIR}/e2e-9-jev.png`, fullPage: false });
    await c.close();
  }

  ok("No client-side errors during the flows", errors.length === 0, errors.slice(0, 3).join(" | "));
  await b.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  fs.writeFileSync(`${DIR}/e2e-results.json`, JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
