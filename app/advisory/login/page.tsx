import { PortalLogin } from "@/components/PortalLogin";
import { AdvHeader } from "@/components/advisory";

export const metadata = { title: "Client sign in" };

export default function AdvLogin() {
  return (
    <PortalLogin
      brand="advisory"
      header={<AdvHeader />}
      title="Client portal"
      sub="Your projects, milestones, documents and invoices."
      aside={
        <div className="border-l-2 border-accent pl-6">
          <p className="m-0 font-display text-[clamp(40px,5vw,62px)] leading-[1.02]">
            Every milestone, <em>on the record.</em>
          </p>
          <p className="mt-5 max-w-md text-lg text-muted">Follow each engagement as it moves from discovery to read-out, and message your principal directly.</p>
        </div>
      }
    />
  );
}
