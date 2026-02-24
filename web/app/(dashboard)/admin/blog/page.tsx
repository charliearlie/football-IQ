import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { createAdminClient } from "@/lib/supabase/server";
import { ArticleList } from "@/components/admin/blog/ArticleList";
import { ManualGenerate } from "@/components/admin/blog/ManualGenerate";

export const dynamic = "force-dynamic";

export default async function BlogAdminPage() {
  const supabase = await createAdminClient();
  const { data: articles } = await supabase
    .from("blog_articles")
    .select(
      "id, slug, title, article_date, status, review_factual, review_quality, review_sensitivity, published_at, created_at"
    )
    .order("article_date", { ascending: false });

  // Cast from Supabase Json to the component's expected Article type
  const typedArticles = (articles ?? []) as Array<{
    id: string;
    slug: string;
    title: string;
    article_date: string;
    status: string;
    review_factual: { passed: boolean; issues: string[]; confidence: number } | null;
    review_quality: { passed: boolean; issues: string[]; confidence: number } | null;
    review_sensitivity: { passed: boolean; issues: string[]; confidence: number } | null;
    published_at: string | null;
    created_at: string;
  }>;

  return (
    <AdminPageShell
      title="Blog"
      subtitle="Review AI-generated articles, edit content, and approve for publication"
    >
      <ManualGenerate />
      <ArticleList articles={typedArticles} />
    </AdminPageShell>
  );
}
