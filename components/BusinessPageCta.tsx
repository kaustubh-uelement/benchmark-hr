"use client";

import Link from "next/link";
import { useState } from "react";
import { BRAND_TARGETS } from "@/lib/brand-links";
import { ComingSoonModal } from "./BrandFooterLinks";

export function BusinessPageCta({
  slug,
  shortName,
  golden = false,
}: {
  slug: string;
  shortName: string;
  golden?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const target = BRAND_TARGETS[slug];
  const isExternal = !!target?.isExternal;
  const href = target?.href ?? `/${slug}`;

  const handleVisit = (e: React.MouseEvent) => {
    if (isExternal) return; // Allow normal navigation
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <>
      <div className="mt-9 flex flex-wrap gap-3">
        <a
          href={href}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          onClick={handleVisit}
          className={`inline-flex min-h-12 items-center rounded-full px-6 font-bold no-underline cursor-pointer transition-opacity hover:opacity-90 ${
            golden
              ? "bg-[#d4b06a] text-[#0b1828]"
              : "bg-[#e5ded2] text-[#142841]"
          }`}
        >
          Go to {shortName}
        </a>
        <Link
          href="#contact"
          className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-[#f3eee666] px-5 font-bold no-underline transition-colors hover:bg-white/10"
        >
          Talk to us
        </Link>
      </div>

      {showModal && (
        <ComingSoonModal
          business={{ slug, name: target?.name ?? shortName }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
