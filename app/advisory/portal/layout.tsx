import { requirePortal } from "@/lib/portal";
import { AdvHeader } from "@/components/advisory";
import { PortalBar } from "@/components/brand-shell";

export default async function AdvPortalLayout({ children }: { children: React.ReactNode }) {
  const { u, org } = await requirePortal("advisory");
  return (
    <>
      <AdvHeader portal />
      <PortalBar name={u.name} sub={[u.title, org?.name].filter(Boolean).join(" · ")} label="Client portal" />
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">{children}</main>
    </>
  );
}
