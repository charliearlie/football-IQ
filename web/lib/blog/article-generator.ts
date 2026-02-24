/**
 * Article Generator
 *
 * Orchestrates the two-stage content generation pipeline:
 *   Stage 1 (Research): gpt-4o-search-preview — searches the web for context,
 *                       historical facts, and statistical milestones
 *   Stage 2 (Generate): gpt-5.2 — writes the structured article using match
 *                       data + research context
 *
 * The generated article is saved to Supabase with status 'reviewing'
 * before being handed off to the review pipeline.
 */

import { ImageResponse } from "@vercel/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";
import type { OGFont } from "@/components/og/og-fonts";
import { BlogArticleOGCard } from "@/components/og/BlogArticleOGCard";
import { collectDailyFootballData } from "./api-football";
import type { DailyFootballData } from "./api-football";
import {
  GENERATION_SYSTEM_PROMPT,
  buildGenerationPrompt,
  buildMatchResearchPrompt,
  buildHistoryResearchPrompt,
} from "./prompts";
import type { GeneratedArticleRaw } from "./prompts";

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const GENERATION_MODEL = "gpt-5.2";
const RESEARCH_MODEL = "gpt-4o-search-preview";

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratorResult {
  success: boolean;
  articleId?: string;
  error?: string;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string | null;
      refusal?: string | null;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// OPENAI UTILITIES
// ============================================================================

/**
 * Calls the OpenAI Chat Completions API.
 * Follows the same direct fetch pattern as oracle.ts.
 */
async function callOpenAI(
  model: string,
  messages: OpenAIMessage[],
  options: {
    temperature?: number;
    reasoningEffort?: string;
    jsonMode?: boolean;
    maxTokens?: number;
  } = {}
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("[ArticleGenerator] OpenAI API key not configured");
    return null;
  }

  const { temperature = 0.7, reasoningEffort, jsonMode = false, maxTokens } = options;

  // gpt-4o-search-preview does not support temperature or response_format
  const isSearchModel = model.includes("search-preview");
  // GPT-5 series does not support temperature — uses reasoning_effort instead
  const isGpt5 = model.startsWith("gpt-5");

  const body: Record<string, unknown> = {
    model,
    messages,
  };

  if (!isSearchModel && !isGpt5) {
    body.temperature = temperature;
  }

  if (isGpt5 && reasoningEffort) {
    body.reasoning_effort = reasoningEffort;
  }

  if (jsonMode && !isSearchModel) {
    body.response_format = { type: "json_object" };
  }

  if (maxTokens) {
    body[isGpt5 ? "max_completion_tokens" : "max_tokens"] = maxTokens;
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as {
        error?: { message?: string };
      };
      console.error(
        `[ArticleGenerator] OpenAI API error ${response.status}: ${errorData?.error?.message ?? response.statusText}`
      );
      return null;
    }

    const data = await response.json() as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      const choice = data.choices?.[0];
      const reason = choice?.finish_reason ?? "unknown";
      const refusal = choice?.message?.refusal;
      console.error(
        `[ArticleGenerator] Empty response from OpenAI — finish_reason: ${reason}${refusal ? `, refusal: ${refusal}` : ""}`,
        data.usage ? `(prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})` : ""
      );
      return null;
    }

    if (data.usage) {
      console.log(
        `[ArticleGenerator] Token usage — prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens}, total: ${data.usage.total_tokens}`
      );
    }

    return content;
  } catch (error) {
    console.error("[ArticleGenerator] Fetch error:", error);
    return null;
  }
}

// ============================================================================
// RESEARCH STAGE
// ============================================================================

/**
 * Uses gpt-4o-search-preview to gather match context, stats, and trivia.
 * This model automatically searches the web — no tools parameter needed.
 */
async function conductMatchResearch(
  date: string,
  footballData: DailyFootballData
): Promise<string> {
  console.log("[ArticleGenerator] Starting match research with gpt-4o-search-preview");

  const prompt = buildMatchResearchPrompt(date, footballData);

  const content = await callOpenAI(
    RESEARCH_MODEL,
    [{ role: "user", content: prompt }],
  );

  if (!content) {
    console.warn("[ArticleGenerator] Match research failed — proceeding without context");
    return "No match research context available.";
  }

  console.log(`[ArticleGenerator] Match research complete — ${content.length} chars`);
  return content;
}

/**
 * Uses gpt-4o-search-preview with a dedicated "On This Day" query.
 * Separated from match research so the web search focuses entirely
 * on historical football date facts rather than being crowded out
 * by today's results.
 */
async function conductHistoryResearch(date: string): Promise<string> {
  console.log("[ArticleGenerator] Starting history research with gpt-4o-search-preview");

  const prompt = buildHistoryResearchPrompt(date);

  const content = await callOpenAI(
    RESEARCH_MODEL,
    [{ role: "user", content: prompt }],
  );

  if (!content) {
    console.warn("[ArticleGenerator] History research failed — proceeding without historical context");
    return "No historical football facts available.";
  }

  console.log(`[ArticleGenerator] History research complete — ${content.length} chars`);
  return content;
}

