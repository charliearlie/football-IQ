/**
 * CRON route for blog article review (Stage 2).
 *
 * Can be invoked two ways:
 *   1. Standalone cron — provide articleId as query param
 *      GET /api/cron/blog-review?articleId=<uuid>
 *   2. Called internally by blog-generate when both stages run together
 *
 * Runs three sequential GPT-4o review passes:
 *   - Factual: cross-references scores/stats against raw match data
 *   - Quality: checks writing quality and journalistic standards
 *   - Sensitivity: checks for controversial or harmful content
 *
 * Sets article status to 'pending_review' when complete.
 * Protected by CRON_SECRET bearer token.
 */

import { NextRequest } from "next/server";
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

  const url = new URL(request.url);
  const articleId = url.searchParams.get("articleId");

  if (!articleId) {
    return Response.json(
      {
        success: false,
        error:
          "Missing required query parameter: articleId. Usage: /api/cron/blog-review?articleId=<uuid>",
      },
      { status: 400 }
    );
  }

  console.log(`[blog-review] Starting review pipeline for article ${articleId}`);

  const result = await reviewArticle(articleId);

  if (!result.success) {
    console.error("[blog-review] Review failed:", result.error);

    return Response.json(
      {
        articleId,
        success: false,
        error: result.error ?? "Review failed with no error message",
      },
      { status: 500 }
    );
  }

  const { review } = result;

  console.log(
    `[blog-review] Complete for article ${articleId}. Overall: ${review?.overallPassed ? "PASSED" : "NEEDS ATTENTION"} (${review?.totalIssues} issues)`
  );

  return Response.json({
    articleId,
    success: true,
    review: {
      overallPassed: review?.overallPassed,
      totalIssues: review?.totalIssues,
      passes: {
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
    },
  });
}

/**
 * POST variant — accepts articleId in the request body.
 * Useful when triggering from another server-side function
 * that prefers to send a JSON body rather than a query param.
 */
export async function POST(request: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let articleId: string | undefined;

  try {
    const body = await request.json() as { articleId?: string };
    articleId = body.articleId;
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!articleId) {
    return Response.json(
      {
        success: false,
        error: "Missing required field in request body: articleId",
      },
      { status: 400 }
    );
  }

  console.log(`[blog-review] POST — Starting review for article ${articleId}`);

  const result = await reviewArticle(articleId);

  if (!result.success) {
    return Response.json(
      {
        articleId,
        success: false,
        error: result.error ?? "Review failed",
      },
      { status: 500 }
    );
  }

  const { review } = result;

  return Response.json({
    articleId,
    success: true,
    review: {
      overallPassed: review?.overallPassed,
      totalIssues: review?.totalIssues,
      passes: {
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
    },
  });
}
