"use client";

import Link from "next/link";
import { useState } from "react";

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
  const p = { width: 30, height: 30, viewBox: "0 0 30 30", fill: "none", stroke: color, strokeWidth: 1.6, "aria-hidden": true } as const;
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
        <mask id="bg-tc-mark-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="44" height="32">
          <rect width="44" height="32" fill="#fff" />
          <circle cx="28" cy="16" r="10.9" fill="none" stroke="#000" strokeWidth="6.2" />
        </mask>
        <circle cx="14" cy="16" r="12" mask="url(#bg-tc-mark-cut)" fill="#2e61ba" />
        <circle cx="28" cy="16" r="10.8" fill="none" stroke="#e9af3a" strokeWidth="3.2" />
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

const UPCOMING_SECTIONS = [
  "Specialist Client Portal & candidate dossiers",
  "Real-time compensation & equity benchmarking",
  "Confidential partner-led talent inquiries",
  "Structured 30/90/180-day executive onboarding care",
  "Live mandate status & interview loops",
];

export function BusinessesGrid({ businesses }: { businesses: readonly BusinessItem[] }) {
  const [modalBusiness, setModalBusiness] = useState<BusinessItem | null>(null);

  const handleVisitClick = (e: React.MouseEvent, b: BusinessItem) => {
    // Both exh1b and trustcircle redirect directly to https://exh1b.com/
    if (b.slug === "exh1b" || b.slug === "trustcircle") {
      return; // allow normal anchor navigation to https://exh1b.com/
    }
    // All others trigger the "Coming Soon" modal popup
    e.preventDefault();
    setModalBusiness(b);
  };

  return (
    <>
      <div className="grid min-w-0 flex-[2_1_640px] grid-cols-1 gap-4 sm:grid-cols-2">
        {businesses.map((b) => {
          const dark = b.style === "dark";
          const burg = b.style === "burgundy";
          const isDirectExh1b = b.slug === "exh1b" || b.slug === "trustcircle";
          const visitHref = isDirectExh1b ? "https://exh1b.com/" : b.href;
          const targetProps = isDirectExh1b ? { target: "_blank", rel: "noopener noreferrer" } : {};

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
              <BusinessIcon slug={b.slug} color={dark ? "#d4b06a" : burg ? "#e5ded2" : "#142841"} />
              <span className={`text-[13px] font-bold ${dark ? "text-[#d4b06a]" : burg ? "text-[#dcb6be]" : "text-accent"}`}>
                {b.tag}
              </span>
              <h3 className="m-0 font-display text-[26px] font-normal leading-[1.12]">{b.name}</h3>
              <p className={`m-0 text-[15.5px] leading-relaxed ${dark || burg ? "text-[#c9d2dc]" : "text-muted"}`}>
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

      {/* LUXURIOUS BACKDROP-BLUR MODAL POPUP */}
      {modalBusiness && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop with blur matching website theme */}
          <div
            onClick={() => setModalBusiness(null)}
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
                onClick={() => setModalBusiness(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm text-[#f3eee6] transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Title & Status */}
            <div className="mt-4">
              <h3 className="m-0 font-display text-[26px] font-normal leading-tight text-[#f3eee6] sm:text-[28px]">
                {modalBusiness.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#c9d2dc]">
                The dedicated online portal for <strong className="text-white">{modalBusiness.name}</strong> is currently under development.
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
                href={`/businesses/${modalBusiness.slug}`}
                onClick={() => setModalBusiness(null)}
                className="text-xs font-semibold text-[#d4b06a] hover:underline"
              >
                Practice overview →
              </Link>
              <div className="flex gap-2">
                <Link
                  href="#contact"
                  onClick={() => setModalBusiness(null)}
                  className="inline-flex min-h-9 items-center rounded-full bg-[#e5ded2] px-4 text-xs font-bold text-[#142841] no-underline transition-opacity hover:opacity-90"
                >
                  Contact team
                </Link>
                <button
                  type="button"
                  onClick={() => setModalBusiness(null)}
                  className="inline-flex min-h-9 items-center rounded-full border border-white/20 px-3 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
