import { BrandFonts } from "@/components/ui";
import { JevAssistant } from "@/components/JevAssistant";

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="group" className="themed">
      <BrandFonts theme="group" />
      {children}
      <JevAssistant surface="group" greeting="Hello, I'm Jev, Benchmark HR Group's assistant. Tell me what you need, whether that's a leader, a team, a move home, a transition or HR advice, and I'll point you to the right business." />
    </div>
  );
}
