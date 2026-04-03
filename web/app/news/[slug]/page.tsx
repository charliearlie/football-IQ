import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HeroStrip } from "@/components/landing/HeroStrip";
import { Footer } from "@/components/landing/Footer";
import {
  appStoreUrl,
  PLAY_STORE_URL,
  WEB_PLAYABLE_GAMES,
  APP_ONLY_GAMES,
} from "@/lib/constants";

interface NewsArticle {
  title: string;
  description: string;
  date: string;
  content: React.ReactNode;
}

const NEWS_ARTICLES: Record<string, NewsArticle> = {
  "football-iq-now-available-worldwide": {
    title: "Football IQ Is Now Available Worldwide",
    description:
      "After launching in the UK and US, Football IQ is now available to download on the App Store and Google Play in every country.",
    date: "2026-03-15",
    content: (
      <>
        <p className="text-slate-300 leading-relaxed mb-4">
          Football IQ is now available to download worldwide on the{" "}
          <a
            href={appStoreUrl('web_news')}
            className="text-pitch-green hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            App Store
          </a>{" "}
          and{" "}
          <a
            href={PLAY_STORE_URL}
            className="text-pitch-green hover:underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Play
          </a>
          . After an initial launch in the UK and US, the app is now available
          in every country on both platforms.
        </p>

        <h2 className="font-bebas text-3xl text-floodlight tracking-wide mt-10 mb-4">
          What Is Football IQ?
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Football IQ is a daily football quiz app with 12 different game modes.
          Every day, new puzzles drop across every mode — testing your knowledge
          of players, transfers, tactics, and football history.
        </p>
        <p className="text-slate-300 leading-relaxed mb-4">
          As you play, you earn XP and climb through 10 tiers — from{" "}
          <strong className="text-floodlight font-semibold">Intern</strong> all
          the way to{" "}
          <strong className="text-floodlight font-semibold">The Gaffer</strong>.
          Your tier reflects how deep your football knowledge really goes.
        </p>

        <h2 className="font-bebas text-3xl text-floodlight tracking-wide mt-10 mb-4">
          12 Game Modes
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Football IQ isn&apos;t just one quiz — it&apos;s 12 completely
          different ways to test your football knowledge:
        </p>
        <ul className="text-slate-300 space-y-2 mb-4 ml-6 list-disc">
          {[
            ...WEB_PLAYABLE_GAMES.map((g) => ({
              title: g.title,
              description: g.description,
            })),
            ...APP_ONLY_GAMES,
          ].map((mode) => (
            <li key={mode.title} className="leading-relaxed">
              <strong className="text-floodlight font-semibold">
                {mode.title}
              </strong>{" "}
              — {mode.description}
            </li>
          ))}
        </ul>

        <h2 className="font-bebas text-3xl text-floodlight tracking-wide mt-10 mb-4">
          Play on the Web
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Don&apos;t want to download the app? Five game modes are playable
          directly in your browser at{" "}
          <Link
            href="/play"
            className="text-pitch-green hover:underline underline-offset-2"
          >
            football-iq.app
          </Link>
          :
        </p>
        <ul className="text-slate-300 space-y-2 mb-4 ml-6 list-disc">
          {WEB_PLAYABLE_GAMES.map((game) => (
            <li key={game.slug} className="leading-relaxed">
              <Link
                href={`/play/${game.slug}`}
                className="text-pitch-green hover:underline underline-offset-2"
              >
                {game.title}
              </Link>{" "}
              — {game.description}
            </li>
          ))}
        </ul>

        <h2 className="font-bebas text-3xl text-floodlight tracking-wide mt-10 mb-4">
          Download Football IQ
        </h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          Football IQ is free to download. Available now on iOS and Android:
        </p>
        <div className="flex flex-wrap gap-4 mt-4">
          <a
            href={appStoreUrl('web_news')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-5 py-3 text-floodlight font-semibold transition-colors"
          >
            Download on the App Store
          </a>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg px-5 py-3 text-floodlight font-semibold transition-colors"
          >
            Get it on Google Play
          </a>
        </div>
      </>
    ),
  },
};

const slugs = Object.keys(NEWS_ARTICLES);

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = NEWS_ARTICLES[slug];

  if (!article) {
    return { title: "Article Not Found" };
  }

  const url = `https://www.football-iq.app/news/${slug}`;
  const ogImageUrl = "https://www.football-iq.app/api/og/play";

  return {
    title: `${article.title} | Football IQ`,
    description: article.description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      type: "article",
      publishedTime: article.date,
      authors: ["Football IQ"],
      siteName: "Football IQ",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [ogImageUrl],
    },
  };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = NEWS_ARTICLES[slug];

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        image: ["https://www.football-iq.app/api/og/play"],
        datePublished: article.date,
        dateModified: article.date,
        author: {
          "@type": "Organization",
          name: "Football IQ",
        },
        publisher: {
          "@type": "Organization",
          name: "Football IQ",
          logo: {
            "@type": "ImageObject",
            url: "https://www.football-iq.app/images/favicon.png",
          },
        },
        mainEntityOfPage: `https://www.football-iq.app/news/${slug}`,
        description: article.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Football IQ",
            item: "https://www.football-iq.app",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "News",
            item: "https://www.football-iq.app/news",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: `https://www.football-iq.app/news/${slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroStrip />

      <article className="max-w-3xl mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500">
            <li>
              <Link
                href="/"
                className="hover:text-floodlight transition-colors"
              >
                Football IQ
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">
              /
            </li>
            <li>
              <Link
                href="/news"
                className="hover:text-floodlight transition-colors"
              >
                News
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">
              /
            </li>
            <li
              className="text-slate-400 truncate min-w-0 flex-1"
              aria-current="page"
              title={article.title}
            >
              {article.title}
            </li>
          </ol>
        </nav>

        <header className="mb-8">
          <p className="text-xs text-slate-500 mb-3">
            {new Date(article.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="font-bebas text-4xl md:text-5xl text-floodlight tracking-wide">
            {article.title}
          </h1>
        </header>

        <div className="article-body">{article.content}</div>
      </article>

      <Footer />
    </main>
  );
}
