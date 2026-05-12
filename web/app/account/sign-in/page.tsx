import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignInForm } from "@/components/account/SignInForm";

export const metadata: Metadata = {
  title: "Sign in to Football IQ",
  description:
    "Sign in to Football IQ with a magic link — no password needed. Sync your streak across devices.",
  alternates: {
    canonical: "https://www.football-iq.app/account/sign-in",
  },
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ next?: string }>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/account");
  }

  const redirectPath = next && next.startsWith("/") && !next.startsWith("//") ? next : "/play";

  return (
    <div className="min-h-screen bg-stadium-navy text-floodlight">
      <nav className="border-b border-white/5 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-bebas text-xl tracking-wider text-pitch-green"
          >
            Football IQ
          </Link>
          <Link
            href="/play"
            className="text-xs font-semibold text-slate-300 hover:text-floodlight transition-colors"
          >
            Play as guest
          </Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-16 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="font-bebas text-4xl tracking-wider">Sign in</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Enter your email and we&apos;ll send you a magic link. No password,
            no hassle.
          </p>
        </header>

        <SignInForm redirectPath={redirectPath} source="account-sign-in" />

        <p className="text-center text-xs text-slate-500 leading-relaxed">
          By signing in you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-300">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-300">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
