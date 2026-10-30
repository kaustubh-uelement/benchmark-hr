"use client";

import Link from "next/link";
import { useActionState } from "react";
import { exh1bSignupAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/client";
import { ExH1BMark } from "@/components/marks";

export default function ExSignup() {
  const [state, action] = useActionState(exh1bSignupAction, null);
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-lg rounded-[20px] border border-line bg-card p-7 shadow-sm sm:p-9">
        <Link href="/exh1b" className="no-underline">
          <ExH1BMark />
        </Link>
        <h1 className="m-0 mt-6 font-display text-3xl font-extrabold">Create your profile</h1>
        <p className="m-0 mb-6 mt-1 text-muted">Free to create. Takes about five minutes.</p>
        <form action={action} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              First name
              <input className="field" name="firstName" autoComplete="given-name" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Last name
              <input className="field" name="lastName" autoComplete="family-name" required />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Email
            <input className="field" type="email" name="email" autoComplete="email" required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Password
            <input className="field" type="password" name="password" autoComplete="new-password" minLength={8} required />
          </label>
          <fieldset className="m-0 flex flex-col gap-2.5 rounded-field border border-line p-4 text-sm">
            <legend className="px-1 font-bold">Your data</legend>
            <label className="flex gap-2.5">
              <input type="checkbox" name="aiMatching" defaultChecked className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
              <span>Let Jev, our assistant, match me to roles using my profile.</span>
            </label>
            <label className="flex gap-2.5">
              <input type="checkbox" name="groupSharing" className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
              <span>Share my profile with other Benchmark HR Group businesses (for example Golden Glove executive search). You can change this any time.</span>
            </label>
          </fieldset>
          {state?.error && (
            <p role="alert" className="m-0 rounded-field bg-bad-soft px-3 py-2 text-sm font-semibold text-bad">
              {state.error}
            </p>
          )}
          <SubmitButton size="lg" pendingText="Creating…">
            Create profile
          </SubmitButton>
        </form>
        <p className="m-0 mt-6 text-center text-sm text-muted">
          Already a member?{" "}
          <Link href="/exh1b/auth/login" className="font-bold text-accent">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
