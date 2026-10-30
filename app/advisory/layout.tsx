import { BrandFonts } from "@/components/ui";
import { JevAssistant } from "@/components/JevAssistant";

export const metadata = { title: { default: "Benchmark Advisory — Before the hire", template: "%s · Benchmark Advisory" }, description: "People strategy, succession, policies and labour-law compliance for growing Indian companies." };

export default function AdvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="advisory" className="themed">
      <BrandFonts theme="advisory" />
      {children}
      <JevAssistant surface="advisory" />
    </div>
  );
}
