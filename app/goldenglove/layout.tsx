import { BrandFonts } from "@/components/ui";
import { JevAssistant } from "@/components/JevAssistant";

export const metadata = { title: { default: "Golden Glove Executive Search", template: "%s · Golden Glove" }, description: "Retained, partner-led search for CXO, board and rare specialist appointments. A Benchmark HR Group company." };

export default function GoldenGloveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="golden-glove" className="themed gg">
      <BrandFonts theme="golden-glove" />
      {children}
      <JevAssistant surface="golden-glove" greeting="Good day. I'm Jev, Golden Glove's assistant. I can explain how a search works, our fees and timelines, or how to register in confidence." />
    </div>
  );
}
