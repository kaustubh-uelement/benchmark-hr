import Link from "next/link";
import { BenchmarkMark } from "./marks";
import { ActionForm, SubmitButton } from "./client";
import { submitLead } from "@/app/actions/leads";
import { BRANDS } from "@/lib/content/brands";
import { getUser, homeFor } from "@/lib/auth";

export async function GroupHeader({ dark = true }: { dark?: boolean }) {
  const u = await getUser();
  const c = dark ? "text-[#f3eee6]" : "text-ink";
  return (
    <header className={`mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-5 sm:px-8 ${dark ? "border-b border-[#f3eee61f]" : "border-b border-line"}`}>
      <Link href="/" className="no-underline" aria-label="Benchmark HR Group home">
        <BenchmarkMark light={dark} />
      </Link>
      <nav aria-label="Main" className={`flex flex-wrap gap-x-7 gap-y-2 text-[15px] font-semibold ${c}`}>
        <Link href="/#businesses" className="no-underline hover:opacity-80">Businesses</Link>
        <Link href="/#process" className="no-underline hover:opacity-80">How we work</Link>
        <Link href="/#clients" className="no-underline hover:opacity-80">Clients</Link>
        <Link href="/#people" className="no-underline hover:opacity-80">People</Link>
        <Link href="/talent" className="no-underline hover:opacity-80">Careers</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link href={u ? homeFor(u) : "/login"} className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold no-underline ${c} hover:opacity-80`}>
          {u ? "My workspace" : "Sign in"}
        </Link>
        <Link href="/#contact" className={`inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-bold no-underline ${dark ? "bg-[#e5ded2] text-[#142841]" : "bg-primary text-primary-ink"}`}>
          Start a conversation
        </Link>
      </div>
    </header>
  );
}

export function ContactForm({ defaultInterest = "" }: { defaultInterest?: string }) {
  return (
    <ActionForm action={submitLead} className="flex flex-col gap-4">
      <input type="hidden" name="brand" value="group" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Your name
          <input className="field" name="name" autoComplete="name" required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Work email
          <input className="field" type="email" name="email" autoComplete="email" required />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Company
          <input className="field" name="company" autoComplete="organization" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          What do you need?
          <select className="field" name="interest" defaultValue={defaultInterest}>
            <option value="">Not sure yet</option>
            {BRANDS.filter((b) => b.kind === "subsidiary").map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Message
        <textarea className="field" name="message" rows={4} />
      </label>
      <div>
        <SubmitButton size="lg" pendingText="Sending…">
          Send message
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function GroupFooter() {
  return (
    <footer className="bg-[#0f1f33] text-[#c9d2dc]">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <BenchmarkMark light />
          <p className="m-0 max-w-xs text-sm leading-relaxed">Executive search and HR advisory for businesses that take their people seriously.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 font-bold text-[#f3eee6]">Businesses</span>
          {BRANDS.filter((b) => b.kind === "subsidiary").map((b) => (
            <Link key={b.slug} href={b.base} className="no-underline hover:text-white">
              {b.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 font-bold text-[#f3eee6]">Company</span>
          <Link href="/#process" className="no-underline hover:text-white">How we work</Link>
          <Link href="/#people" className="no-underline hover:text-white">People</Link>
          <Link href="/talent" className="no-underline hover:text-white">Careers</Link>
          <Link href="/login" className="no-underline hover:text-white">Sign in</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 font-bold text-[#f3eee6]">Contact</span>
          <a href="mailto:hello@benchmarkhr.in" className="no-underline hover:text-white">hello@benchmarkhr.in</a>
          <a href="tel:+918888400044" className="no-underline hover:text-white">+91 88884 00044</a>
          <span>Pune, India</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-[#ffffff14] px-5 py-6 text-xs sm:px-8">
        <span>© 2026 Benchmark HR. All rights reserved.</span>
        <Link href="/#contact" className="no-underline hover:text-white">Privacy policy</Link>
      </div>
    </footer>
  );
}
