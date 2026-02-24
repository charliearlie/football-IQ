import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ArticleDetailClient } from "@/components/admin/blog/ArticleDetailClient";
import type { BlogArticleRow, ReviewResult } from "@/lib/blog/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlogArticleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createAdminClient();
  const { data: raw } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("id", id)
    .single();

  if (!raw) {
    notFound();
  }

  // Cast Supabase Json fields to the expected ReviewResult shape
  const article = {
    ...raw,
    review_factual: raw.review_factual as ReviewResult | null,
    review_quality: raw.review_quality as ReviewResult | null,
    review_sensitivity: raw.review_sensitivity as ReviewResult | null,
  };

  return (
    <AdminPageShell
      title="Blog Article"
      subtitle={article.title ?? "Untitled article"}
    >
      <ArticleDetailClient article={article} />
    </AdminPageShell>
  );
}
