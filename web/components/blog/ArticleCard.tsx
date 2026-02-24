import Link from "next/link";
import { format, parseISO } from "date-fns";

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    excerpt: string | null;
    article_date: string;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = format(parseISO(article.article_date), "d MMMM yyyy");

  return (
    <Link href={`/blog/${article.slug}`} className="group block">
      <article className="bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl p-6 transition-all duration-200 group-hover:border-pitch-green/30 group-hover:bg-white/[0.07]">
        <time
          dateTime={article.article_date}
          className="text-xs text-slate-500 uppercase tracking-wider"
        >
          {formattedDate}
        </time>

        <h2 className="font-bebas text-2xl text-floodlight tracking-wide mt-2 mb-3 leading-tight group-hover:text-pitch-green transition-colors duration-150">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-4">
            {article.excerpt}
          </p>
        )}

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-pitch-green group-hover:gap-2.5 transition-all duration-150">
          Read more
          <svg
            className="w-3.5 h-3.5"
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
        </span>
      </article>
    </Link>
  );
}
