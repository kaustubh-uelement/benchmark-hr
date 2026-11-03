export type BrandTarget = {
  slug: string;
  name: string;
  isExternal: boolean;
  href: string;
};

export const BRAND_TARGETS: Record<string, BrandTarget> = {
  "golden-glove": {
    slug: "golden-glove",
    name: "Golden Glove Executive Search",
    isExternal: false,
    href: "/goldenglove",
  },
  talent: {
    slug: "talent",
    name: "Benchmark Talent",
    isExternal: false,
    href: "/talent",
  },
  exh1b: {
    slug: "exh1b",
    name: "ExH1B",
    isExternal: true,
    href: "https://exh1b.com/",
  },
  trustcircle: {
    slug: "trustcircle",
    name: "TrustCircle Outplacements",
    isExternal: true,
    href: "https://main.d12xdg5ph8vsq9.amplifyapp.com/",
  },
  advisory: {
    slug: "advisory",
    name: "Benchmark Advisory",
    isExternal: false,
    href: "/advisory",
  },
};
