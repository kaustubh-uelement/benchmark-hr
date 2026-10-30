import { NextResponse, type NextRequest } from "next/server";

/**
 * One deployment, many brand domains.
 *
 * Each subsidiary can be served from its own domain while living in this one
 * app and database. A request to https://goldenglove.in/portal is rewritten
 * to /goldenglove/portal; links that already carry the prefix pass through.
 *
 * Override the map with BRAND_DOMAINS, e.g.
 *   BRAND_DOMAINS="exh1b.com=/exh1b,goldenglove.in=/goldenglove"
 */
const DEFAULT_MAP: Record<string, string> = {
  "exh1b.com": "/exh1b",
  "goldenglove.in": "/goldenglove",
  "trustcircle.in": "/trustcircle",
  "talent.benchmarkhr.in": "/talent",
  "advisory.benchmarkhr.in": "/advisory",
};

function domainMap(): Record<string, string> {
  const env = process.env.BRAND_DOMAINS;
  if (!env) return DEFAULT_MAP;
  return Object.fromEntries(
    env
      .split(",")
      .map((p) => p.trim().split("="))
      .filter((x) => x.length === 2)
      .map(([d, prefix]) => [d.toLowerCase(), prefix.startsWith("/") ? prefix : `/${prefix}`]),
  );
}

const SHARED = ["/api", "/console", "/login", "/logout", "/_next", "/favicon"];

export function proxy(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(":")[0].replace(/^www\./, "").toLowerCase();
  const prefix = domainMap()[host];
  if (!prefix) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`) || SHARED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `${prefix}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$).*)"],
};
