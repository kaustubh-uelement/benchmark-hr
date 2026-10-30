import { requirePortal } from "@/lib/portal";
import { TCHeader } from "@/components/trustcircle";
import { PortalBar } from "@/components/brand-shell";

export default async function TCPortalLayout({ children }: { children: React.ReactNode }) {
  const { u, org } = await requirePortal("trustcircle", ["client", "participant"]);
  return (
    <>
      <TCHeader portal />
      <PortalBar name={u.name} sub={u.role === "participant" ? "Your transition programme" : [u.title, org?.name].filter(Boolean).join(" · ")} label={u.role === "participant" ? "Participant" : "Programme sponsor"} />
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">{children}</main>
    </>
  );
}
