/**
 * Article Review Pipeline
 *
 * Runs three sequential GPT-5.2 review passes on a generated article:
 *   Pass 1: Factual accuracy — cross-references every score and stat against raw match data
 *   Pass 2: Writing quality — checks journalistic standards and engagement
 *   Pass 3: Sensitivity — checks for controversial, biased, or problematic content
 *
 * Each pass updates the corresponding review field in Supabase.
 * Final status is set to 'pending_review' for human editorial sign-off.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import type { DailyFootballData } from "./api-football";
import {
  buildFactualReviewPrompt,
  buildQualityReviewPrompt,
  buildSensitivityReviewPrompt,
  buildRevisionPrompt,
} from "./prompts";
import type { ReviewResult } from "./prompts";

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const REVIEW_MODEL = "gpt-5.2";

// ============================================================================
// TYPES
// ============================================================================

export interface ReviewSummary {
  articleId: string;
  factual: ReviewResult;
  quality: ReviewResult;
  sensitivity: ReviewResult;
  overallPassed: boolean;
  totalIssues: number;
}

export interface ReviewerResult {
  success: boolean;
  review?: ReviewSummary;
  error?: string;
}

type ArticleStatus =
  | "generating"
  | "draft"
  | "reviewing"
  | "pending_review"
  | "published"
  | "rejected";

interface StoredArticle {
  id: string;
  content: string;
  title: string;
  status: ArticleStatus;
  raw_match_data: DailyFootballData | null;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ============================================================================
// OPENAI REVIEW CALL
// ============================================================================

/**
 * Runs a single review pass via gpt-5.2.
 * Returns a parsed ReviewResult or a failed default if anything goes wrong.
 */
async function runReviewPass(
  passName: string,
  userPrompt: string
): Promise<ReviewResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  const failedResult: ReviewResult = {
    passed: false,
    issues: [`${passName} review failed — could not complete check`],
    confidence: 0,
  };

  if (!apiKey) {
    console.error("[ArticleReviewer] OpenAI API key not configured");
    return failedResult;
  }

  console.log(`[ArticleReviewer] Running ${passName} review pass`);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: REVIEW_MODEL,
        reasoning_effort: "medium",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a meticulous editorial reviewer. Always respond with valid JSON matching the requested schema exactly.",
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as {
        error?: { message?: string };
      };
      console.error(
        `[ArticleReviewer] OpenAI error ${response.status} in ${passName}: ${errorData?.error?.message ?? response.statusText}`
      );
      return failedResult;
    }

    const data = await response.json() as OpenAIResponse;
    const raw = data.choices?.[0]?.message?.content;

    if (!raw) {
      console.error(`[ArticleReviewer] Empty response from ${passName} review`);
      return failedResult;
    }

    const parsed = JSON.parse(raw) as Partial<ReviewResult>;

    // Validate the response has the expected shape
    if (typeof parsed.passed !== "boolean" || !Array.isArray(parsed.issues)) {
      console.error(
        `[ArticleReviewer] Invalid review response structure for ${passName}`
      );
      return failedResult;
    }

    const result: ReviewResult = {
      passed: parsed.passed,
      issues: parsed.issues.filter((issue) => typeof issue === "string"),
      confidence:
        typeof parsed.confidence === "number"
          ? Math.min(1, Math.max(0, parsed.confidence))
          : 0.5,
    };

    console.log(
      `[ArticleReviewer] ${passName} review: ${result.passed ? "PASSED" : "FAILED"} (${result.issues.length} issues, confidence: ${result.confidence})`
    );

    return result;
  } catch (error) {
    console.error(`[ArticleReviewer] Error in ${passName} review:`, error);
    return failedResult;
  }
}

// ============================================================================
// AUTO-REVISION PASS
// ============================================================================

/**
 * Runs a revision pass using GPT-5.2 to fix all issues flagged by the three
 * review passes. Returns the corrected article content, or null if revision
 * was not needed or failed.
 */
