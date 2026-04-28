-- Migration: Add tags array to blog_articles
--
-- Enables blog taxonomy: /blog/tag/[tag] index pages, in-article cluster
-- siloing, and the cluster-batched generation pipeline (5-7 articles per
-- pillar per week). Tags are intended to be 2-4 per article, drawn from
-- the canonical pillar set:
--   premier-league, champions-league, world-cup, transfer-news,
--   trivia-questions, football-history, connections, career-path,
--   transfers, listicle, deep-dive, data-insight, mode-spotlight, seasonal
--
-- Pre-existing rows are backfilled with an empty array so SELECTs that
-- expect tags never return NULL. Index uses GIN for efficient tag-filter
-- queries on the /blog/tag/[tag] route.

ALTER TABLE blog_articles
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX IF NOT EXISTS idx_blog_articles_tags
  ON blog_articles USING GIN (tags);

-- No RLS changes needed — existing policies apply column-agnostically.
