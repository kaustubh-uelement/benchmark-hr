"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND_TARGETS } from "@/lib/brand-links";
import { ComingSoonModal, type BusinessModalInfo } from "./BrandFooterLinks";

export type BusinessItem = {
  slug: string;
  href: string;
  tag: string;
  name: string;
  line: string;
  cta: string;
  style: "dark" | "sand" | "burgundy";
};

function BusinessIcon({ slug, color }: { slug: string; color: string }) {
  const p = {
    width: 30,
    height: 30,
    viewBox: "0 0 30 30",
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    "aria-hidden": true,
  } as const;

  if (slug === "golden-glove") {
    return (
      <svg {...p}>
        <circle cx="15" cy="15" r="12" />
        <circle cx="15" cy="15" r="6.5" />
        <circle cx="15" cy="15" r="1.6" fill={color} />
      </svg>
    );
  }
  if (slug === "talent") {
    return (
      <svg {...p}>
        <circle cx="9" cy="10" r="3.5" />
        <circle cx="21" cy="10" r="3.5" />
        <circle cx="15" cy="17" r="3.5" />
        <path d="M3 26c.8-3.5 3-5.5 6-5.5M27 26c-.8-3.5-3-5.5-6-5.5M9 28c.8-3.5 3-5 6-5s5.2 1.5 6 5" />
      </svg>
    );
  }
  if (slug === "exh1b") {
    return (
      <svg {...p}>
        <path d="M4 22 C 9 6, 21 6, 26 16" strokeDasharray="2 3" />
        <circle cx="4" cy="22" r="2.4" fill={color} />
        <path d="M23 12l3 4-4.6 1" />
      </svg>
    );
  }
  if (slug === "trustcircle") {
    return (
      <svg width="40" height="29" viewBox="0 0 44 32" aria-hidden="true">
        <mask
          id="bg-tc-mark-cut"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="44"
          height="32"
        >
          <rect width="44" height="32" fill="#fff" />
          <circle
            cx="28"
            cy="16"
            r="10.9"
            fill="none"
            stroke="#000"
            strokeWidth="6.2"
          />
        </mask>
        <circle
          cx="14"
          cy="16"
          r="12"
          mask="url(#bg-tc-mark-cut)"
          fill="#2e61ba"
        />
        <circle
          cx="28"
          cy="16"
          r="10.8"
          fill="none"
          stroke="#e9af3a"
          strokeWidth="3.2"
        />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <rect x="6" y="4" width="18" height="22" rx="2" />
      <path d="M10 10h10M10 15h10M10 20h6" />
    </svg>
  );
}

export function BusinessesGrid({
  businesses,
}: {
  businesses: readonly BusinessItem[];
}) {
  const [modalBusiness, setModalBusiness] = useState<BusinessModalInfo | null>(
    null
  );

  const handleVisitClick = (e: React.MouseEvent, b: BusinessItem) => {
    const target = BRAND_TARGETS[b.slug];
    if (target?.isExternal) {
      // Direct navigation to external destination (ExH1B or TrustCircle)
      return;
    }
    // Others trigger the Coming Soon modal
    e.preventDefault();
    setModalBusiness({ slug: b.slug, name: b.name });
  };

  return (
    <>
      <div className="grid min-w-0 flex-[2_1_640px] grid-cols-1 gap-4 sm:grid-cols-2">
        {businesses.map((b) => {
          const dark = b.style === "dark";
          const burg = b.style === "burgundy";
          const target = BRAND_TARGETS[b.slug];
          const isExternal = !!target?.isExternal;
          const visitHref = target?.href ?? b.href;
          const targetProps = isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          return (
            <article
              key={b.slug}
              className={`flex min-h-[250px] flex-col gap-3 rounded-[22px] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                dark
                  ? "bg-[#142841] text-[#f3eee6]"
                  : burg
                  ? "bg-[#490b1a] text-[#f3eee6]"
                  : "bg-card text-ink"
              }`}
            >
              <BusinessIcon
                slug={b.slug}
                color={dark ? "#d4b06a" : burg ? "#e5ded2" : "#142841"}
              />
              <span
                className={`text-[13px] font-bold ${dark ? "text-[#d4b06a]" : burg ? "text-[#dcb6be]" : "text-accent"}`}
              >
                {b.tag}
              </span>
              <h3 className="m-0 font-display text-[26px] font-normal leading-[1.12]">
                {b.name}
              </h3>
              <p
                className={`m-0 text-[15.5px] leading-relaxed ${dark || burg ? "text-[#c9d2dc]" : "text-muted"}`}
              >
                {b.line}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] font-bold">
                <Link
                  href={`/businesses/${b.slug}`}
                  className={`transition-opacity hover:opacity-80 ${dark ? "text-[#d4b06a]" : ""}`}
                >
                  Learn more
                </Link>
                <a
                  href={visitHref}
                  {...targetProps}
                  onClick={(e) => handleVisitClick(e, b)}
                  className={`inline-flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80 ${
                    dark ? "text-[#d4b06a]" : ""
                  }`}
                >
                  {b.cta} →
                </a>
              </div>
            </article>
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
