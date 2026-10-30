import { PortalLogin } from "@/components/PortalLogin";
import { TalentHeader } from "@/components/talent";

export const metadata = { title: "Client sign in" };

export default function TalentLogin() {
  return (
    <PortalLogin
      brand="talent"
      header={<TalentHeader />}
      title="Hiring portal"
      sub="Follow every role live, review shortlisted candidates and give feedback in one click."
      aside={
        <div>
          <span className="text-sm font-bold uppercase tracking-wider text-accent">For hiring managers</span>
          <p className="m-0 mt-4 font-display text-[clamp(40px,5vw,64px)] font-bold leading-[.98] tracking-tight">
            Your pipeline,
            <br />
            <span className="bg-[var(--lime)] px-1">in real time.</span>
          </p>
          <p className="mt-5 max-w-md text-lg text-muted">The same view your recruiter sees: who applied, who passed screening, who you meet next.</p>
        </div>
      }
    />
  );
}
