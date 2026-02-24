import Link from "next/link";
import { ArticleCard } from "@/components/blog/ArticleCard";
import type { BlogArticleSummary } from "@/lib/blog/types";

interface LatestDigestProps {
  articles: BlogArticleSummary[];
}

export function LatestDigest({ articles }: LatestDigestProps) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="digest-heading" className="py-8 border-t border-white/10">
      <h2
        id="digest-heading"
        className="font-bebas text-2xl tracking-wider text-floodlight mb-1"
      >
        FOOTBALL NEWS &amp; DAILY DIGEST
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Match analysis, transfer news and tactical breakdowns — published every
        night.
      </p>

      <div className="grid gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-pitch-green hover:text-pitch-green/80 transition-colors mt-6"
      >
        View all football news
        <svg
          className="w-4 h-4"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </section>
  );
}
