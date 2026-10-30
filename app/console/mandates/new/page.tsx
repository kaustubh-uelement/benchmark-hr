import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { familiesWithRoles, indiaCities } from "@/lib/queries";
import { SENIORITY, WORK_MODES } from "@/lib/content/taxonomy";
import { ActionForm, SubmitButton } from "@/components/client";
import { PageHead, Panel } from "@/components/console";
import { JevMark } from "@/components/ui";
import { createMandate } from "@/app/actions/console";

export const metadata = { title: "New mandate" };

export default async function NewMandate() {
  const ctx = await consoleCtx();
  const brands = ctx.brands.filter((b) => b.kind === "subsidiary");
  const orgs = db.select({ id: s.organisations.id, name: s.organisations.name }).from(s.organisations).orderBy(asc(s.organisations.name)).all();
  const fams = familiesWithRoles();
  const cities = indiaCities();
  return (
    <>
      <PageHead title="New mandate" sub="Open a search, role, programme or project. For searches and Talent roles, Jev builds a consented longlist from the whole group database straight away." actions={<JevMark />} />
      <Panel>
        <ActionForm action={createMandate} className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Business
            <select name="brandId" className="field" defaultValue={ctx.pickedId ?? brands[0]?.id} required>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Client organisation
            <select name="orgId" className="field">
              <option value="">No client / internal</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold md:col-span-2">
            Title
            <input name="title" className="field" placeholder="e.g. Chief Financial Officer" required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Job family
            <select name="familyId" className="field">
              <option value="">Select</option>
              {fams.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Seniority
            <select name="seniority" className="field" defaultValue="Leadership">
              {SENIORITY.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            City
            <select name="cityId" className="field">
              <option value="">Select</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Work mode
            <select name="workMode" className="field">
              {WORK_MODES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold md:col-span-2">
            Must-have skills (comma separated)
            <input name="skills" className="field" placeholder="P&L ownership, Fundraising, Board reporting" />
          </label>
          <div className="grid grid-cols-3 gap-3 md:col-span-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Min. years
              <input name="minYears" type="number" min={0} className="field" defaultValue={15} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Salary from (₹/yr)
              <input name="salaryMin" type="number" min={0} step={100000} className="field" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Salary to (₹/yr)
              <input name="salaryMax" type="number" min={0} step={100000} className="field" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Fee (₹)
            <input name="feeAmount" type="number" min={0} step={10000} className="field" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Openings
            <input name="openings" type="number" min={1} defaultValue={1} className="field" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold md:col-span-2">
            Brief
            <textarea name="description" rows={4} className="field" placeholder="What the business needs, what success looks like in 18 months." />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold md:col-span-2">
            <input type="checkbox" name="confidential" className="h-4 w-4" /> Confidential: hide the client&apos;s name from candidates and other businesses
          </label>
          <div className="md:col-span-2">
            <SubmitButton pendingText="Opening and asking Jev…">Open mandate</SubmitButton>
          </div>
        </ActionForm>
      </Panel>
    </>
  );
}
