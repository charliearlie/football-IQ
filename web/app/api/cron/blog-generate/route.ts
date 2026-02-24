/**
 * CRON route for daily blog article generation.
 *
 * Stage 1 of the blog pipeline:
 *   1. Fetch yesterday's football data from API-Football
 *   2. Research with gpt-4o-search-preview
 *   3. Generate article with gpt-5.2
 *   4. Save to Supabase with status 'reviewing'
 *   5. Trigger the review pipeline (stage 2)
 *
 * Runs daily at 10:00 UTC (morning after — covers yesterday's matches).
 * Configure in vercel.json:
 *   { "path": "/api/cron/blog-generate", "schedule": "0 10 * * *" }
 *
 * Protected by CRON_SECRET bearer token to prevent unauthorized invocation.
 *
 * maxDuration is set to 300 seconds. The pipeline makes multiple API calls
 * (API-Football + OpenAI research + generation + 3 review passes).
 */

import { NextRequest } from "next/server";
import { generateDailyArticle } from "@/lib/blog/article-generator";
import { reviewArticle } from "@/lib/blog/article-reviewer";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Validate CRON_SECRET — same pattern as og-images cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Compute both dates:
  //   matchDate = yesterday (the football being covered)
  //   articleDate = today (publication date, slug, "On This Day")
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const defaultMatchDate = yesterday.toISOString().split("T")[0];
  const defaultArticleDate = now.toISOString().split("T")[0];

  // Allow match date override via query param for backfills and testing
  // When overriding, article date = match date + 1 day
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const matchDate = dateParam ?? defaultMatchDate;
  const articleDate = dateParam
    ? new Date(new Date(dateParam).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : defaultArticleDate;

  console.log(`[blog-generate] Starting pipeline — matches: ${matchDate}, article: ${articleDate}`);

  // Stage 1: Generate the article
  const generationResult = await generateDailyArticle(matchDate, articleDate);

  if (!generationResult.success || !generationResult.articleId) {
    console.error(
      "[blog-generate] Generation failed:",
      generationResult.error
    );

    return Response.json(
      {
        matchDate,
        articleDate,
        stage: "generate",
        success: false,
        error: generationResult.error ?? "Generation failed with no error message",
      },
      { status: 500 }
    );
  }

  const { articleId } = generationResult;
  console.log(
    `[blog-generate] Article generated: ${articleId}. Starting review pipeline.`
  );

  // Stage 2: Run the review pipeline immediately after generation
  // This keeps both stages in a single cron invocation for simplicity.
  // If the review needs to be separated (e.g. for longer timeouts),
  // use the blog-review cron route independently with the articleId.
  const reviewResult = await reviewArticle(articleId);

  if (!reviewResult.success) {
    console.error("[blog-generate] Review pipeline failed:", reviewResult.error);

    // Article was generated successfully — return partial success.
    // The article exists in Supabase with status 'reviewing' and can be
    // reviewed manually or via the blog-review endpoint.
    return Response.json(
      {
        matchDate,
        articleDate,
        stage: "review",
        success: false,
        articleId,
        generationSucceeded: true,
        error: reviewResult.error ?? "Review failed — article exists but needs manual review",
      },
      { status: 500 }
    );
  }

  const { review } = reviewResult;

  console.log(
    `[blog-generate] Pipeline complete — matches: ${matchDate}, article: ${articleDate}. Article ${articleId} is pending_review. Overall: ${review?.overallPassed ? "PASSED" : "NEEDS ATTENTION"}`
  );

  return Response.json({
    matchDate,
    articleDate,
    success: true,
    articleId,
    review: {
      overallPassed: review?.overallPassed,
      totalIssues: review?.totalIssues,
      factual: {
        passed: review?.factual.passed,
        issueCount: review?.factual.issues.length,
        confidence: review?.factual.confidence,
      },
      quality: {
        passed: review?.quality.passed,
        issueCount: review?.quality.issues.length,
        confidence: review?.quality.confidence,
      },
      sensitivity: {
        passed: review?.sensitivity.passed,
        issueCount: review?.sensitivity.issues.length,
        confidence: review?.sensitivity.confidence,
      },
    },
  });
}
