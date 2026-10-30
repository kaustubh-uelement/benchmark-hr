import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireMember } from "@/lib/member";
import { db, schema as s } from "@/lib/db";
import { replyThread } from "@/app/actions/exh1b";
import { ActionForm, SubmitButton } from "@/components/client";
import { Avatar, Badge, Card } from "@/components/ui";
import { relTime } from "@/lib/time";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMember();
  const id = Number((await params).id);
  const t = db.select().from(s.threads).where(eq(s.threads.id, id)).get();
  if (!t) notFound();
  const posts = db.select().from(s.posts).where(eq(s.posts.threadId, id)).orderBy(asc(s.posts.createdAt)).all();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/exh1b/community" className="text-sm font-bold text-accent">
        ← Community
      </Link>
      <Card className="p-6">
        <div className="flex gap-2">
          <Badge>{t.tag}</Badge>
          <Badge tone="accent">▲ {t.upvotes}</Badge>
        </div>
        <h1 className="m-0 mt-3 font-display text-2xl font-extrabold leading-snug">{t.title}</h1>
        <p className="m-0 mt-1 text-sm text-muted">
          {t.authorName} · {relTime(t.createdAt)}
        </p>
        <p className="m-0 mt-4 whitespace-pre-wrap leading-relaxed">{t.body}</p>
      </Card>
      <h2 className="m-0 font-display text-lg font-bold">
        {posts.length} repl{posts.length === 1 ? "y" : "ies"}
      </h2>
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {posts.map((p) => (
          <li key={p.id}>
            <Card className={`flex gap-3 p-4 ${p.isExpert ? "border-accent" : ""}`}>
              <Avatar name={p.authorName} size={36} />
              <div className="min-w-0">
                <p className="m-0 text-sm font-bold">
                  {p.authorName} {p.isExpert && <Badge tone="good">Team</Badge>} <span className="font-normal text-faint">· {relTime(p.createdAt)}</span>
                </p>
                <p className="m-0 mt-1 whitespace-pre-wrap leading-relaxed">{p.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <Card className="p-4">
        <ActionForm action={replyThread} className="flex flex-col gap-3">
          <input type="hidden" name="threadId" value={t.id} />
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Your reply
            <textarea className="field" name="body" rows={3} required />
          </label>
          <div>
            <SubmitButton size="sm">Post reply</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
