import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BlogArticleSummary } from "@/lib/blog/types";

const BASE_URL = "https://www.football-iq.app";

export const revalidate = 3600;

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS 2.0 feed for the Football IQ blog.
 * Pulls latest 50 published articles. Used by news aggregators, syndication
 * partners and as a low-friction backlink mechanism.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("blog_articles")
    .select("slug, title, excerpt, article_date, published_at, meta_description")
    .eq("status", "published")
    .order("article_date", { ascending: false })
    .limit(50)
    .returns<
      Pick<
        BlogArticleSummary,
        "slug" | "title" | "excerpt" | "article_date" | "published_at" | "meta_description"
      >[]
    >();

  const items = (articles ?? [])
    .map((article) => {
      const link = `${BASE_URL}/blog/${article.slug}`;
      const description = article.excerpt ?? article.meta_description ?? "";
      const pubDate = new Date(
        article.published_at ?? `${article.article_date}T08:00:00Z`,
      ).toUTCString();
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuildDate = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Football IQ Daily Digest</title>
    <link>${BASE_URL}/blog</link>
    <description>Daily football match analysis, transfer news, tactical breakdowns, and trivia from the Football IQ team.</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
