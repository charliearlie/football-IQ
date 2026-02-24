"use server";

import { createAdminClient, ensureAdmin } from "@/lib/supabase/server";

export async function approveArticle(articleId: string): Promise<void> {
  await ensureAdmin();
  const supabase = await createAdminClient();
  await supabase
    .from("blog_articles")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
}

export async function rejectArticle(articleId: string): Promise<void> {
  await ensureAdmin();
  const supabase = await createAdminClient();
  await supabase
    .from("blog_articles")
    .update({ status: "rejected" })
    .eq("id", articleId);

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/blog");
}

export async function updateArticleContent(
  articleId: string,
  content: string
): Promise<void> {
  await ensureAdmin();
  const supabase = await createAdminClient();
  await supabase
    .from("blog_articles")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", articleId);

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/admin/blog/${articleId}`);
}

export async function triggerGeneration(
  date: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return { success: false, error: "CRON_SECRET is not configured" };

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const encodedDate = encodeURIComponent(date);

    // Fire and forget — the cron route runs as its own serverless invocation.
    // We don't await the response because the pipeline takes 2-4 minutes.
    fetch(
      `${baseUrl}/api/cron/blog-generate?date=${encodedDate}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${cronSecret}` },
      }
    ).catch((err) =>
      console.error("[triggerGeneration] Background fetch failed:", err)
    );

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/blog");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to trigger generation",
    };
  }
}

export async function regenerateArticle(articleId: string): Promise<void> {
  await ensureAdmin();
  const supabase = await createAdminClient();

  const { data: article } = await supabase
    .from("blog_articles")
    .select("article_date")
    .eq("id", articleId)
    .single();

  if (!article) throw new Error("Article not found");

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) throw new Error("CRON_SECRET is not configured");

  // Delete the existing row so the pipeline can insert fresh for this date
  await supabase.from("blog_articles").delete().eq("id", articleId);

  // Trigger regeneration (fire and forget)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const date = encodeURIComponent(article.article_date);

  fetch(`${baseUrl}/api/cron/blog-generate?date=${date}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${cronSecret}` },
  }).catch(console.error);

  const { revalidatePath } = await import("next/cache");
  revalidatePath(`/admin/blog/${articleId}`);
  revalidatePath("/admin/blog");
}
