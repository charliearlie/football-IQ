import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { HeroStrip } from "@/components/landing/HeroStrip";
import { Footer } from "@/components/landing/Footer";
import { ArticleCard } from "@/components/blog/ArticleCard";
import type { BlogArticleSummary } from "@/lib/blog/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Daily Football Digest | Football News & Match Analysis | Football IQ",
  description:
    "Daily football match analysis, transfer news, and tactical breakdowns. Updated every night.",
  alternates: {
    canonical: "https://football-iq.app/blog",
  },
  openGraph: {
    title: "Daily Football Digest | Football IQ",
    description:
      "Daily football match analysis, transfer news, and tactical breakdowns. Updated every night.",
    url: "https://football-iq.app/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Football Digest | Football IQ",
    description:
      "Daily football match analysis, transfer news, and tactical breakdowns. Updated every night.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function BlogIndexPage() {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
    .from("blog_articles")
    .select(
      "id, slug, title, subtitle, excerpt, article_date, meta_title, meta_description, published_at, og_image_url"
    )
    .eq("status", "published")
    .order("article_date", { ascending: false })
    .limit(24)
    .returns<BlogArticleSummary[]>();

  if (error) {
    console.error("Failed to fetch blog articles:", error.message);
  }

  const publishedArticles = articles ?? [];

  return (
    <main className="min-h-screen bg-stadium-navy text-floodlight selection:bg-pitch-green selection:text-white">
      <HeroStrip />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="font-bebas text-5xl text-floodlight tracking-wide mb-2">
            DAILY DIGEST
          </h1>
          <p className="text-slate-400">
            Football coverage, every single night.
          </p>
        </div>

        {publishedArticles.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
            <p className="text-slate-400 text-sm">
              No articles published yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {publishedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
