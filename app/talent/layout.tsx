import { BrandFonts } from "@/components/ui";
import { JevAssistant } from "@/components/JevAssistant";

export const metadata = { title: { default: "Benchmark Talent — The team", template: "%s · Benchmark Talent" }, description: "Mid-senior and specialist hiring for scale-ups and global capability centres in India." };

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="talent" className="themed">
      <BrandFonts theme="talent" />
      {children}
      <JevAssistant surface="talent" />
    </div>
  );
}
