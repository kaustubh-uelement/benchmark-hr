import type { Metadata, Viewport } from "next";
import "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Benchmark HR Group — Executive Search & HR Advisory", template: "%s · Benchmark HR Group" },
  description: "Executive search, team hiring, returnee careers, outplacement and HR advisory — one group, one platform.",
  icons: {
    icon: "/benchmark-icon.png",
    shortcut: "/benchmark-icon.png",
    apple: "/benchmark-icon.png",
  },
  openGraph: {
    title: "Benchmark HR Group — Executive Search & HR Advisory",
    description: "Executive search, team hiring, returnee careers, outplacement and HR advisory — one group, one platform.",
    images: [{ url: "/benchmark-logo.png", width: 440, height: 110, alt: "Benchmark HR Group" }],
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
