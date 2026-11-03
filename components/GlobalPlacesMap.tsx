"use client";

import Image from "next/image";
import { useState } from "react";

type Pin = {
  id: string;
  title: string;
  region: string;
  left: string;
  top: string;
  desc: string;
  stat: string;
  delay?: string;
};

const PINS: Pin[] = [
  {
    id: "sf",
    title: "San Francisco & Bay Area",
    region: "United States (West)",
    left: "11%",
    top: "32%",
    desc: "Active cross-border returnee pipeline and executive talent engagements.",
    stat: "35+ leadership searches",
  },
  {
    id: "chicago",
    title: "Illinois / Chicago",
    region: "United States (Midwest)",
    left: "20%",
    top: "34%",
    desc: "Longstanding executive advisory and enterprise leadership engagements.",
    stat: "Advisory presence",
    delay: "0.15s",
  },
  {
    id: "london",
    title: "London & UK",
    region: "United Kingdom & Europe",
    left: "47%",
    top: "24%",
    desc: "HR governance, senior capability centre setups and GCC leader placements.",
    stat: "Founding governance",
    delay: "0.3s",
  },
  {
    id: "dubai",
    title: "Dubai & Middle East",
    region: "UAE & GCC",
    left: "62%",
    top: "43%",
    desc: "Regional leadership appointments across fintech, logistics and digital.",
    stat: "High-growth hub",
    delay: "0.45s",
  },
  {
    id: "pune",
    title: "Pune & Mumbai",
    region: "India (Headquarters)",
    left: "69%",
    top: "52%",
    desc: "Benchmark HR Group headquarters. Serving 90+ companies since 2013.",
    stat: "Group Headquarters",
    delay: "0.6s",
  },
  {
    id: "delhi",
    title: "Delhi NCR",
    region: "India (North)",
    left: "70.5%",
    top: "45%",
    desc: "Leadership development, board advisory and CXO search practices.",
    stat: "Advisory & Search",
    delay: "0.7s",
  },
  {
    id: "bengaluru",
    title: "Bengaluru & Hyderabad",
    region: "India (South)",
    left: "71%",
    top: "57%",
    desc: "Deep tech, GCC scaling and returnee placement corridors.",
    stat: "GCC & Deep Tech",
    delay: "0.8s",
  },
  {
    id: "singapore",
    title: "Singapore",
    region: "Southeast Asia",
    left: "78%",
    top: "58%",
    desc: "APAC regional leadership and cross-border tech relocations.",
    stat: "APAC Corridor",
    delay: "0.9s",
  },
];

export function GlobalPlacesMap() {
  const [activePin, setActivePin] = useState<Pin | null>(null);

  return (
    <section id="places-map" className="relative overflow-hidden bg-[#142841] px-5 py-20 text-[#f3eee6] sm:px-8 sm:py-24">
      {/* Background radial gradient spotlight */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_45%,#000_30%,transparent_100%)]"
        style={{
          background: "radial-gradient(circle at 50% 45%, #254a75 0%, #142841 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1240px]">
        {/* Header Eyebrow */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="m-0 text-xs font-bold uppercase tracking-[.28em] text-[#d4b06a]">
            Global Corridors · Local Depth
          </p>
        </div>

        {/* Map Container */}
        <div className="relative mx-auto max-w-[960px]">
          {/* World Map Image */}
          <div className="relative aspect-[903/452] w-full select-none">
            <Image
              src="/places-map-navy.png"
              alt="Benchmark HR Global Corridors Map"
              width={903}
              height={452}
              className="h-full w-full object-contain opacity-75 transition-opacity duration-300 hover:opacity-85"
              priority
            />

            {/* Pulsating Animated Map Pins */}
            <div className="absolute inset-0">
              {PINS.map((pin) => {
                const isSelected = activePin?.id === pin.id;
                return (
                  <div
                    key={pin.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125"
                    style={{
                      left: pin.left,
                      top: pin.top,
                      zIndex: isSelected ? 30 : 20,
                    }}
                    onClick={() => setActivePin(isSelected ? null : pin)}
                  >
                    {/* Outer Pulsating Ring */}
                    <span
                      className="absolute -inset-2.5 rounded-full border border-[#d4b06a]/70"
                      style={{
                        animation: "mapPulsate 2.4s ease-in-out infinite",
                        animationDelay: pin.delay ?? "0s",
                      }}
                    />

                    {/* Secondary Echo Ring */}
                    <span
                      className="absolute -inset-1 rounded-full bg-[#d4b06a]/25"
                      style={{
                        animation: "mapPulsate 2.4s ease-in-out infinite 0.7s",
                      }}
                    />

                    {/* Core Pin Dot */}
                    <span
                      className={`relative block h-3.5 w-3.5 rounded-full border-2 transition-all duration-300 ${
                        isSelected
                          ? "border-[#f3eee6] bg-[#490b1a] shadow-[0_0_16px_#d4b06a]"
                          : "border-[#e5ded2] bg-[#d4b06a] shadow-[0_0_8px_rgba(212,176,106,0.6)]"
                      }`}
                    />

                    {/* Quick Pin Label on desktop */}
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#0a1524]/85 px-2 py-0.5 text-[10px] font-semibold text-[#f3eee6] opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:block hidden">
                      {pin.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Interactive Info Card Popup over Map (Codepen behavior matching dark theme) */}
            {activePin && (
              <div
                className="absolute z-40 w-64 -translate-y-full rounded-2xl border border-[#f3eee626] bg-[#0c192b]/95 p-4 text-[#f3eee6] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                style={{
                  left: `clamp(10%, ${activePin.left}, 75%)`,
                  top: `calc(${activePin.top} - 16px)`,
                }}
              >
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                  <div>
                    <h4 className="m-0 font-display text-base font-semibold text-[#f3eee6]">
                      {activePin.title}
                    </h4>
                    <p className="m-0 text-[11px] font-medium text-[#d4b06a]">
                      {activePin.region}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePin(null)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] text-white hover:bg-white/20"
                    aria-label="Close pin details"
                  >
                    ✕
                  </button>
                </div>
                <p className="m-0 mt-2 text-xs leading-relaxed text-[#c9d2dc]">
                  {activePin.desc}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#e5ded2]">{activePin.stat}</span>
                  <a href="#contact" className="text-[#d4b06a] hover:underline">
                    Inquire →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Headline Over / Below the Map Section (Preserved verbatim) */}
        <div className="mx-auto mt-12 max-w-3xl px-4 text-center">
          <p className="m-0 font-display text-[clamp(24px,3.2vw,40px)] font-normal leading-snug text-[#f3eee6]">
            Since 2013, Benchmark has helped more than 90 organisations find the leaders and build the teams that shape them.
          </p>
        </div>
      </div>

      {/* Pulsate Animation Keyframe */}
      <style jsx>{`
        @keyframes mapPulsate {
          0% {
            transform: scale(0.3);
            opacity: 1;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
