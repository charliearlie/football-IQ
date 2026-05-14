import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClaimRunner } from "@/components/account/ClaimRunner";

export const metadata: Metadata = {
  title: "Claim your Football IQ Pro subscription",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ anon?: string }>;
}

/**
 * Lands the user after they click the post-purchase magic link. The actual
 * RC merge + Supabase mirror flip happens client-side (the SDK lives in the
 * browser); this server component just enforces that they're signed in and
 * passes the anonymous RC ID through to the client runner.
 */
export default async function ClaimPage({ searchParams }: PageProps) {
  const { anon } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    redirect("/account/sign-in?next=/account/claim");
  }

  return (
    <div className="min-h-screen bg-stadium-navy text-floodlight flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-pitch-green">
          Football IQ Pro
        </p>
        <h1 className="font-bebas text-3xl tracking-wider">
          Claiming your subscription…
        </h1>
        <ClaimRunner anonRcId={anon ?? null} userId={user.id} />
      </div>
    </div>
  );
}
