import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Football IQ",
  description: "Terms of Service for the Football IQ mobile application",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="font-bebas text-4xl sm:text-5xl tracking-wide text-floodlight uppercase">
            Terms of Service
          </h1>
          <div className="w-24 h-1 bg-pitch-green mt-2" />
          <p className="mt-4 text-slate-400 text-sm">Last Updated: January 2025</p>
        </header>

        {/* Content */}
        <article className="space-y-10">
          <Section title="Acceptance of Terms">
            <p>
              By downloading, installing, or using Football IQ (&quot;the
              App&quot;), you agree to be bound by these Terms of Service. If you
              do not agree to these terms, please do not use the App.
            </p>
          </Section>

          <Section title="Use of Service">
            <p>
              Football IQ is provided for entertainment and educational purposes.
              By using the App, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-slate-300">
              <li>Use the App lawfully and in accordance with these terms</li>
              <li>
                Not attempt to manipulate scores, leaderboards, or game outcomes
              </li>
              <li>Not reverse engineer, decompile, or disassemble the App</li>
              <li>
                Not use automated systems or bots to interact with the App
              </li>
              <li>
                Not exploit bugs or glitches for unfair advantage (please report
                them to us instead)
              </li>
            </ul>
          </Section>

          <Section title="User Accounts">
            <p>
              You are responsible for maintaining the security of your account and
              any credentials associated with it. Football IQ uses anonymous
              device identifiers by default, but if you create an account or link
              additional services, you are responsible for keeping that
              information secure.
            </p>
            <p className="mt-4">
              You may delete your account and all associated data at any time
              through the Settings screen in the App.
            </p>
          </Section>

          <Section title="Intellectual Property">
            <p>
              All content within Football IQ, including but not limited to game
              mechanics, puzzles, questions, graphics, logos, and user interface
              design, is owned by Football IQ or its licensors and is protected
              by intellectual property laws.
            </p>
            <p className="mt-4">
              You may not copy, modify, distribute, or create derivative works
              based on any content from the App without prior written permission.
            </p>
          </Section>

          <Section title="In-App Purchases & Subscriptions">
            <p>
              Football IQ offers optional in-app purchases and subscriptions
              (Football IQ Pro). By making a purchase, you agree to the pricing
              and payment terms presented at the time of purchase.
            </p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-slate-300">
              <li>
                <strong className="text-floodlight">Subscriptions</strong> —
                Automatically renew unless cancelled at least 24 hours before the
                end of the current period.
              </li>
              <li>
                <strong className="text-floodlight">Refunds</strong> — Managed by
                Apple (App Store) or Google (Play Store) according to their
                respective policies.
              </li>
              <li>
                <strong className="text-floodlight">Restore Purchases</strong> —
                You can restore previous purchases through the Settings screen.
              </li>
            </ul>
          </Section>

          <Section title="Disclaimers">
            <p>
              The App is provided &quot;as is&quot; and &quot;as available&quot;
              without warranties of any kind, either express or implied. We do not
              guarantee that the App will be uninterrupted, error-free, or free of
              harmful components.
            </p>
            <p className="mt-4">
              Football trivia content is provided for entertainment purposes.
              While we strive for accuracy, we do not guarantee that all
              information is complete or error-free.
            </p>
          </Section>

          <Section title="Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Football IQ and its
              developers shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of
              the App.
            </p>
            <p className="mt-4">
              Our total liability for any claims arising from your use of the App
              shall not exceed the amount you paid for the App or any in-app
              purchases in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="Changes to Terms">
            <p>
              We may update these Terms of Service from time to time. We will
              notify you of significant changes by updating the &quot;Last
              Updated&quot; date at the top of this page.
            </p>
            <p className="mt-4">
              Your continued use of the App after changes are posted constitutes
              your acceptance of the revised terms.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              If you have questions about these Terms of Service, please contact
              us at:
            </p>
            <p className="mt-4">
              <a
                href="mailto:support@football-iq.app"
                className="text-pitch-green hover:underline transition-colors"
              >
                support@football-iq.app
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
