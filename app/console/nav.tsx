"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { setScope } from "@/app/actions/console";

type Item = { label: string; href: string; count?: number; show?: boolean };

export function ConsoleNav({ groups }: { groups: { title: string; items: Item[] }[] }) {
  const path = usePathname();
  const all = groups.flatMap((g) => g.items.map((i) => i.href));
  const best = all.filter((h) => (h === "/console" ? path === "/console" : path === h || path.startsWith(h + "/"))).sort((a, b) => b.length - a.length)[0];
  return (
    <nav aria-label="Console" className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-0.5">
          <span className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#8798ae]">{g.title}</span>
          {g.items
            .filter((i) => i.show !== false)
            .map((i) => {
              const active = i.href === best;
              return (
                <Link
                  key={i.href}
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-[10px] px-3 py-2 text-[14.5px] font-semibold no-underline transition ${active ? "bg-[#f3eee6] text-[#142841]" : "text-[#d5dce5] hover:bg-[#1d3555]"}`}
                >
                  {i.label}
                  {!!i.count && <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${active ? "bg-[#490b1a] text-[#f3eee6]" : "bg-[#490b1a] text-[#f3eee6]"}`}>{i.count}</span>}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

export function ScopeSwitcher({ brands, value }: { brands: { slug: string; name: string }[]; value: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#8798ae]">
      Working in
      <select
        className="min-h-10 rounded-[10px] border border-[#2c4566] bg-[#1d3555] px-3 text-[14px] font-semibold normal-case tracking-normal text-[#f3eee6]"
        value={value}
        disabled={pending}
        onChange={(e) => start(() => setScope(e.target.value))}
      >
        <option value="all">All businesses</option>
        {brands.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
