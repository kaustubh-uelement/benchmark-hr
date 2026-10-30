import { requirePortal } from "@/lib/portal";
import { GGHeader } from "@/components/goldenglove";
import { Avatar } from "@/components/ui";

export default async function GGPortalLayout({ children }: { children: React.ReactNode }) {
  const { u, org } = await requirePortal("golden-glove");
  return (
    <>
      <GGHeader portal />
      <div className="border-b border-line bg-bg-2">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm sm:px-10">
          <span className="flex items-center gap-3">
            <Avatar name={u.name} size={30} />
            <span>
              <b className="font-medium">{u.name}</b> <span className="text-muted">· {[u.title, org?.name].filter(Boolean).join(" · ")}</span>
            </span>
          </span>
          <span className="text-[12px] uppercase tracking-[.24em] text-[var(--gold-2)]">Client room · confidential</span>
        </div>
      </div>
      <main className="mx-auto max-w-[1280px] px-5 py-12 sm:px-10">{children}</main>
    </>
  );
}