// ============================================================================
// GENERATION STAGE
// ============================================================================

/**
 * Parses the raw JSON string returned by gpt-4o into a typed article object.
 * Validates that all required fields are present.
 */
function parseArticleResponse(raw: string): GeneratedArticleRaw | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GeneratedArticleRaw>;

    const requiredFields: Array<keyof GeneratedArticleRaw> = [
      "title",
      "subtitle",
      "meta_title",
      "meta_description",
      "excerpt",
      "slug",
      "content",
    ];

    for (const field of requiredFields) {
      if (!parsed[field] || typeof parsed[field] !== "string") {
        console.error(
          `[ArticleGenerator] Missing or invalid field in AI response: ${field}`
        );
        return null;
      }
    }

    // At this point every field has been validated as a non-empty string,
    // so casting the partial to the full type is safe.
    const validated = parsed as GeneratedArticleRaw;

    // Validate slug has date prefix format (YYYY-MM-DD-)
    const slugDatePattern = /^\d{4}-\d{2}-\d{2}-/;
    if (!slugDatePattern.test(validated.slug)) {
      console.warn(
        `[ArticleGenerator] Slug missing date prefix: ${validated.slug}`
      );
      // Don't reject — just log the warning
    }

    // Trim meta fields to their character limits
    return {
      title: validated.title.slice(0, 120),
      subtitle: validated.subtitle.slice(0, 200),
      meta_title: validated.meta_title.slice(0, 60),
      meta_description: validated.meta_description.slice(0, 160),
      excerpt: validated.excerpt,
      slug: validated.slug,
      content: validated.content,
    };
  } catch (error) {
    console.error("[ArticleGenerator] Failed to parse article JSON:", error);
    return null;
  }
}

/**
 * Generates the article content using gpt-5.2 with the structured match data
 * and research context from the previous stage.
 */
