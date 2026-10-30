import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { profileStatus } from "@/lib/profile";
import { countriesList, familiesWithRoles, indiaCities, cityNames } from "@/lib/queries";
import { EMPLOYMENT_TYPES, WORK_MODES, RETURN_TIMELINES, COMPANY_TYPES, SENIORITY, NOTICE_PERIODS, VISA_STATUSES } from "@/lib/content/taxonomy";
import { saveProfileStep, uploadResume, deleteResume, setVisibility } from "@/app/actions/exh1b";
import { ActionForm, ActionButton, LocationPicker, RolePicker, SubmitButton } from "@/components/client";
import { Badge, Card, ChipCheck, JevMark, Notice, Progress, ScoreRing } from "@/components/ui";
import { fmtDate } from "@/lib/time";

export const metadata = { title: "Profile" };

const STEPS = ["Basic info", "Where you are", "Location preferences", "Job & company", "Resume", "Additional info"];

function StepActions({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <input type="hidden" name="step" value={step} />
      <SubmitButton variant="outline" pendingText="Saving…">
        Save
      </SubmitButton>
      {step < 6 && (
        <button type="submit" name="next" value="1" className="inline-flex min-h-11 items-center rounded-btn bg-primary px-5 font-semibold text-primary-ink">
          Save and continue
        </button>
      )}
    </div>
  );
}

