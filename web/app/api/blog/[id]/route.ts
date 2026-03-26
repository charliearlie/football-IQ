import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validateApiAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UPDATABLE_FIELDS = [
  "title",
  "subtitle",
  "slug",
  "content",
  "excerpt",
  "status",
  "meta_title",
  "meta_description",
  "og_image_url",
] as const;

const VALID_STATUSES = ["draft", "reviewing", "pending_review", "published", "rejected"];

/**
 * PATCH /api/blog/[id]
 *
 * Update an existing blog article's fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Pick only allowed fields
  const updates: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: `No updatable fields provided. Allowed: ${UPDATABLE_FIELDS.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate status if provided
  if (updates.status && !VALID_STATUSES.includes(updates.status as string)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  // Set published_at when transitioning to published
  if (updates.status === "published") {
    updates.published_at = new Date().toISOString();
  }

  updates.updated_at = new Date().toISOString();

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("blog_articles")
    .update(updates)
    .eq("id", id)
    .select("id, slug, title, status, article_date, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Revalidate blog pages if published or unpublished
  if (updates.status === "published" || updates.status === "rejected") {
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
    if (data.slug) {
      revalidatePath(`/blog/${data.slug}`);
    }
  }

  return NextResponse.json({ success: true, article: data });
}
