"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND_TARGETS } from "@/lib/brand-links";
import { ComingSoonModal, type BusinessModalInfo } from "./BrandFooterLinks";

const BRAND_ITEMS = [
  { label: "Group", slug: "group", href: "/" },
  { label: "Golden Glove Executive Search", slug: "golden-glove", href: "/goldenglove" },
  { label: "Benchmark Talent", slug: "talent", href: "/talent" },
  { label: "ExH1B", slug: "exh1b", href: "/exh1b" },
  { label: "TrustCircle Outplacements", slug: "trustcircle", href: "/trustcircle" },
  { label: "Benchmark Advisory", slug: "advisory", href: "/advisory" },
];

export function BrandShellGroupLinks({ isDark = false }: { isDark?: boolean }) {
  const [modalBusiness, setModalBusiness] = useState<BusinessModalInfo | null>(null);

  const handleClick = (e: React.MouseEvent, item: typeof BRAND_ITEMS[number]) => {
    if (item.slug === "group") return; // Group homepage goes to /
    const target = BRAND_TARGETS[item.slug];
    if (target?.isExternal) return; // ExH1B & TrustCircle navigate to their live sites
    e.preventDefault();
    setModalBusiness({ slug: item.slug, name: target?.name ?? item.label });
  };

  return (
    <>
      <div className={`flex flex-col gap-1.5 text-sm ${isDark ? "text-muted" : "text-muted"}`}>
        <b className={isDark ? "mb-1 text-[var(--gold-2,var(--ink))]" : "mb-1 text-ink"}>
          Benchmark HR Group
        </b>
        {BRAND_ITEMS.map((item) => {
          if (item.slug === "group") {
            return (
              <Link key={item.href} href={item.href} className="no-underline hover:text-ink">
                {item.label}
              </Link>
            );
          }
          const target = BRAND_TARGETS[item.slug];
          const isExternal = !!target?.isExternal;
          const href = target?.href ?? item.href;
          return (
            <a
              key={item.slug}
              href={href}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={(e) => handleClick(e, item)}
              className="cursor-pointer no-underline hover:text-ink"
            >
              {item.label}
            </a>
          );
        })}
      </div>

      {modalBusiness && (
        <ComingSoonModal
          business={modalBusiness}
          onClose={() => setModalBusiness(null)}
        />
      )}
    </>
  );
}
