import { NextRequest } from "next/server";
import { validateApiAuth } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/blog/list?status=draft&limit=20&from_date=2026-03-01
 *
 * List blog articles with optional filters.
 */
export async function GET(request: NextRequest) {
  const authError = validateApiAuth(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 100);
  const fromDate = searchParams.get("from_date");

  const supabase = await createAdminClient();

  let query = supabase
    .from("blog_articles")
    .select("id, title, slug, status, article_date, excerpt, created_at, published_at")
    .order("article_date", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  if (fromDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      return Response.json(
        { success: false, error: "from_date must be YYYY-MM-DD" },
        { status: 400 },
      );
    }
    query = query.gte("article_date", fromDate);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    count: data.length,
    articles: data,
  });
}
