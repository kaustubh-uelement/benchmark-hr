import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { DEMO_ACCOUNTS } from "@/lib/content/demo";
import { ExH1BMark } from "@/components/marks";
import { getUser, homeFor } from "@/lib/auth";

export const metadata = { title: "Login" };

export default async function ExLogin() {
  const u = await getUser();
  if (u) redirect(homeFor(u));
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[20px] border border-line bg-card p-7 shadow-sm sm:p-9">
        <Link href="/exh1b" className="no-underline">
          <ExH1BMark />
        </Link>
        <h1 className="m-0 mt-6 font-display text-3xl font-extrabold">Welcome back</h1>
        <p className="m-0 mb-6 mt-1 text-muted">Sign in to see your matches and plan your move.</p>
        <button type="button" disabled title="Google sign-in: add GOOGLE_CLIENT_ID to enable" className="mb-4 flex min-h-11 w-full items-center justify-center gap-2.5 rounded-btn border-[1.5px] border-line font-bold opacity-70">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continue with Google
        </button>
        <div className="mb-4 flex items-center gap-3 text-xs text-faint">
          <span className="h-px flex-1 bg-line" />
          or with email
          <span className="h-px flex-1 bg-line" />
        </div>
        <LoginForm keepSignedIn recovery demo={DEMO_ACCOUNTS.exh1b} />
        <p className="m-0 mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/exh1b/auth/signup" className="font-bold text-accent">
            Create your profile
          </Link>
        </p>
      </div>
    </div>
  );
}