async function generateArticleContent(
  matchDate: string,
  articleDate: string,
  footballData: DailyFootballData,
  researchContext: string
): Promise<GeneratedArticleRaw | null> {
  console.log(`[ArticleGenerator] Starting article generation with ${GENERATION_MODEL}`);

  const userPrompt = buildGenerationPrompt(matchDate, articleDate, footballData, researchContext);

  const rawContent = await callOpenAI(
    GENERATION_MODEL,
    [
      { role: "system", content: GENERATION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    {
      reasoningEffort: "high",
      jsonMode: true,
      maxTokens: 8000,
    }
  );

  if (!rawContent) {
    return null;
  }

  const article = parseArticleResponse(rawContent);

  if (!article) {
    console.error("[ArticleGenerator] Failed to parse generated article");
    return null;
  }

  console.log(
    `[ArticleGenerator] Article generated — "${article.title}" (${article.content.length} chars)`
  );

  return article;
}

// ============================================================================
// SUPABASE PERSISTENCE
// ============================================================================

/**
 * Saves the generated article to the blog_articles table with status 'reviewing'.
 * Returns the new article's UUID.
 */
async function saveArticleToDatabase(
  date: string,
  article: GeneratedArticleRaw,
  footballData: DailyFootballData,
  researchContext: string
): Promise<string | null> {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .insert({
      article_date: date,
      slug: article.slug,
      title: article.title,
      subtitle: article.subtitle,
      meta_title: article.meta_title,
      meta_description: article.meta_description,
      excerpt: article.excerpt,
      content: article.content,
      status: "reviewing" as const,
      raw_match_data: footballData as unknown as Json,
      research_data: { context: researchContext } as Json,
      generation_model: GENERATION_MODEL,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ArticleGenerator] Failed to save article:", error);
    return null;
  }

  console.log(`[ArticleGenerator] Article saved with ID: ${data.id}`);
  return data.id as string;
}

// ============================================================================
// OG IMAGE GENERATION
// ============================================================================

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * Generates a branded OG image for the article using Satori and uploads
 * it to Supabase Storage. Returns the public URL on success, null on failure.
 *
 * Best-effort: failures are logged but do not block the pipeline.
 */
async function generateArticleOGImage(
  slug: string,
  title: string,
  articleDate: string,
  footballData: DailyFootballData
): Promise<string | null> {
  try {
    console.log("[ArticleGenerator] Generating OG image");

    // Load fonts from public/fonts (Node.js runtime)
    const fontsDir = join(process.cwd(), "public", "fonts");
    const [montserratRegular, montserratSemiBold, bebasNeue] = await Promise.all([
      readFile(join(fontsDir, "Montserrat-Regular.ttf")),
      readFile(join(fontsDir, "Montserrat-SemiBold.ttf")),
      readFile(join(fontsDir, "BebasNeue-Regular.ttf")),
    ]);
    const fonts: OGFont[] = [
      { name: "Montserrat", data: montserratRegular.buffer as ArrayBuffer, weight: 400, style: "normal" },
      { name: "Montserrat", data: montserratSemiBold.buffer as ArrayBuffer, weight: 600, style: "normal" },
      { name: "Bebas Neue", data: bebasNeue.buffer as ArrayBuffer, weight: 400, style: "normal" },
    ];

    // Build props from football data
    const matchResults = footballData.matches.slice(0, 3).map((m) => ({
      home: m.homeTeam,
      away: m.awayTeam,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
    }));

    const competitions = [...new Set(footballData.matches.map((m) => m.league))].slice(0, 4);

    const [year, month, day] = articleDate.split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    const formattedDate = utcDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    // Render JSX → PNG
    const imageResponse = new ImageResponse(
      BlogArticleOGCard({ title, matchResults, competitions, date: formattedDate }),
      { width: OG_WIDTH, height: OG_HEIGHT, fonts }
    );
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const supabase = await createAdminClient();
    const storagePath = `blog/${slug}.png`;

    const { error } = await supabase.storage
      .from("og-images")
      .upload(storagePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("[ArticleGenerator] Failed to upload OG image:", error);
      return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error("[ArticleGenerator] NEXT_PUBLIC_SUPABASE_URL not set — cannot construct OG image URL");
      return null;
    }
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/og-images/${storagePath}`;

    console.log(`[ArticleGenerator] OG image uploaded: ${storagePath}`);
    return publicUrl;
  } catch (error) {
    console.error("[ArticleGenerator] OG image generation failed:", error);
    return null;
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Generates a football digest article.
 *
 * Pipeline:
 *   1. Fetch match data from API-Football (matchDate = yesterday)
 *   2. Research with gpt-4o-search-preview (matches + "On This Day" for articleDate)
 *   3. Generate article with gpt-5.2 using match data + research
 *   4. Save to Supabase with status 'reviewing'
 *
 * If no matches were played, generates an "On This Day" focused article.
 *
 * @param matchDate - ISO date string for match data (YYYY-MM-DD), typically yesterday
 * @param articleDate - ISO date string for publication (YYYY-MM-DD), typically today
 * @returns GeneratorResult with the article ID on success
 */
export async function generateDailyArticle(
  matchDate: string,
  articleDate: string
): Promise<GeneratorResult> {
  console.log(`[ArticleGenerator] Starting pipeline — matches: ${matchDate}, article: ${articleDate}`);

  try {
    // Step 1: Collect match data from API-Football (yesterday's matches)
    console.log("[ArticleGenerator] Step 1: Collecting match data");
    const footballData = await collectDailyFootballData(matchDate);

    console.log(
      `[ArticleGenerator] Match data: ${footballData.totalMatches} matches, ${footballData.requestsUsed} API requests used`
    );

    // Step 2: Research phase — two parallel gpt-4o-search-preview calls
    // Match research uses matchDate, history research uses articleDate (today)
    console.log("[ArticleGenerator] Step 2: Conducting parallel research (match + history)");
    const [matchResearch, historyResearch] = await Promise.all([
      conductMatchResearch(matchDate, footballData),
      conductHistoryResearch(articleDate),
    ]);
    const researchContext = `MATCH RESEARCH:\n${matchResearch}\n\nHISTORICAL RESEARCH:\n${historyResearch}`;

    // Step 3: Generate article with gpt-5.2
    console.log("[ArticleGenerator] Step 3: Generating article");
    const article = await generateArticleContent(matchDate, articleDate, footballData, researchContext);

    if (!article) {
      return {
        success: false,
        error: "Article generation failed — OpenAI returned no usable content",
      };
    }

    // Step 4: Persist to Supabase (article_date = articleDate, the publication date)
    console.log("[ArticleGenerator] Step 4: Saving to database");
    const articleId = await saveArticleToDatabase(articleDate, article, footballData, researchContext);

    if (!articleId) {
      return {
        success: false,
        error: "Failed to save article to database",
      };
    }

    // Step 5: Generate OG image (best-effort — doesn't block the pipeline)
    console.log("[ArticleGenerator] Step 5: Generating OG image");
    const ogImageUrl = await generateArticleOGImage(article.slug, article.title, articleDate, footballData);

    if (ogImageUrl) {
      const supabase = await createAdminClient();
      const { error: ogUpdateError } = await supabase
        .from("blog_articles")
        .update({ og_image_url: ogImageUrl })
        .eq("id", articleId);
      if (ogUpdateError) {
        console.error("[ArticleGenerator] Failed to update og_image_url:", ogUpdateError);
      }
    }

    console.log(
      `[ArticleGenerator] Pipeline complete — article ID: ${articleId}`
    );

    return {
      success: true,
      articleId,
    };
  } catch (error) {
    console.error("[ArticleGenerator] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error in generation pipeline",
    };
  }
}
