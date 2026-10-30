import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { consoleCtx } from "@/lib/console";
import { Badge, JevMark } from "@/components/ui";
import { ActionButton, ActionForm, SubmitButton } from "@/components/client";
import { PageHead, Panel } from "@/components/console";
import { moderatorReply, togglePin } from "@/app/actions/console";
import { relTime } from "@/lib/time";

export const metadata = { title: "Community" };

export default async function Community({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const ctx = await consoleCtx();
  void ctx;
  const threads = db
    .select({ t: s.threads, replies: sql<number>`(select count(*) from posts p where p.thread_id = ${s.threads.id})`, expert: sql<number>`(select count(*) from posts p where p.thread_id = ${s.threads.id} and p.is_expert = 1)` })
    .from(s.threads)
    .orderBy(desc(s.threads.lastActivityAt))
    .all();
  const sel = id ? threads.find((x) => x.t.id === Number(id)) : threads.find((x) => x.replies === 0) ?? threads[0];
  const posts = sel ? db.select().from(s.posts).where(eq(s.posts.threadId, sel.t.id)).orderBy(asc(s.posts.createdAt)).all() : [];
  const draft = sel ? db.select().from(s.notifications).where(eq(s.notifications.href, `/console/community?id=${sel.t.id}`)).orderBy(desc(s.notifications.createdAt)).get() : null;
  const draftText = draft?.body?.replace(/^“.*?”: /, "") ?? "";
  const unanswered = threads.filter((x) => x.replies === 0).length;
  return (
    <>
      <PageHead eyebrow="ExH1B" title="Community" sub={`${threads.length} threads, ${unanswered} without a reply yet. Jev drafts a first reply for every new question; a moderator posts it.`} actions={<JevMark />} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[400px_1fr]">
        <Panel pad={false}>
          <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
            {threads.map(({ t, replies, expert }) => (
              <li key={t.id}>
                <Link href={`/console/community?id=${t.id}`} className={`block px-5 py-3 no-underline hover:bg-bg-2 ${sel?.t.id === t.id ? "bg-accent-soft" : ""}`}>
                  <b className="block">
                    {t.pinned && "📌 "}
                    {t.title}
                  </b>
                  <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <Badge>{t.tag}</Badge> {t.authorName} · {replies} repl{replies === 1 ? "y" : "ies"} · ▲ {t.upvotes} · {relTime(t.lastActivityAt)}
                    {replies === 0 && <Badge tone="warn">Unanswered</Badge>}
                    {expert > 0 && <Badge tone="good">Expert replied</Badge>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        {sel && (
          <Panel
            title={sel.t.title}
            action={
              <ActionButton action={togglePin.bind(null, sel.t.id)} className="text-sm font-bold text-accent">
                {sel.t.pinned ? "Unpin" : "Pin"}
              </ActionButton>
            }
          >
            <p className="m-0 whitespace-pre-line leading-relaxed">{sel.t.body}</p>
            <p className="m-0 mt-2 text-xs text-faint">
              {sel.t.authorName} · {relTime(sel.t.createdAt)}
            </p>
            <ol className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
              {posts.map((p) => (
                <li key={p.id} className={`rounded-field p-3 text-sm leading-relaxed ${p.isExpert ? "bg-accent-soft" : "bg-bg-2"}`}>
                  <b className="block text-xs">
                    {p.authorName} {p.isExpert && <Badge tone="accent">ExH1B expert</Badge>} <span className="font-normal text-faint">· {relTime(p.createdAt)}</span>
                  </b>
                  {p.body}
                </li>
              ))}
            </ol>
            <ActionForm action={moderatorReply} className="mt-5 flex flex-col gap-2">
              <input type="hidden" name="threadId" value={sel.t.id} />
              <label className="text-sm font-semibold" htmlFor="modreply">
                Reply as an ExH1B expert {draftText && <JevMark className="ml-1" />}
              </label>
              <textarea id="modreply" name="body" rows={5} className="field" defaultValue={posts.some((p) => p.isExpert) ? "" : draftText} />
              {draftText && !posts.some((p) => p.isExpert) && <span className="text-xs text-faint">Pre-filled with Jev&apos;s draft. Edit before posting.</span>}
              <div>
                <SubmitButton size="sm">Post reply</SubmitButton>
              </div>
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}
