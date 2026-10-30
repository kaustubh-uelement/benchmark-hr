import { BrandFonts } from "@/components/ui";
import { JevAssistant } from "@/components/JevAssistant";

export const metadata = { title: { default: "TrustCircle — The next chapter", template: "%s · TrustCircle" }, description: "Career transition and outplacement for leaders and teams going through change. A Benchmark HR Group company." };

export default function TCLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="trustcircle" className="themed">
      <BrandFonts theme="trustcircle" />
      {children}
      <JevAssistant surface="trustcircle" greeting="Hello, I'm Jev. Whether you're planning a restructuring or your own role has ended, I can explain how TrustCircle works and put you in touch with a coach." />
    </div>
  );
}
