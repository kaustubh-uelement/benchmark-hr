import type { Metadata, Viewport } from "next";
import "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Benchmark HR Group", template: "%s · Benchmark HR Group" },
  description: "Executive search, team hiring, returnee careers, outplacement and HR advisory — one group, one platform.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
