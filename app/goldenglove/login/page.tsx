import { PortalLogin } from "@/components/PortalLogin";
import { GGEyebrow, GGHeader } from "@/components/goldenglove";

export const metadata = { title: "Client sign in" };

export default function GGLogin() {
  return (
    <PortalLogin
      brand="golden-glove"
      header={<GGHeader />}
      title="Client room"
      sub="Sign in to follow your search: the market map, the shortlist and our view on each person."
      aside={
        <div>
          <GGEyebrow>For clients of Golden Glove</GGEyebrow>
          <p className="m-0 mt-6 font-display text-[clamp(44px,5vw,72px)] font-medium leading-[.98]">
            Every search, <em className="gold-text">in the open</em>, between you and your partner.
          </p>
          <p className="mt-6 max-w-md font-light leading-relaxed text-muted">Candidate dossiers are shown only once a person has agreed to be considered for your role.</p>
        </div>
      }
    />
  );
}
