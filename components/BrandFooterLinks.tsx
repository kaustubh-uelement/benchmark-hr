"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND_TARGETS } from "@/lib/brand-links";

export type BusinessModalInfo = {
  slug: string;
  name: string;
};

const UPCOMING_SECTIONS = [
  "Specialist Client Portal & candidate dossiers",
  "Real-time compensation & equity benchmarking",
  "Confidential partner-led talent inquiries",
  "Structured 30/90/180-day executive onboarding care",
  "Live mandate status & interview loops",
];

export function ComingSoonModal({
  business,
  onClose,
}: {
  business: BusinessModalInfo;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop with blur matching website theme */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0a1524]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[24px] border border-[#f3eee624] bg-gradient-to-b from-[#1b3352] to-[#112338] p-6 text-[#f3eee6] shadow-2xl sm:p-7">
        {/* Header Badge & Close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#d4b06a]/15 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-[#d4b06a] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[.2em] text-[#d4b06a]">
              Coming Soon
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm text-[#f3eee6] transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Title & Status */}
        <div className="mt-4">
          <h3 className="m-0 font-display text-[26px] font-normal leading-tight text-[#f3eee6] sm:text-[28px]">
            {business.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#c9d2dc]">
            The dedicated online portal for{" "}
            <strong className="text-white">{business.name}</strong> is
            currently under development.
          </p>
        </div>

        {/* 5 Distinct Highlights */}
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="m-0 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#d4b06a]">
            Platform Capabilities in Development:
          </p>
          <ul className="m-0 flex flex-col gap-2 p-0 list-none text-xs text-[#e5ded2]">
            {UPCOMING_SECTIONS.map((sec, idx) => (
              <li key={idx} className="flex items-center gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d4b06a]/20 text-[10px] font-bold text-[#d4b06a]">
                  ✓
                </span>
                <span>{sec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            href={`/businesses/${business.slug}`}
            onClick={onClose}
            className="text-xs font-semibold text-[#d4b06a] hover:underline"
          >
            Practice overview →
          </Link>
          <div className="flex gap-2">
            <Link
              href="/#contact"
              onClick={onClose}
              className="inline-flex min-h-9 items-center rounded-full bg-[#e5ded2] px-4 text-xs font-bold text-[#142841] no-underline transition-opacity hover:opacity-90"
            >
              Contact team
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-9 items-center rounded-full border border-white/20 px-3 text-xs font-semibold text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandFooterLinks({
  brands,
}: {
  brands: { slug: string; name: string }[];
}) {
  const [modalBusiness, setModalBusiness] = useState<BusinessModalInfo | null>(
    null
  );

  const handleClick = (
    e: React.MouseEvent,
    item: { slug: string; name: string }
  ) => {
    const target = BRAND_TARGETS[item.slug];
    if (target?.isExternal) {
      // Allow default link navigation directly to target.href (exh1b.com or amplify)
      return;
    }
    // All other 3 subsidiaries trigger the Coming Soon modal
    e.preventDefault();
    setModalBusiness({ slug: item.slug, name: item.name });
  };

  return (
    <>
      <div className="flex flex-col gap-2 text-sm">
        <span className="mb-1 font-bold text-[#f3eee6]">Businesses</span>
        {brands.map((b) => {
          const target = BRAND_TARGETS[b.slug];
          const isExternal = !!target?.isExternal;
          const href = target?.href ?? `/${b.slug}`;

          return (
            <a
              key={b.slug}
              href={href}
              {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              onClick={(e) => handleClick(e, b)}
              className="cursor-pointer text-[#c9d2dc] no-underline transition-colors hover:text-white"
            >
              {b.name}
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