async function runRevisionPass(
  originalContent: string,
  footballData: DailyFootballData,
  factualResult: ReviewResult,
  qualityResult: ReviewResult,
  sensitivityResult: ReviewResult
): Promise<string | null> {
  const allIssues: string[] = [];

  if (!factualResult.passed && factualResult.issues.length > 0) {
    allIssues.push(...factualResult.issues.map((i) => `[FACTUAL] ${i}`));
  }
  if (!qualityResult.passed && qualityResult.issues.length > 0) {
    allIssues.push(...qualityResult.issues.map((i) => `[QUALITY] ${i}`));
  }
  if (!sensitivityResult.passed && sensitivityResult.issues.length > 0) {
    allIssues.push(...sensitivityResult.issues.map((i) => `[SENSITIVITY] ${i}`));
  }

  if (allIssues.length === 0) {
    console.log("[ArticleReviewer] No issues to fix — skipping revision");
    return null;
  }

  console.log(`[ArticleReviewer] Running revision pass to fix ${allIssues.length} issues`);

  const matchDataJson = JSON.stringify(
    footballData.matches.map((m) => ({
      home: m.homeTeam,
      away: m.awayTeam,
      score: `${m.homeGoals}-${m.awayGoals}`,
      league: m.league,
      goalscorers: m.goalscorers,
      redCards: m.redCards,
    })),
    null,
    2
  );

  const revisionPrompt = buildRevisionPrompt(originalContent, matchDataJson, allIssues);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: REVIEW_MODEL,
        reasoning_effort: "high",
        messages: [
          {
            role: "system",
            content:
              "You are a senior football editor revising an article. Fix every flagged issue while preserving the article's voice, structure, and all correct content. Always use British English (colour, defence, favourite, honour, centre, recognise, etc.). Return ONLY the corrected markdown article content — no JSON wrapper, no explanation.",
          },
          {
            role: "user",
            content: revisionPrompt,
          },
        ],
        max_completion_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      console.error(
        `[ArticleReviewer] Revision API error ${response.status}: ${errorData?.error?.message ?? response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as OpenAIResponse;
    const revised = data.choices?.[0]?.message?.content;

    if (!revised || revised.length < 200) {
      console.error("[ArticleReviewer] Revision produced unusable output");
      return null;
    }

    console.log(
      `[ArticleReviewer] Revision complete — ${revised.length} chars (was ${originalContent.length})`
    );

    return revised;
  } catch (error) {
    console.error("[ArticleReviewer] Revision pass failed:", error);
    return null;
  }
}

// ============================================================================
// SUPABASE UTILITIES
// ============================================================================

/**
 * Fetches the article and its stored match data from Supabase.
 */
async function fetchArticleForReview(
  articleId: string
): Promise<StoredArticle | null> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .select("id, content, title, status, raw_match_data")
    .eq("id", articleId)
    .single();

  if (error) {
    console.error("[ArticleReviewer] Failed to fetch article:", error);
    return null;
  }

  if (!data) {
    console.error(`[ArticleReviewer] Article not found: ${articleId}`);
    return null;
  }

  return data as StoredArticle;
}

/**
 * Persists a single review pass result to Supabase.
 * Uses the column name pattern: review_factual, review_quality, review_sensitivity.
 */
async function saveReviewResult(
  articleId: string,
  column: "review_factual" | "review_quality" | "review_sensitivity",
  result: ReviewResult
): Promise<void> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("blog_articles")
    .update({
      [column]: result as unknown as Json,
    })
    .eq("id", articleId);

  if (error) {
    console.error(
      `[ArticleReviewer] Failed to save ${column} for article ${articleId}:`,
      error
    );
  }
}

/**
 * Updates the article status after all review passes are complete.
 */
async function setArticleStatus(
  articleId: string,
  status: ArticleStatus
): Promise<void> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("blog_articles")
    .update({ status })
    .eq("id", articleId);

  if (error) {
    console.error(
      `[ArticleReviewer] Failed to update status to '${status}' for article ${articleId}:`,
      error
    );
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Runs the three-pass review pipeline on an existing article.
 *
 * Pipeline:
 *   1. Fetch article + match data from Supabase
 *   2. Pass 1: Factual review — cross-reference scores and stats
 *   3. Pass 2: Quality review — journalistic writing standards
 *   4. Pass 3: Sensitivity review — bias, controversy, legal risk
 *   5. Save each result to Supabase as it completes
 *   6. Set status to 'pending_review' when all passes done
 *
 * The article always moves to 'pending_review' regardless of pass/fail —
 * the review results inform the human editor's decision.
 *
 * @param articleId - UUID of the article in blog_articles table
 * @returns ReviewerResult with detailed pass/fail breakdown
 */
export async function reviewArticle(
  articleId: string
): Promise<ReviewerResult> {
  console.log(`[ArticleReviewer] Starting review pipeline for article ${articleId}`);

  // Step 1: Fetch the article
  const article = await fetchArticleForReview(articleId);

  if (!article) {
    return {
      success: false,
      error: `Article ${articleId} not found or could not be fetched`,
    };
  }

  console.log(`[ArticleReviewer] Reviewing: "${article.title}"`);

  // Reconstruct footballData from stored raw_match_data (may be null for no-match days)
  const footballData: DailyFootballData = article.raw_match_data ?? {
    date: "",
    totalMatches: 0,
    matches: [],
    activeTournaments: [],
    requestsUsed: 0,
    hasData: false,
  };

  // Step 2: Pass 1 — Factual accuracy review
  const factualPrompt = buildFactualReviewPrompt(article.content, footballData);
  const factualResult = await runReviewPass("Factual", factualPrompt);
  await saveReviewResult(articleId, "review_factual", factualResult);

  // Step 3: Pass 2 — Writing quality review
  const qualityPrompt = buildQualityReviewPrompt(article.content);
  const qualityResult = await runReviewPass("Quality", qualityPrompt);
  await saveReviewResult(articleId, "review_quality", qualityResult);

  // Step 4: Pass 3 — Sensitivity review
  const sensitivityPrompt = buildSensitivityReviewPrompt(article.content);
  const sensitivityResult = await runReviewPass("Sensitivity", sensitivityPrompt);
  await saveReviewResult(articleId, "review_sensitivity", sensitivityResult);

  // Step 5: Auto-revision — if any reviews flagged issues, fix them automatically
  const totalIssues =
    factualResult.issues.length +
    qualityResult.issues.length +
    sensitivityResult.issues.length;

  if (totalIssues > 0) {
    const revisedContent = await runRevisionPass(
      article.content,
      footballData,
      factualResult,
      qualityResult,
      sensitivityResult
    );

    if (revisedContent) {
      const supabase = await createAdminClient();
      await supabase
        .from("blog_articles")
        .update({
          content: revisedContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", articleId);

      console.log("[ArticleReviewer] Revised content saved to database");
    }
  }

  // Step 6: Move article to pending_review
  await setArticleStatus(articleId, "pending_review");

  const overallPassed =
    factualResult.passed && qualityResult.passed && sensitivityResult.passed;

  const summary: ReviewSummary = {
    articleId,
    factual: factualResult,
    quality: qualityResult,
    sensitivity: sensitivityResult,
    overallPassed,
    totalIssues,
  };

  console.log(
    `[ArticleReviewer] Review complete — overall: ${overallPassed ? "PASSED" : "NEEDS ATTENTION"}, ${totalIssues} total issues`
  );

  return {
    success: true,
    review: summary,
  };
}
