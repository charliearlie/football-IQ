import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  DeleteAccountButton,
  SignOutButton,
} from "@/components/account/AccountActions";
import { ManageSubscription } from "@/components/account/ManageSubscription";

export const metadata: Metadata = {
  title: "Your Football IQ account",
  description:
    "Manage your Football IQ account — subscription, sign out, and account deletion.",
  alternates: {
    canonical: "https://www.football-iq.app/account",
  },
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/account/sign-in?next=/account");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("is_premium, premium_purchased_at, total_iq, created_at")
    .eq("id", user.id)
    .maybeSingle()) as {
    data: {
      is_premium: boolean | null;
      premium_purchased_at: string | null;
      total_iq: number | null;
      created_at: string | null;
    } | null;
  };

  const isPremium = profile?.is_premium ?? false;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    : null;

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
            Play
          </Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 className="font-bebas text-4xl tracking-wider">Your account</h1>
          <p className="text-sm text-slate-400">{user.email}</p>
        </header>

        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subscription
            </span>
            <span
              className={
                isPremium
                  ? "text-xs font-semibold px-2 py-0.5 rounded-full bg-pitch-green/20 text-pitch-green border border-pitch-green/30"
                  : "text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10"
              }
            >
              {isPremium ? "Premium" : "Free"}
            </span>
          </div>
          <p className="text-sm text-slate-300">
            {isPremium
              ? "You have full access to the archive, ad-free play, and Career Path Pro."
              : "Upgrade to unlock the archive, Career Path Pro, and remove ads."}
          </p>
          {isPremium ? (
            <ManageSubscription isPremium={isPremium} />
          ) : (
            <Link
              href="/play/career-path-pro"
              className="inline-flex items-center text-xs font-semibold text-pitch-green hover:text-pitch-green/80 transition-colors"
              data-testid="account-upgrade-cta"
            >
              See Football IQ Pro →
            </Link>
          )}
        </section>

        <section className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Profile
          </span>
          <dl className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Total IQ</dt>
              <dd className="font-semibold">{profile?.total_iq ?? 0}</dd>
            </div>
            {memberSince ? (
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Member since</dt>
                <dd className="font-semibold">{memberSince}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="space-y-3">
          <SignOutButton />
          <div className="pt-2 text-center">
            <DeleteAccountButton />
          </div>
        </section>
      </main>
    </div>
  );
}
