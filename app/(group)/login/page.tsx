import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { DEMO_ACCOUNTS } from "@/lib/content/demo";
import { BenchmarkMark } from "@/components/marks";
import { getUser, homeFor } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const u = await getUser();
  if (u && !next) redirect(homeFor(u));
  const all = [...DEMO_ACCOUNTS.group, ...DEMO_ACCOUNTS["golden-glove"].slice(0, 1), ...DEMO_ACCOUNTS.exh1b, ...DEMO_ACCOUNTS.talent, ...DEMO_ACCOUNTS.trustcircle, ...DEMO_ACCOUNTS.advisory];
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-between bg-[#142841] p-8 text-[#f3eee6] sm:p-12">
        <Link href="/" className="no-underline">
          <BenchmarkMark light />
        </Link>
        <div className="my-12">
          <h1 className="m-0 font-display text-[clamp(38px,4.4vw,64px)] font-normal leading-[1.05]">One sign-in for every Benchmark business.</h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-[#c9d2dc]">Team members land in the operations console. Clients, members and participants land in their own portal.</p>
        </div>
        <p className="m-0 text-sm text-[#b3c0cf]">Golden Glove · Benchmark Talent · ExH1B · TrustCircle · Benchmark Advisory</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <h2 className="m-0 mb-6 font-display text-3xl font-normal">Sign in</h2>
          <LoginForm next={next} demo={all} />
        </div>
      </div>
    </div>
  );
}
