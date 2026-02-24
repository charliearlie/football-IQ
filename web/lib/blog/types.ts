/**
 * Blog article types.
 *
 * Defined separately from the Supabase generated types because the
 * @supabase/ssr client sometimes fails to infer table types for
 * newly-added tables. These types mirror the blog_articles Row shape.
 */

export interface BlogArticleRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  article_date: string;
  status: string;
  raw_match_data: unknown;
  research_data: unknown;
  review_factual: unknown;
  review_quality: unknown;
  review_sensitivity: unknown;
  generation_model: string | null;
  published_at: string | null;
  published_by: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Subset used on the blog index page */
export interface BlogArticleSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  article_date: string;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  og_image_url: string | null;
}

/** Subset used in the sitemap */
export interface BlogArticleSitemapEntry {
  slug: string;
  published_at: string | null;
}

/** Review result shape stored as JSONB */
export interface ReviewResult {
  passed: boolean;
  issues: string[];
  confidence: number;
}
