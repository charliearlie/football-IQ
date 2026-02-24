# Blog System — Development Plan

See full plan at: `.claude/plans/cozy-plotting-frog.md`

## Summary

Automated daily football blog for SEO. Vercel cron at 23:30 UTC triggers a two-stage pipeline:
1. Fetch match results from API-Football + research via AI web search
2. Generate article with GPT-4o in journalist style
3. Run 3 AI review passes (factual, quality, sensitivity)
4. Hold as draft for admin approval
5. Once published, auto-update sitemap

## Status

- [ ] Database migration (blog_articles table)
- [ ] AI pipeline (API-Football client, article generator, reviewer, prompts)
- [ ] Cron endpoints (blog-generate, blog-review)
- [ ] Blog frontend (index page, article page, markdown renderer, ads)
- [ ] Admin dashboard (list, preview, approve/reject/edit)
- [ ] SEO (dynamic sitemap, JSON-LD, meta tags)
- [ ] Vercel cron config
- [ ] Footer/sidebar navigation updates
