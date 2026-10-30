"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["Dashboard", "/exh1b/dashboard"],
  ["Jobs", "/exh1b/jobs"],
  ["Applications", "/exh1b/jobs#application-tracker"],
  ["Profile", "/exh1b/profile"],
  ["Relocate", "/exh1b/relocation"],
  ["Support", "/exh1b/dashboard/support"],
] as const;

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="scroll-x order-last -mx-1 flex w-full gap-1 text-sm font-bold md:order-none md:mx-0 md:ml-4 md:w-auto">
      {ITEMS.map(([l, h]) => {
        const base = h.split("#")[0];
        const active = l !== "Applications" && (path === base || (base !== "/exh1b/dashboard" && path.startsWith(base)) || (l === "Dashboard" && path === "/exh1b/dashboard"));
        return (
          <Link key={l} href={h} aria-current={active ? "page" : undefined} className={`whitespace-nowrap rounded-btn px-3 py-2 no-underline ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-bg-2 hover:text-ink"}`}>
            {l}
          </Link>
        );
      })}
    </nav>
  );
}
