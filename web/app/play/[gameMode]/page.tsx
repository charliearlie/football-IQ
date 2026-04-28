import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { GAME_MODE_SEO } from "@/lib/seoData";
import { WEB_PLAYABLE_GAMES, appStoreUrl } from "@/lib/constants";

const BASE_URL = "https://www.football-iq.app";

/**
 * Dynamic SEO landing page for app-only game modes.
 *
 * Static routes (web/app/play/career-path/page.tsx etc.) take priority for
 * the 5 web-playable modes. This dynamic route only fires for slugs without
 * a matching static folder — i.e. the 9 app-only modes registered in
 * GAME_MODE_SEO (higher-lower, starting-xi, who-am-i, the-grid, the-chain,
 * threads, goalscorer-recall, top-tens, whos-that).
 *
 * For app-only modes the page acts as a proper SEO landing — full keyword
 * targeting, FAQ + SoftwareApplication + BreadcrumbList JSON-LD, and an
 * App Store CTA in place of a Play Now link.
 */

interface PageProps {
  params: Promise<{ gameMode: string }>;
}

const WEB_PLAYABLE_SLUGS = new Set(WEB_PLAYABLE_GAMES.map((g) => g.slug));

export function generateStaticParams() {
  return Object.keys(GAME_MODE_SEO)
    .filter((slug) => !WEB_PLAYABLE_SLUGS.has(slug))
    .map((slug) => ({ gameMode: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameMode } = await params;
  const seo = GAME_MODE_SEO[gameMode];
  if (!seo || WEB_PLAYABLE_SLUGS.has(gameMode)) return {};

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: seo.keywords.join(", "),
    alternates: {
      canonical: `${BASE_URL}/play/${seo.slug}`,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: `${BASE_URL}/play/${seo.slug}`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og/play/${seo.slug}`,
          width: 1200,
          height: 630,
          alt: `Football IQ - ${seo.title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: [`${BASE_URL}/api/og/play/${seo.slug}`],
    },
  };
}

export default async function AppOnlyGameModePage({ params }: PageProps) {
  const { gameMode } = await params;
  const seo = GAME_MODE_SEO[gameMode];

  // Static routes own playable modes — bail out so Next.js falls through to 404.
  if (!seo || WEB_PLAYABLE_SLUGS.has(gameMode)) notFound();

  const otherAppOnly = Object.values(GAME_MODE_SEO)
    .filter((s) => !WEB_PLAYABLE_SLUGS.has(s.slug) && s.slug !== gameMode)
    .slice(0, 4);

  const playableGames = WEB_PLAYABLE_GAMES.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: seo.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Football IQ", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Play", item: `${BASE_URL}/play` },
          { "@type": "ListItem", position: 3, name: seo.title, item: `${BASE_URL}/play/${seo.slug}` },
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: `Football IQ - ${seo.title}`,
        applicationCategory: "GameApplication",
        operatingSystem: "iOS, Android",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "120",
        },
        url: `${BASE_URL}/play/${seo.slug}`,
        description: seo.heroDescription,
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="min-h-screen bg-stadium-navy text-floodlight">
        {/* Nav */}
        <nav className="border-b border-white/5 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-bebas text-xl tracking-wider text-pitch-green">
              Football IQ
            </Link>
            <a
              href={appStoreUrl(`web_play_${seo.slug}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-stadium-navy bg-pitch-green px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Get the App
            </a>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-4 py-12 space-y-16">
          {/* Hero */}
          <section className="text-center space-y-6">
            <div className="inline-block">
              <span
                className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  color: seo.accentColor,
                  backgroundColor: `${seo.accentColor}18`,
                  border: `1px solid ${seo.accentColor}40`,
                }}
              >
                App Exclusive · Free Download
              </span>
            </div>
            <h1 className="font-bebas text-5xl sm:text-7xl tracking-wider leading-none">
              {seo.title}
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed">
              {seo.heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={appStoreUrl(`web_play_${seo.slug}_hero`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-bebas text-2xl tracking-wider text-stadium-navy px-10 py-4 rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: seo.accentColor }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Play {seo.title} in the App
              </a>
            </div>
            <p className="text-slate-500 text-sm">
              Free in the Football IQ app · iOS available now · Android coming soon
            </p>
          </section>

          {/* How to Play */}
          <section className="space-y-6">
            <h2 className="font-bebas text-3xl tracking-wider" style={{ color: seo.accentColor }}>
              How to Play {seo.title}
            </h2>
            <ol className="space-y-4">
              {seo.rules.map((rule, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-stadium-navy"
                    style={{ backgroundColor: seo.accentColor }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-slate-300 leading-relaxed pt-1">{rule}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Why Players Love It */}
          <section className="space-y-6">
            <h2 className="font-bebas text-3xl tracking-wider text-floodlight">Why Players Love It</h2>
            <ul className="space-y-4">
              {seo.whyPlayersLoveIt.map((point, i) => (
                <li
                  key={i}
                  className="flex gap-3 items-start p-4 rounded-lg border border-white/5 bg-white/[0.02]"
                >
                  <span
                    className="mt-0.5 flex-shrink-0 text-lg leading-none"
                    style={{ color: seo.accentColor }}
                  >
                    ✓
                  </span>
                  <p className="text-slate-300 leading-relaxed">{point}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Try in the browser */}
          <section className="rounded-xl border border-pitch-green/20 bg-pitch-green/5 p-6 space-y-4">
            <h2 className="font-bebas text-2xl tracking-wider text-pitch-green">
              Want to play right now?
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              {seo.title} is exclusive to the Football IQ app, but five other modes are
              available free in your browser. No download, no account.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {playableGames.map((game) => (
                <Link
                  key={game.slug}
                  href={`/play/${game.slug}`}
                  className="group flex flex-col gap-1 p-3 rounded-lg border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] transition-all"
                >
                  <span className="text-sm font-semibold" style={{ color: game.accentColor }}>
                    {game.title}
                  </span>
                  <span className="text-xs text-slate-500 leading-snug">{game.description}</span>
                  <span className="text-xs text-slate-600 group-hover:text-slate-400 mt-1">
                    Play in browser →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-6">
            <h2 className="font-bebas text-3xl tracking-wider text-floodlight">
              Frequently Asked Questions
            </h2>
            <dl className="space-y-6">
              {seo.faqs.map((faq, i) => (
                <div key={i} className="border border-white/5 rounded-lg p-5 space-y-2">
                  <dt className="font-semibold text-floodlight">{faq.question}</dt>
                  <dd className="text-slate-400 leading-relaxed text-sm">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Other app-only modes */}
          {otherAppOnly.length > 0 && (
            <section className="space-y-6">
              <h2 className="font-bebas text-3xl tracking-wider text-floodlight">
                More App-Only Modes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherAppOnly.map((mode) => (
                  <Link
                    key={mode.slug}
                    href={`/play/${mode.slug}`}
                    className="group flex flex-col gap-1 p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
                  >
                    <span className="text-sm font-semibold" style={{ color: mode.accentColor }}>
                      {mode.title}
                    </span>
                    <span className="text-slate-400 text-sm leading-snug">
                      {mode.heroDescription.split(".")[0]}.
                    </span>
                    <span className="text-xs text-slate-600 group-hover:text-slate-500 mt-1">
                      Learn more →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Final App CTA */}
          <section className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center space-y-4">
            <h2 className="font-bebas text-3xl tracking-wider text-floodlight">
              Get All 11 Modes
            </h2>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              The Football IQ app unlocks {seo.title} plus 10 other modes, the full
              puzzle archive, streak tracking, achievements, and weekly tournaments.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href={appStoreUrl(`web_play_${seo.slug}_footer`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-floodlight text-stadium-navy font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Download on App Store
              </a>
            </div>
            <p className="text-slate-600 text-xs">Free to download · iOS · Android coming soon</p>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 mt-12">
          <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-bebas text-lg tracking-wider text-pitch-green">Football IQ</span>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link href="/play" className="hover:text-slate-400 transition-colors">
                All Games
              </Link>
              <Link href="/blog" className="hover:text-slate-400 transition-colors">
                Blog
              </Link>
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-slate-400 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
