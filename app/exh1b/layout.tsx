import { BrandFonts } from "@/components/ui";
import { JevAssistant } from "@/components/JevAssistant";

export const metadata = { title: { default: "ExH1B — Coming home", template: "%s · ExH1B" } };

const modeScript = `try{var m=localStorage.getItem("exh1b-mode");if(m==="dark")document.currentScript.parentElement.setAttribute("data-mode","dark")}catch(e){}`;

export default function ExLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="exh1b" data-mode="light" className="themed">
      <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      <BrandFonts theme="exh1b" />
      {children}
      <JevAssistant surface="exh1b" greeting="Hi, I'm Jev. Members: ask about your matches, profile, tickets or the move itself. Visitors: ask how ExH1B works." />
    </div>
  );
}
