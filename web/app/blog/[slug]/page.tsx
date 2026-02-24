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

export const revalidate = 3600;

type ArticleDetail = Pick<
  BlogArticleRow,
  "id" | "slug" | "title" | "subtitle" | "excerpt" | "content" | "article_date" | "meta_title" | "meta_description" | "published_at" | "og_image_url"
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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
  const url = `https://football-iq.app/blog/${article.slug}`;
  const ogImageUrl =
    article.og_image_url ??
    `https://football-iq.app/api/og/blog/${article.slug}`;

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

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const readTime = getReadingTime(article.content ?? "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: article.title,
        image: [
          article.og_image_url ??
            `https://football-iq.app/api/og/blog/${article.slug}`,
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
            url: "https://football-iq.app/images/favicon.png",
          },
        },
        mainEntityOfPage: `https://football-iq.app/blog/${article.slug}`,
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
            item: "https://football-iq.app",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Daily Digest",
            item: "https://football-iq.app/blog",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: `https://football-iq.app/blog/${article.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      {/* AdSense script — consistent with the rest of the site */}
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
              <Link href="/" className="hover:text-floodlight transition-colors">
                Football IQ
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li>
              <Link href="/blog" className="hover:text-floodlight transition-colors">
                Daily Digest
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li
              className="text-slate-400 truncate min-w-0 flex-1"
              aria-current="page"
              title={article.title}
            >
              {article.title}
            </li>
          </ol>
        </nav>

        <BlogHeader
          title={article.title}
          subtitle={article.subtitle}
          date={article.article_date}
          readTime={readTime}
        />

        {article.content ? (
          <ArticleRenderer content={article.content} />
        ) : (
          <p className="text-slate-400">Content unavailable.</p>
        )}

      </article>

      <Footer />
    </main>
  );
}
