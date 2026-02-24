-- Migration 040: Create blog_articles table
--
-- Stores AI-generated daily football articles that go through a
-- multi-step review pipeline (factual, quality, sensitivity) before
-- being published. One article per calendar day (UNIQUE on article_date).
--
-- Access model:
--   - Public: SELECT where status = 'published' (anonymous-safe)
--   - Service role: unrestricted (cron jobs + admin actions use createAdminClient)
--     Admin identity is verified at the application layer via ensureAdmin().

CREATE TABLE IF NOT EXISTS blog_articles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  slug              TEXT        UNIQUE NOT NULL,
  title             TEXT        NOT NULL,
  subtitle          TEXT,

  -- Body
  content           TEXT        NOT NULL,   -- Markdown body
  excerpt           TEXT,                   -- 1-2 sentence summary for cards / meta

  -- Scheduling
  article_date      DATE        UNIQUE NOT NULL, -- Enforces one article per day

  -- Pipeline status
  -- Lifecycle: generating -> draft -> reviewing -> pending_review -> published
  -- Failures:  any stage -> rejected
  status            TEXT        NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'draft', 'reviewing', 'pending_review', 'published', 'rejected')),

  -- Raw data used during generation (kept for auditability / reprocessing)
  raw_match_data    JSONB,    -- API-Football responses
  research_data     JSONB,    -- Web-search context used by the writing agent

  -- Review results
  -- Each object shape: { passed: boolean, issues: string[], confidence: number }
  review_factual      JSONB,
  review_quality      JSONB,
  review_sensitivity  JSONB,

  -- Generation metadata
  generation_model  TEXT        DEFAULT 'gpt-4o',

  -- Publication
  published_at      TIMESTAMPTZ,
  published_by      UUID        REFERENCES auth.users(id),

  -- SEO / Open Graph
  meta_title        TEXT,
  meta_description  TEXT,
  og_image_url      TEXT,

  -- Housekeeping
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: primary access pattern — fetch latest articles in date order
CREATE INDEX IF NOT EXISTS idx_blog_articles_date   ON blog_articles (article_date DESC);

-- Index: pipeline queries filter by status
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles (status);

-- Index: slug lookups for article detail pages
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug   ON blog_articles (slug);

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Default deny: no other policy = no access.

-- Allow anyone (including anonymous visitors) to read published articles.
-- This is the only public-facing policy; drafts and in-pipeline articles
-- are never exposed to the web client.
CREATE POLICY blog_articles_select_public
  ON blog_articles
  FOR SELECT
  USING (status = 'published');

-- The service role bypasses RLS entirely in Supabase by default, but we
-- create an explicit ALL policy scoped to the service_role so that if RLS
-- checks are ever enabled in tests, the service role retains full access.
-- Application-level admin verification is handled by ensureAdmin() in
-- web/lib/supabase/server.ts.
CREATE POLICY blog_articles_all_service_role
  ON blog_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
