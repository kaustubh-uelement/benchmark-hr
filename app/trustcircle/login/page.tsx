import { PortalLogin } from "@/components/PortalLogin";
import { TCHeader } from "@/components/trustcircle";

export const metadata = { title: "Sign in" };

export default function TCLogin() {
  return (
    <PortalLogin
      brand="trustcircle"
      header={<TCHeader />}
      title="Welcome back"
      sub="Participants see their plan and matched roles. Sponsoring companies see programme progress."
      aside={
        <div>
          <p className="m-0 font-display text-[clamp(40px,5vw,64px)] font-semibold leading-[1.02]">
            One step at a time, <em className="font-normal text-accent">together.</em>
          </p>
          <p className="mt-5 max-w-md text-lg text-muted">What you share with your coach stays with your coach. Sponsors only ever see progress and outcomes.</p>
        </div>
      }
    />
  );
}