export default async function Profile({ searchParams }: { searchParams: Promise<{ step?: string; welcome?: string }> }) {
  const sp = await searchParams;
  const { person } = await requireMember();
  const step = Math.min(6, Math.max(1, Number(sp.step ?? 1) || 1));
  const st = profileStatus(person);
  const countries = countriesList();
  const fams = familiesWithRoles();
  const famName = fams.find((f) => f.id === person.familyId)?.name;
  const roleName = fams.flatMap((f) => f.roles).find((r) => r.id === person.roleId)?.name;
  const prefCities = cityNames(person.preferredCityIds).map((c) => c.name);
  const india = indiaCities();
  const byState = india.reduce<Record<string, typeof india>>((a, c) => ((a[c.state] ??= []).push(c), a), {});
  const metros = ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "New Delhi", "Gurugram", "Noida", "Chennai", "Kolkata", "Ahmedabad", "Kochi"];
  const docs = db.select().from(s.documents).where(eq(s.documents.personId, person.id)).all();
  const saved = new Set(person.stepsSaved);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={st.strength} size={68} />
            <div>
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-faint">Profile strength</p>
              <b className="font-display text-lg">{st.label}</b>
            </div>
          </div>
          <ul className="m-0 mt-4 flex list-none flex-col gap-1.5 p-0 text-sm">
            {st.items.map((i) => (
              <li key={i.key} className="flex items-center justify-between">
                <span className={i.done ? "" : "text-muted"}>
                  <span className={i.done ? "text-good" : "text-faint"}>{i.done ? "✓" : "○"}</span> {i.label}
                </span>
                <span className={`tabular-nums text-xs font-bold ${i.done ? "text-good" : "text-faint"}`}>
                  {i.done ? i.weight : 0}/{i.weight}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-3 text-xs text-faint">The same score is used on your dashboard and for matching.</p>
        </Card>

        <Card className="p-5">
          <p className="m-0 text-sm font-bold">Profile visibility</p>
          <p className="m-0 mt-1 text-sm text-muted">{person.profileVisibility === "shareable" ? "Employers we work with can see your profile." : "Only you and the ExH1B team can see your profile."}</p>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-btn bg-bg-2 p-1 text-sm font-bold">
            <ActionButton action={setVisibility.bind(null, "private")} className={`min-h-10 rounded-btn ${person.profileVisibility === "private" ? "bg-card shadow-sm" : "text-muted"}`}>
              Private
            </ActionButton>
            <ActionButton action={setVisibility.bind(null, "shareable")} className={`min-h-10 rounded-btn ${person.profileVisibility === "shareable" ? "bg-card shadow-sm" : "text-muted"}`}>
              Shareable
            </ActionButton>
          </div>
        </Card>

        <Card className="p-5 text-sm">
          <p className="m-0 mb-2 font-bold">Your preferences</p>
          <dl className="m-0 grid gap-2">
            {[
              ["Return", person.returnTimeline],
              ["Cities", person.anywhereInIndia ? "Anywhere in India" : prefCities.join(", ")],
              ["Work", [person.workMode, ...person.employmentTypes].filter(Boolean).join(" · ")],
              ["Role", [roleName, famName].filter(Boolean).join(", ")],
              ["Level", person.seniority],
              ["Keep employer (EOR)", person.openToEor == null ? null : person.openToEor ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k as string} className="grid grid-cols-[110px_1fr] gap-2">
                <dt className="text-faint">{k}</dt>
                <dd className="m-0 font-semibold">{v || <span className="font-normal text-faint">Not set</span>}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </aside>

      <section className="flex min-w-0 flex-col gap-5">
        {sp.welcome && (
          <Notice tone="accent" title="Welcome to ExH1B">
            Six short steps. Upload your resume in step 5 and Jev will fill in most of step 6 for you.
          </Notice>
        )}
        <nav aria-label="Profile steps" className="scroll-x">
          <ol className="m-0 flex min-w-max list-none gap-2 p-0">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const cur = n === step;
              return (
                <li key={label}>
                  <Link href={`/exh1b/profile?step=${n}`} aria-current={cur ? "step" : undefined} className={`flex items-center gap-2 rounded-btn border px-3 py-2 text-sm font-bold no-underline ${cur ? "border-primary bg-primary text-primary-ink" : "border-line bg-card hover:bg-bg-2"}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${cur ? "bg-primary-ink text-primary" : saved.has(n) ? "bg-good text-white" : "bg-bg-2"}`}>{saved.has(n) && !cur ? "✓" : n}</span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        <div>
          <div className="mb-1 flex justify-between text-xs font-bold text-faint">
            <span>
              Steps saved {saved.size}/6
            </span>
            <span>Profile strength {st.strength}%</span>
          </div>
          <Progress value={st.strength} />
        </div>

        <Card className="p-6">
          <h1 className="m-0 font-display text-2xl font-bold">
            {step}. {STEPS[step - 1]}
          </h1>

          {step === 1 && (
            <ActionForm action={saveProfileStep} resetOnSuccess={false} className="mt-5 flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  First name
                  <input className="field" name="firstName" defaultValue={person.firstName} required />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Last name
                  <input className="field" name="lastName" defaultValue={person.lastName} required />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Email <span className="font-normal text-faint">(locked — contact support to change)</span>
                <input className="field opacity-70" value={person.email} readOnly aria-readonly="true" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  LinkedIn URL
                  <input className="field" name="linkedinUrl" defaultValue={person.linkedinUrl ?? ""} placeholder="https://www.linkedin.com/in/your-name" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Phone / WhatsApp
                  <input className="field" name="phone" defaultValue={person.phone ?? ""} />
                </label>
              </div>
              <StepActions step={1} />
            </ActionForm>
          )}

          {step === 2 && (
            <ActionForm action={saveProfileStep} resetOnSuccess={false} className="mt-5 flex flex-col gap-5">
              <p className="m-0 text-sm text-muted">Where do you live now? Your Relocation Hub checklist is built for this country.</p>
              <LocationPicker countries={countries} defaults={{ country: person.countryCode, state: person.stateId, city: person.cityId, cityText: person.cityId ? null : person.locationLabel?.split(",")[0] }} />
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold">When are you planning to return?</legend>
                <div className="flex flex-wrap gap-2">
                  {RETURN_TIMELINES.map((t) => (
                    <ChipCheck key={t} type="radio" name="returnTimeline" value={t} label={t} checked={person.returnTimeline === t} />
                  ))}
                </div>
              </fieldset>
              <StepActions step={2} />
            </ActionForm>
          )}

          {step === 3 && (
            <ActionForm action={saveProfileStep} resetOnSuccess={false} className="mt-5 flex flex-col gap-6">
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold">Employment type</legend>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYMENT_TYPES.map((t) => (
                    <ChipCheck key={t} name="employmentTypes" value={t} label={t} checked={person.employmentTypes.includes(t)} />
                  ))}
                </div>
              </fieldset>
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold">Work mode</legend>
                <div className="flex flex-wrap gap-2">
                  {WORK_MODES.map((t) => (
                    <ChipCheck key={t} type="radio" name="workMode" value={t} label={t} checked={person.workMode === t} />
                  ))}
                </div>
              </fieldset>
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-1 text-sm font-semibold">Preferred cities in India</legend>
                <p className="m-0 mb-2 text-xs text-muted">Quick picks, or open a state to choose any city in the directory.</p>
                <div className="flex flex-wrap gap-2">
                  <ChipCheck name="anywhereInIndia" value="on" label="Anywhere in India" checked={person.anywhereInIndia} />
                  {india
                    .filter((c) => metros.includes(c.name))
                    .map((c) => (
                      <ChipCheck key={c.id} name="preferredCityIds" value={String(c.id)} label={c.name} checked={person.preferredCityIds.includes(c.id)} />
                    ))}
                </div>
                <details className="mt-3 rounded-field border border-line p-3">
                  <summary className="cursor-pointer text-sm font-bold">All cities by state</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {Object.entries(byState).map(([stName, cs]) => (
                      <div key={stName}>
                        <p className="m-0 mb-1 text-xs font-bold text-faint">{stName}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cs
                            .filter((c) => !metros.includes(c.name))
                            .map((c) => (
                              <ChipCheck key={c.id} name="preferredCityIds" value={String(c.id)} label={c.name} checked={person.preferredCityIds.includes(c.id)} />
                            ))}
                          {cs.every((c) => metros.includes(c.name)) && <span className="text-xs text-faint">In quick picks</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  If remote, where can you work from?
                  <select className="field" name="remoteScope" defaultValue={person.remoteScope ?? ""}>
                    <option value="">Not looking for remote</option>
                    <option>Anywhere</option>
                    <option>Current country</option>
                    <option>Chosen countries</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Chosen countries (for remote)
                  <select className="field min-h-24" name="remoteCountries" multiple defaultValue={person.remoteCountries}>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Anything else about location?
                <textarea className="field" name="preferenceNotes" rows={3} defaultValue={person.preferenceNotes ?? ""} />
              </label>
              <StepActions step={3} />
            </ActionForm>
          )}

          {step === 4 && (
            <ActionForm action={saveProfileStep} resetOnSuccess={false} className="mt-5 flex flex-col gap-6">
              <fieldset className="m-0 rounded-card border border-line bg-bg-2 p-4">
                <legend className="px-1 text-sm font-bold">Would you like to keep working for your current employer from India?</legend>
                <p className="m-0 mb-3 text-sm text-muted">If yes, our employer team will explain how ExH1B can employ you in India on your employer&apos;s behalf (Employer of Record).</p>
                <div className="flex flex-wrap gap-2">
                  <ChipCheck type="radio" name="openToEor" value="yes" label="Yes, tell me how" checked={person.openToEor === true} />
                  <ChipCheck type="radio" name="openToEor" value="no" label="No, I want a new role" checked={person.openToEor === false} />
                </div>
              </fieldset>
              <RolePicker families={fams} defaults={{ family: person.familyId, role: person.roleId }} />
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold">Seniority</legend>
                <div className="flex flex-wrap gap-2">
                  {SENIORITY.map((t) => (
                    <ChipCheck key={t} type="radio" name="seniority" value={t} label={t} checked={person.seniority === t} />
                  ))}
                </div>
              </fieldset>
              <fieldset className="m-0 border-0 p-0">
                <legend className="mb-2 text-sm font-semibold">Company types you&apos;d consider</legend>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_TYPES.map((t) => (
                    <ChipCheck key={t} name="companyTypes" value={t} label={t} checked={person.preferredCompanyTypes.includes(t)} />
                  ))}
                </div>
              </fieldset>
              <StepActions step={4} />
            </ActionForm>
          )}

          {step === 5 && (
            <div className="mt-5 flex flex-col gap-5">
              {person.resumeFilename ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-bg-2 p-4">
                  <div>
                    <b>{person.resumeFilename}</b>
                    <p className="m-0 text-sm text-muted">{person.resumeParsedAt ? `Read by Jev ${fmtDate(person.resumeParsedAt)}` : "Not read yet"}</p>
                  </div>
                  <div className="flex gap-2">
                    {docs.length > 0 && (
                      <a href={`/api/documents/${docs[docs.length - 1].id}`} className="inline-flex min-h-9 items-center rounded-btn border-[1.5px] border-line px-3.5 text-sm font-semibold no-underline">
                        View
                      </a>
                    )}
                    <ActionButton action={deleteResume} confirm="Delete your resume?" className="inline-flex min-h-9 items-center rounded-btn px-3.5 text-sm font-semibold text-bad hover:bg-bad-soft">
                      Delete
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <Notice tone="warn">No resume yet. It&apos;s worth 30 points of your profile strength, and Jev uses it to fill in your title, experience and skills.</Notice>
              )}
              {person.resumeText && (
                <details className="rounded-field border border-line p-3">
                  <summary className="cursor-pointer text-sm font-bold">Text Jev read from your resume</summary>
                  <pre className="m-0 mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-muted">{person.resumeText}</pre>
                </details>
              )}
              <ActionForm action={uploadResume} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  {person.resumeFilename ? "Replace resume" : "Upload resume"} <span className="font-normal text-faint">PDF, DOCX or TXT, up to 5 MB</span>
                  <input className="field" type="file" name="resume" accept=".pdf,.docx,.txt,.md" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Or paste the text
                  <textarea className="field font-mono text-xs" name="resumeText" rows={6} placeholder="Paste your resume here if your file is a scanned image." />
                </label>
                <div className="flex items-center gap-3">
                  <SubmitButton pendingText="Jev is reading…">Save resume</SubmitButton>
                  <JevMark />
                </div>
              </ActionForm>
            </div>
          )}

          {step === 6 && (
            <ActionForm action={saveProfileStep} resetOnSuccess={false} className="mt-5 flex flex-col gap-4">
              {person.resumeParsedAt && (
                <Notice tone="accent">
                  <JevMark className="mr-1" /> Filled from your resume. Check and correct anything that&apos;s off.
                </Notice>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Current title
                  <input className="field" name="currentTitle" defaultValue={person.currentTitle ?? ""} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Current company
                  <input className="field" name="currentCompany" defaultValue={person.currentCompany ?? ""} />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Years of experience
                  <input className="field" type="number" min={0} max={50} step={0.5} name="yearsExperience" defaultValue={person.yearsExperience ?? ""} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Notice period
                  <select className="field" name="noticePeriod" defaultValue={person.noticePeriod ?? ""}>
                    <option value="">Select</option>
                    {NOTICE_PERIODS.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Visa / work authorisation
                  <select className="field" name="visaStatus" defaultValue={person.visaStatus ?? ""}>
                    <option value="">Select</option>
                    {VISA_STATUSES.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Skills <span className="font-normal text-faint">comma-separated, at least 3</span>
                <textarea className="field" name="skills" rows={2} defaultValue={person.skills.join(", ")} />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Salary currency
                  <select className="field" name="salaryCurrency" defaultValue={person.salaryCurrency ?? "USD"}>
                    {["USD", "INR", "GBP", "EUR", "AED", "SGD", "CAD", "AUD"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Expected minimum / year
                  <input className="field" type="number" min={0} name="salaryMin" defaultValue={person.salaryMin ?? ""} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Expected maximum / year
                  <input className="field" type="number" min={0} name="salaryMax" defaultValue={person.salaryMax ?? ""} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                Anything else we should know?
                <textarea className="field" name="additionalInfo" rows={3} defaultValue={person.additionalInfo ?? ""} />
              </label>
              <StepActions step={6} />
            </ActionForm>
          )}
        </Card>
        <p className="m-0 text-xs text-faint">
          Saving any step refreshes your matches. <Badge>Jev</Badge> never overwrites details you typed yourself.
        </p>
      </section>
    </div>
  );
}
