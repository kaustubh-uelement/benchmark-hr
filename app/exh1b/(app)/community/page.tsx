import Link from "next/link";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { createThread, upvote } from "@/app/actions/exh1b";
import { ActionButton, ActionForm, SubmitButton } from "@/components/client";
import { Badge, Card } from "@/components/ui";
import { relTime } from "@/lib/time";

export const metadata = { title: "Community" };
const TAGS = ["General", "Job Search", "Visa/OCI", "Relocation", "Career"];

export default async function Community({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const sp = await searchParams;
  const { user } = await requireMember();
  const ex = db.select().from(s.brands).where(eq(s.brands.slug, "exh1b")).get()!;
  const conds = [eq(s.threads.brandId, ex.id)];
  if (sp.tag) conds.push(eq(s.threads.tag, sp.tag));
  if (sp.q) conds.push(or(like(s.threads.title, `%${sp.q}%`), like(s.threads.body, `%${sp.q}%`))!);
  const threads = db
    .select({ t: s.threads, replies: sql<number>`(select count(*) from posts p where p.thread_id = ${s.threads.id})`, expert: sql<number>`(select count(*) from posts p where p.thread_id = ${s.threads.id} and p.is_expert = 1)` })
    .from(s.threads)
    .where(and(...conds))
    .orderBy(desc(s.threads.pinned), desc(s.threads.lastActivityAt))
    .all();
  const voted = new Set(db.select().from(s.threadVotes).where(eq(s.threadVotes.userId, user.id)).all().map((v) => v.threadId));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">Community</h1>
          <p className="m-0 mt-1 text-muted">Questions answered by members who&apos;ve moved back and by the ExH1B team (marked Team).</p>
        </div>
        <form method="get" className="flex flex-wrap gap-2">
          <input className="field max-w-sm flex-1" name="q" defaultValue={sp.q ?? ""} placeholder="Search threads" aria-label="Search threads" />
          {sp.tag && <input type="hidden" name="tag" value={sp.tag} />}
          <button className="min-h-11 rounded-btn bg-primary px-4 font-bold text-primary-ink">Search</button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Link href="/exh1b/community" className={`rounded-full px-3.5 py-1.5 text-sm font-bold no-underline ${!sp.tag ? "bg-primary text-primary-ink" : "bg-bg-2"}`}>
            All
          </Link>
          {TAGS.map((t) => (
            <Link key={t} href={`/exh1b/community?tag=${encodeURIComponent(t)}`} className={`rounded-full px-3.5 py-1.5 text-sm font-bold no-underline ${sp.tag === t ? "bg-primary text-primary-ink" : "bg-bg-2"}`}>
              {t}
            </Link>
          ))}
        </div>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {threads.map(({ t, replies, expert }) => (
            <li key={t.id}>
              <Card className="flex gap-4 p-4">
                <ActionButton action={upvote.bind(null, t.id)} title="Upvote" className={`flex h-14 w-12 flex-none flex-col items-center justify-center rounded-field text-sm font-extrabold ${voted.has(t.id) ? "bg-accent-soft text-accent" : "bg-bg-2"}`}>
                  <span aria-hidden="true">▲</span>
                  {t.upvotes}
                </ActionButton>
                <Link href={`/exh1b/community/${t.id}`} className="min-w-0 flex-1 no-underline">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {t.pinned && <Badge tone="dark">Pinned</Badge>}
                    <Badge>{t.tag}</Badge>
                    {expert > 0 && <Badge tone="good">Team answered</Badge>}
                  </span>
                  <b className="mt-1 block font-display text-lg leading-snug">{t.title}</b>
                  <span className="mt-0.5 block text-sm text-muted">
                    {t.authorName} · {replies} repl{replies === 1 ? "y" : "ies"} · active {relTime(t.lastActivityAt)}
                  </span>
                </Link>
              </Card>
            </li>
          ))}
          {threads.length === 0 && <li className="text-muted">No threads match.</li>}
        </ul>
      </div>
      <aside>
        <Card className="sticky top-24 p-5">
          <h2 className="m-0 font-display text-lg font-bold">Ask the community</h2>
          <p className="m-0 mb-4 mt-1 text-sm text-muted">Unanswered questions get a reply from our team within one business day.</p>
          <ActionForm action={createThread} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Title
              <input className="field" name="title" required minLength={8} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Tag
              <select className="field" name="tag">
                {TAGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Details
              <textarea className="field" name="body" rows={4} required />
            </label>
            <SubmitButton>Post question</SubmitButton>
          </ActionForm>
        </Card>
      </aside>
    </div>
  );
}
