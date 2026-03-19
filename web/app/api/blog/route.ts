import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

// ============================================================================
// JSON Schema (draft-07) describing the POST body
// ============================================================================

const ARTICLE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "BlogArticle",
  description: "Create a blog article in the Football IQ blog_articles table.",
  type: "object",
  required: ["title", "slug", "content", "article_date"],
  properties: {
    title: { type: "string", description: "Article headline" },
    slug: {
      type: "string",
      pattern: "^[a-z0-9-]+$",
      description: "URL slug (lowercase, hyphens only)",
    },
    content: { type: "string", description: "Full article body (HTML or Markdown)" },
    article_date: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      description: "Publication date (YYYY-MM-DD)",
    },
    subtitle: { type: "string", description: "Optional subtitle" },
    excerpt: { type: "string", description: "Short excerpt for index pages" },
    meta_title: {
      type: "string",
      maxLength: 60,
      description: "SEO title (max 60 chars)",
    },
    meta_description: {
      type: "string",
      maxLength: 160,
      description: "SEO description (max 160 chars)",
    },
    status: {
      type: "string",
      enum: ["draft", "reviewing", "published", "rejected"],
      default: "draft",
      description: "Article status (defaults to draft)",
    },
    generation_model: { type: "string", description: "Model used to generate the article" },
    raw_match_data: { type: "object", description: "Raw match data (JSONB)" },
    research_data: { type: "object", description: "Research context (JSONB)" },
    og_image_url: { type: "string", format: "uri", description: "OG image URL" },
  },
  additionalProperties: false,
} as const;

const VALID_STATUSES = ["draft", "reviewing", "published", "rejected"];

// ============================================================================
// Auth helper
// ============================================================================

function authorize(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  return !!cronSecret && authHeader === `Bearer ${cronSecret}`;
}

// ============================================================================
// GET — return JSON Schema
// ============================================================================

export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  return NextResponse.json(ARTICLE_SCHEMA);
}

// ============================================================================
// POST — create a blog article
// ============================================================================

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Validation -----------------------------------------------------------

  const errors: string[] = [];

  const title = body.title;
  const slug = body.slug;
  const content = body.content;
  const articleDate = body.article_date;

  if (typeof title !== "string" || !title.trim()) errors.push("title is required");
  if (typeof slug !== "string" || !slug.trim()) errors.push("slug is required");
  if (typeof content !== "string" || !content.trim()) errors.push("content is required");
  if (typeof articleDate !== "string" || !articleDate.trim()) {
    errors.push("article_date is required");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(articleDate)) {
    errors.push("article_date must be YYYY-MM-DD");
  }

  if (typeof slug === "string" && slug.trim() && !/^[a-z0-9-]+$/.test(slug)) {
    errors.push("slug must contain only lowercase letters, numbers, and hyphens");
  }

  const status = (body.status as string) ?? "draft";
  if (!VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (body.meta_title && typeof body.meta_title === "string" && body.meta_title.length > 60) {
    errors.push("meta_title must be 60 characters or fewer");
  }
  if (body.meta_description && typeof body.meta_description === "string" && body.meta_description.length > 160) {
    errors.push("meta_description must be 160 characters or fewer");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
  }

  // --- Insert ---------------------------------------------------------------

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .insert({
      title: (title as string).trim(),
      slug: (slug as string).trim(),
      content: (content as string).trim(),
      article_date: articleDate as string,
      subtitle: (body.subtitle as string) ?? null,
      excerpt: (body.excerpt as string) ?? null,
      meta_title: (body.meta_title as string) ?? null,
      meta_description: (body.meta_description as string) ?? null,
      status,
      generation_model: (body.generation_model as string) ?? null,
      raw_match_data: (body.raw_match_data as Json) ?? null,
      research_data: (body.research_data as Json) ?? null,
      og_image_url: (body.og_image_url as string) ?? null,
    })
    .select("id, slug")
    .single();

  if (error) {
    // Postgres 23505 = unique_violation (duplicate slug or date)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Duplicate article", details: error.message },
        { status: 409 },
      );
    }
    console.error("[Blog API] Insert failed:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }

  // --- Revalidate if published ----------------------------------------------

  if (status === "published") {
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
  }

  return NextResponse.json(
    { success: true, id: data.id, slug: data.slug },
    { status: 201 },
  );
}
