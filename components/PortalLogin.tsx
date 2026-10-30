import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LoginForm } from "./LoginForm";
import { getUser, homeFor } from "@/lib/auth";
import { DEMO_ACCOUNTS } from "@/lib/content/demo";

/** Branded sign-in used by every subsidiary portal. Inherits the brand's theme tokens. */
export async function PortalLogin({ brand, header, aside, title, sub, next }: { brand: string; header: ReactNode; aside: ReactNode; title: string; sub: string; next?: string }) {
  const u = await getUser();
  if (u) redirect(homeFor(u));
  return (
    <div className="flex min-h-screen flex-col">
      {header}
      <div className="mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-12 px-5 py-14 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
        <div>{aside}</div>
        <div className="rounded-card border border-line bg-card p-7 sm:p-9">
          <h1 className="m-0 font-display text-[34px] leading-tight">{title}</h1>
          <p className="mb-6 mt-2 text-muted">{sub}</p>
          <LoginForm next={next} demo={DEMO_ACCOUNTS[brand] ?? []} keepSignedIn recovery={false} />
        </div>
      </div>
    </div>
  );
}
