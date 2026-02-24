import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";
import type { BlogArticleSitemapEntry } from "@/lib/blog/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://football-iq.app";

  // Fetch published blog articles
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("blog_articles")
    .select("slug, published_at")
    .eq("status", "published")
    .order("article_date", { ascending: false })
    .returns<BlogArticleSitemapEntry[]>();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/play`,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/play/career-path`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/transfer-guess`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/connections`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/topical-quiz`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/play/timeline`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // Blog index page
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Individual blog articles
  const articlePages: MetadataRoute.Sitemap = (articles || []).map(
    (article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.published_at
        ? new Date(article.published_at)
        : new Date(),
      changeFrequency: "never" as const,
      priority: 0.7,
    })
  );

  return [...staticPages, ...blogPages, ...articlePages];
}
