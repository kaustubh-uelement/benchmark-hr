import { requirePortal } from "@/lib/portal";
import { TalentHeader } from "@/components/talent";
import { PortalBar } from "@/components/brand-shell";

export default async function TalentPortalLayout({ children }: { children: React.ReactNode }) {
  const { u, org } = await requirePortal("talent");
  return (
    <>
      <TalentHeader portal />
      <PortalBar name={u.name} sub={[u.title, org?.name].filter(Boolean).join(" · ")} label="Hiring portal" />
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">{children}</main>
    </>
  );
}
