import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/server";
import { appStoreUrl, GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";
import { HeroStrip } from "@/components/landing/HeroStrip";
import { Footer } from "@/components/landing/Footer";

interface ChallengePageProps {
  params: Promise<{ id: string }>;
}

async function getChallenge(id: string) {
  const supabase = await createAdminClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (!challenge) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", challenge.challenger_id)
    .single();

  return {
    ...challenge,
    challenger_name: profile?.display_name ?? "Someone",
  };
}

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { id } = await params;
  const challenge = await getChallenge(id);

  if (!challenge) {
    return { title: "Challenge Not Found | Football IQ" };
  }

  const modeName = GAME_MODE_DISPLAY_NAMES[challenge.game_mode as GameMode] ?? challenge.game_mode;
  const title = `${challenge.challenger_name} challenged you to ${modeName}!`;
  const description = `Can you beat ${challenge.challenger_score_display ?? `a score of ${challenge.challenger_score}`}? Play now on Football IQ.`;

  return {
    title: `${title} | Football IQ`,
    description,
    openGraph: {
      title,
      description,
      url: `https://football-iq.app/challenge/${id}`,
      type: "website",
      images: [{ url: "/api/og/play", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const challenge = await getChallenge(id);

  if (!challenge) {
    return (
      <main className="min-h-screen bg-stadium-navy text-floodlight flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-bebas text-4xl mb-2">CHALLENGE NOT FOUND</h1>
          <p className="text-slate-400 mb-6">This challenge may have expired or been removed.</p>
          <Link
            href="/"
            className="inline-block bg-pitch-green text-stadium-navy font-semibold px-6 py-3 rounded-lg"
          >
            Play Football IQ
          </Link>
        </div>
      </main>
    );
  }

  const modeName = GAME_MODE_DISPLAY_NAMES[challenge.game_mode as GameMode] ?? challenge.game_mode;

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight">
      <HeroStrip />

      <div className="container mx-auto px-4 max-w-lg py-12">
        {/* Challenge card */}
        <div className="rounded-2xl border-2 border-card-yellow/30 bg-gradient-to-br from-card-yellow/10 via-white/[0.03] to-transparent p-8 text-center">
          {/* Challenger info */}
          <div className="mb-6">
            <p className="text-card-yellow font-bebas text-lg tracking-wider mb-1">
              CHALLENGE FROM
            </p>
            <h1 className="font-bebas text-4xl md:text-5xl text-floodlight tracking-wide">
              {challenge.challenger_name}
            </h1>
          </div>

          {/* Game mode */}
          <div className="mb-6">
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-1">Game Mode</p>
            <p className="font-bebas text-2xl text-pitch-green">{modeName}</p>
          </div>

          {/* Score to beat */}
          <div className="mb-8 py-4 border-y border-white/10">
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Score to Beat</p>
            <p className="font-bebas text-5xl text-card-yellow">
              {challenge.challenger_score_display ?? challenge.challenger_score}
            </p>
            {(challenge.play_count ?? 0) > 0 && (
              <p className="text-slate-500 text-xs mt-2">
                {challenge.play_count} {challenge.play_count === 1 ? "person has" : "people have"} accepted this challenge
              </p>
            )}
          </div>

          {/* CTA — download the app to play */}
          <div className="space-y-4">
            <p className="text-floodlight font-semibold">
              Can you beat {challenge.challenger_name}?
            </p>

            <Link
              href={appStoreUrl("challenge_link")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-all hover:scale-105"
            >
              <Image
                src="/images/app-store.svg"
                alt="Download on the App Store"
                width={160}
                height={48}
                className="h-[48px] w-auto mx-auto"
              />
            </Link>

            <p className="text-slate-500 text-xs">
              Download Football IQ free to accept the challenge
            </p>
          </div>
        </div>

        {/* What is Football IQ? */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm mb-4">
            Football IQ is a daily football trivia app with 13 game modes.
            Test your knowledge, build streaks, and climb from Intern to The Gaffer.
          </p>
          <Link
            href="/play"
            className="text-pitch-green text-sm font-semibold hover:underline"
          >
            Or play free in your browser →
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
