import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { toggleChecklist } from "@/app/actions/exh1b";
import { Checklist } from "@/components/Checklist";
import { CostOfLiving } from "@/components/client";
import { Badge, Card, Notice } from "@/components/ui";
import { VISA_CARDS, CONTENT_REVIEW } from "@/lib/content/relocation";

export const metadata = { title: "Relocation Hub" };

export default async function Relocation() {
  const { person } = await requireMember();
  const cc = person.countryCode ?? "";
  const country = cc ? db.select().from(s.countries).where(eq(s.countries.code, cc)).get() : null;
  const items = db.select().from(s.relocationItems).orderBy(asc(s.relocationItems.sort)).all();
  const progress = new Map(db.select().from(s.relocationProgress).where(eq(s.relocationProgress.personId, person.id)).all().map((p) => [p.itemId, p.done]));
  const mine = items.filter((i) => i.appliesTo.includes("*") || i.appliesTo.includes(cc));
  const order = ["Documents & legal", "Financial", "Housing & settling in", "Family & personal", "Before you leave"];
  const sections = order
    .map((name) => ({
      name: name === "Before you leave" ? `Before you leave ${country?.name ?? "your current country"}` : name,
      items: mine.filter((i) => i.section === name).map((i) => ({ id: i.id, title: i.title, detail: i.detail, done: !!progress.get(i.id), specific: !i.appliesTo.includes("*") })),
    }))
    .filter((x) => x.items.length);
  const col = db.select().from(s.costOfLiving).all();
  const coveredCountries = [...new Set(items.flatMap((i) => i.appliesTo).filter((c) => c !== "*"))].length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">Relocation Hub</h1>
        <p className="m-0 mt-1 text-muted">
          Built for a move from <b className="text-ink">{country?.name ?? "abroad"}</b> to India.{" "}
          {!cc && (
            <Link href="/exh1b/profile?step=2" className="font-bold text-accent">
              Set your current country
            </Link>
          )}
        </p>
      </div>

      <Notice tone="warn" title={`Content review: ${CONTENT_REVIEW.status}`}>
        {CONTENT_REVIEW.note}
      </Notice>

      <Card className="p-6">
        <h2 className="m-0 mb-4 font-display text-xl font-bold">Cost of living comparator</h2>
        <CostOfLiving rows={col} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="m-0 font-display text-xl font-bold">Your move checklist</h2>
            <Badge tone="accent">{mine.length} items · {coveredCountries} countries supported</Badge>
          </div>
          <Checklist sections={sections} onToggle={toggleChecklist} />
        </Card>
        <div className="flex flex-col gap-4">
          <h2 className="m-0 font-display text-xl font-bold">Visa &amp; entry guidance</h2>
          {VISA_CARDS.map((v) => (
            <Card key={v.key} className="p-5">
              <h3 className="m-0 font-display text-lg font-bold">{v.title}</h3>
              <p className="m-0 mt-1 text-sm text-muted">
                <b className="text-ink">Who it&apos;s for:</b> {v.who}
              </p>
              <ul className="m-0 mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm">
                {v.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="m-0 mt-3 rounded-field bg-warn-soft px-3 py-2 text-xs text-warn">{v.caution}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
