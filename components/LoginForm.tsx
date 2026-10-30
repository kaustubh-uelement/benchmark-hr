"use client";

import { useActionState, useRef } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "./client";
import { cx } from "./ui";

import type { DemoAccount } from "@/lib/content/demo";

export function LoginForm({ next, demo, keepSignedIn, recovery, className }: { next?: string; demo?: DemoAccount[]; keepSignedIn?: boolean; recovery?: boolean; className?: string }) {
  const [state, action] = useActionState(loginAction, null);
  const emailRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  return (
    <div className={cx("flex flex-col gap-5", className)}>
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        {keepSignedIn && <input type="hidden" name="rememberShown" value="1" />}
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Email
          <input ref={emailRef} className="field" type="email" name="email" autoComplete="email" required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Password
          <input ref={pwRef} className="field" type="password" name="password" autoComplete="current-password" required />
        </label>
        {(keepSignedIn || recovery) && (
          <div className="flex items-center justify-between text-sm">
            {keepSignedIn && (
              <label className="flex items-center gap-2">
                <input type="checkbox" name="remember" defaultChecked className="h-4 w-4 accent-[var(--accent)]" /> Keep me signed in
              </label>
            )}
            {recovery && (
              <a href="mailto:support@exh1b.com?subject=Account%20recovery" className="font-semibold text-accent">
                Forgot password?
              </a>
            )}
          </div>
        )}
        {state?.error && (
          <p role="alert" className="m-0 rounded-field bg-bad-soft px-3 py-2 text-sm font-semibold text-bad">
            {state.error}
          </p>
        )}
        <SubmitButton size="lg" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>
      {demo && demo.length > 0 && (
        <div className="rounded-card border border-dashed border-line p-4">
          <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-faint">Demo accounts · password Demo@2026</p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {demo.map((d) => (
              <li key={d.email}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-field px-2.5 py-2 text-left text-sm hover:bg-bg-2"
                  onClick={() => {
                    if (emailRef.current) emailRef.current.value = d.email;
                    if (pwRef.current) pwRef.current.value = "Demo@2026";
                  }}
                >
                  <span>
                    <b>{d.label}</b>
                    <span className="block text-xs text-muted">{d.email}</span>
                  </span>
                  <span className="text-xs font-semibold text-faint">{d.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

