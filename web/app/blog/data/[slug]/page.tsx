import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HeroStrip } from "@/components/landing/HeroStrip";
import { Footer } from "@/components/landing/Footer";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { ArticleRenderer } from "@/components/blog/ArticleRenderer";
import { getReadingTime } from "@/lib/blog/markdown";
import type { BlogArticleRow } from "@/lib/blog/types";
import { WEB_PLAYABLE_GAMES } from "@/lib/constants";

export const revalidate = 3600;

type ArticleDetail = Pick<
  BlogArticleRow,
  | "id"
  | "slug"
  | "title"
  | "subtitle"
  | "excerpt"
  | "content"
  | "article_date"
  | "meta_title"
  | "meta_description"
  | "published_at"
  | "og_image_url"
>;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string): Promise<ArticleDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .select(
      "id, slug, title, subtitle, excerpt, content, article_date, meta_title, meta_description, published_at, og_image_url"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()
    .returns<ArticleDetail>();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  const title = article.meta_title ?? article.title;
  const description =
    article.meta_description ?? article.excerpt ?? undefined;
  const url = `https://www.football-iq.app/blog/data/${article.slug}`;
  const ogImageUrl =
    article.og_image_url ??
    `https://www.football-iq.app/api/og/blog/${article.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large" as const,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: article.published_at ?? undefined,
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
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// --- Inline StatCard component ---
// Displays a single stat highlight: a large number/value and a supporting label.
// Used to visualise data-journalism statistics inline within articles.

interface StatCardProps {
  /** The main figure to display, e.g. "73%", "1,247", "4.2x" */
  stat: string;
  /** A short label explaining what the stat represents */
  label: string;
  /** Optional source or context note shown beneath the label */
  source?: string;
}

function StatCard({ stat, label, source }: StatCardProps) {
  return (
    <div className="my-6 p-5 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5">
      <p
        className="font-bebas text-5xl tracking-wide text-emerald-400 leading-none mb-2"
        aria-label={`${stat} — ${label}`}
      >
        {stat}
      </p>
      <p className="text-sm font-medium text-slate-200 leading-snug">{label}</p>
      {source && (
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">{source}</p>
      )}
    </div>
  );
}

// --- StatCardGrid component ---
// Renders multiple StatCards in a responsive grid layout.

interface StatCardGridProps {
  stats: StatCardProps[];
}

function StatCardGrid({ stats }: StatCardGridProps) {
  return (
    <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((s, i) => (
        <StatCard key={i} {...s} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DataArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const readTime = getReadingTime(article.content ?? "");

  // Derive example stat highlights from the article excerpt / meta.
  // In practice these would be stored alongside the article in the database.
  // This template renders a placeholder set so the layout is always populated.
  const exampleStats: StatCardProps[] = [
    {
      stat: "—",
      label: "Key stat for this article",
      source: "Source data shown here",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: article.title,
        image: [
          article.og_image_url ??
            `https://www.football-iq.app/api/og/blog/${article.slug}`,
        ],
        datePublished: article.published_at,
        dateModified: article.published_at,
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
        mainEntityOfPage: `https://www.football-iq.app/blog/data/${article.slug}`,
        description:
          article.meta_description ?? article.excerpt ?? article.title,
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
            name: "Daily Digest",
            item: "https://www.football-iq.app/blog",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Data & Analysis",
            item: "https://www.football-iq.app/blog/data",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: article.title,
            item: `https://www.football-iq.app/blog/data/${article.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      {/* AdSense script */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9426782115883407"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroStrip />

      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb navigation */}
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
                href="/blog"
                className="hover:text-floodlight transition-colors"
              >
                Daily Digest
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">
              /
            </li>
            <li className="hover:text-floodlight transition-colors">
              <Link href="/blog/data">Data &amp; Analysis</Link>
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

        {/* "Data & Analysis" label */}
        <div className="mb-4">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Data &amp; Analysis
          </span>
        </div>

        <BlogHeader
          title={article.title}
          subtitle={article.subtitle}
          date={article.article_date}
          readTime={readTime}
        />

        {/* Stat visualisation panel — rendered before the article body */}
        {exampleStats.length > 0 && exampleStats[0].stat !== "—" && (
          <StatCardGrid stats={exampleStats} />
        )}

        {article.content ? (
          <ArticleRenderer content={article.content} />
        ) : (
          <p className="text-slate-400">Content unavailable.</p>
        )}

        {/* App download CTA */}
        <aside className="mt-12 p-6 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
            Put Your Knowledge to the Test
          </p>
          <p className="text-lg font-semibold text-floodlight mb-1">
            Football IQ — Daily Football Trivia
          </p>
          <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">
            Career Path, Transfer Guess, Connections and more — free daily
            puzzles for every type of football fan.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/play"
              className="inline-block px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Play Free Now
            </Link>
          </div>
        </aside>

        {/* Internal links to game modes */}
        <aside className="mt-8 pt-8 border-t border-white/5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            More Football Games
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WEB_PLAYABLE_GAMES.map((game) => (
              <Link
                key={game.slug}
                href={`/play/${game.slug}`}
                className="flex flex-col gap-1 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all group"
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: game.accentColor }}
                >
                  {game.title}
                </span>
                <span className="text-xs text-slate-500 leading-snug group-hover:text-slate-400 transition-colors">
                  Play free &rarr;
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </article>

      <Footer />
    </main>
  );
}

// Re-export the StatCard components so they can be used by future server-side
// article templates that compose this page's layout.
export { StatCard, StatCardGrid };
export type { StatCardProps };
