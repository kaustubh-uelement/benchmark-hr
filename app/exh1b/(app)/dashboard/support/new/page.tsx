import { requireMember } from "@/lib/member";
import { createTicket } from "@/app/actions/exh1b";
import { ActionForm, SubmitButton } from "@/components/client";
import { Card, JevMark } from "@/components/ui";

export const metadata = { title: "New ticket" };

const CATEGORIES = ["Work from India with same employer", "Job Opportunities", "Profile", "ExH1B Platform", "Relocation", "Finance", "Other"];

export default async function NewTicket() {
  await requireMember();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="m-0 font-display text-3xl font-extrabold tracking-tight">New support ticket</h1>
      <p className="m-0 mb-6 mt-1 text-muted">You&apos;ll see who owns it and when to expect a reply as soon as you send it.</p>
      <Card className="p-6">
        <ActionForm action={createTicket} className="flex flex-col gap-4">
          <input type="hidden" name="brand" value="exh1b" />
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Subject
            <input className="field" name="subject" required maxLength={140} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Category
            <select className="field" name="category" defaultValue="Other">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Message
            <textarea className="field" name="message" rows={6} required />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingText="Sending…">Send ticket</SubmitButton>
            <span className="flex items-center gap-2 text-xs text-muted">
              <JevMark /> checks the category and routes it to the right person.
            </span>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
