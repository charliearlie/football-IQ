# Blog System — Development Memory

## Architecture Decisions

- **Two-stage pipeline**: Stage 1 (data collection + generation) and Stage 2 (3 AI review passes), triggered by Vercel cron at 23:30 UTC
- **GPT-4o for writing**: Starting with gpt-4o for article generation and reviews. `gpt-4o-search-preview` for web research. Can upgrade to gpt-5.2 later if quality insufficient
- **Markdown storage**: Articles stored as Markdown in Supabase `blog_articles` table. Rendered to React at display time with ad injection between `##` sections
- **Human-in-the-loop**: AI generates + 3 review passes, then held as `pending_review` for admin approval before publishing
- **One article per day**: Single comprehensive daily digest covering the day's football + historical trivia

## Key Files

- Pipeline: `web/lib/blog/` (api-football.ts, article-generator.ts, article-reviewer.ts, prompts.ts)
- Cron: `web/app/api/cron/blog-generate/route.ts`, `web/app/api/cron/blog-review/route.ts`
- Frontend: `web/app/blog/page.tsx`, `web/app/blog/[slug]/page.tsx`
- Admin: `web/app/(dashboard)/admin/blog/`
- Components: `web/components/blog/`, `web/components/admin/blog/`

## API-Football

- League IDs: Premier League (39), La Liga (140), Bundesliga (78), Serie A (135), Ligue 1 (61), Champions League (2), Europa League (3)
- Budget: 100 req/day (free tier). Estimated usage: 15-25/day
- Key env var: `API_FOOTBALL_KEY`

## Patterns Followed

- Supabase client: `createAdminClient()` from `web/lib/supabase/server.ts` for server-side ops
- OpenAI: Direct fetch to `https://api.openai.com/v1/chat/completions` (pattern from oracle.ts)
- Cron auth: `CRON_SECRET` bearer token — **deny by default** (`!cronSecret || authHeader !== ...`)
- Styling: Stadium Navy bg, Pitch Green accents, glass-card class, Bebas Neue headings
- Sidebar nav: Add blog entry to `web/components/layout/sidebar.tsx` navigation array

## Gotchas & Fixes (Post-Review)

- **Cron auth**: Must use `!cronSecret || ...` (deny when unset), NOT `cronSecret && ...` (allow when unset)
- **RLS policy**: `blog_articles_all_service_role` must include `TO service_role` — without it, all authenticated users get unrestricted access
- **`gpt-4o-search-preview`**: Does NOT support `temperature` or `response_format` params — strip them before calling
- **`@supabase/ssr` type inference**: SSR client returns `never` for newly added tables. Workaround: use `.returns<T>()` with explicit types from `web/lib/blog/types.ts`
- **`ReviewResult` type**: Canonical definition in `web/lib/blog/types.ts` — import from there, do not redefine locally
- **`article_date` UNIQUE constraint**: `regenerateArticle` must DELETE the old row before triggering re-generation (INSERT would violate unique)
- **`maxDuration`**: Set to 300s (not 60s) — the full pipeline does 13+ API calls sequentially
- **Ad slot**: `data-ad-slot=""` in `BlogAdSlot.tsx` needs a real AdSense in-article ad unit ID
