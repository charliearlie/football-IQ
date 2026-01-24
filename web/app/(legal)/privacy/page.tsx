import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Football IQ",
  description: "Privacy Policy for the Football IQ mobile application",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-bebas text-4xl sm:text-5xl tracking-wide text-floodlight uppercase">
            Privacy Policy
          </h1>
          <div className="w-24 h-1 bg-pitch-green mt-2" />
          <p className="mt-4 text-slate-400 text-sm">
            Last Updated: January 2025
          </p>
        </header>

        {/* Content */}
        <article className="space-y-10">
          <Section title="Introduction">
            <p>
              Football IQ (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
              is committed to protecting your tactical data and user privacy.
              This Privacy Policy explains how we collect, use, and safeguard
              your information when you use our mobile application.
            </p>
          </Section>

          <Section title="Data We Collect">
            <p>We collect minimal data necessary to provide our services:</p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-slate-300">
              <li>
                <strong className="text-floodlight">Display Name</strong> — Used
                for leaderboards and personalization. You can change this at any
                time in your settings.
              </li>
              <li>
                <strong className="text-floodlight">Device Identifier</strong> —
                An anonymous identifier used to track your game progress and
                daily streaks across sessions.
              </li>
            </ul>
          </Section>

          <Section title="Third-Party Services">
            <p>
              We use trusted third-party services to improve the app experience:
            </p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-slate-300">
              <li>
                <strong className="text-floodlight">Sentry</strong> — For crash
                monitoring and performance tracking. This helps us identify and
                fix bugs quickly to ensure a smooth experience.
              </li>
              <li>
                <strong className="text-floodlight">Supabase</strong> — For
                secure data storage and authentication services. Your data is
                stored securely using industry-standard encryption.
              </li>
              <li>
                <strong className="text-floodlight">PostHog</strong> — For
                product analytics to understand how the app is used and improve
                the user experience. This includes anonymous usage data and
                feature interactions. See{" "}
                <a
                  href="https://posthog.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pitch-green hover:underline"
                >
                  PostHog&apos;s Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong className="text-floodlight">Google AdMob</strong> — For
                displaying banner and rewarded advertisements. AdMob may collect
                device identifiers and ad interaction data. On iOS, you will be
                prompted via App Tracking Transparency to allow personalized
                ads; you can opt out for non-personalized ads. See{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pitch-green hover:underline"
                >
                  Google&apos;s Privacy Policy
                </a>
                .
              </li>
            </ul>
          </Section>

          <Section title="Data Retention & Deletion">
            <p>
              Your data is retained as long as you use the app. You can delete
              your account and all associated data at any time through the{" "}
              <strong className="text-floodlight">Settings</strong> screen in
              the app using the{" "}
              <strong className="text-floodlight">Delete Account</strong>{" "}
              option.
            </p>
            <p className="mt-4">
              This action is irreversible and will permanently remove your game
              progress, streaks, and leaderboard entries from our databases.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              If you have questions about this Privacy Policy or your data,
              please contact us at:
            </p>
            <p className="mt-4">
              <a
                href="mailto:privacy@football-iq.app"
                className="text-pitch-green hover:underline transition-colors"
              >
                privacy@football-iq.app
              </a>
            </p>
          </Section>
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-pitch-green transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </footer>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-bebas text-2xl tracking-wide text-floodlight uppercase mb-4">
        {title}
      </h2>
      <div className="text-slate-300 leading-relaxed space-y-4">{children}</div>
    </section>
  );
}
