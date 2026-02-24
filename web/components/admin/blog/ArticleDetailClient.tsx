"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArticlePreview } from "./ArticlePreview";
import { ReviewResults } from "./ReviewResults";
import {
  approveArticle,
  rejectArticle,
  updateArticleContent,
  regenerateArticle,
} from "@/app/(dashboard)/admin/blog/actions";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Calendar,
  Globe,
} from "lucide-react";
import Link from "next/link";

import type { ReviewResult } from "@/lib/blog/types";

// ============================================================================
// Types
// ============================================================================

interface Article {
  id: string;
  slug: string | null;
  title: string | null;
  article_date: string | null;
  status: string | null;
  content: string | null;
  review_factual: ReviewResult | null;
  review_quality: ReviewResult | null;
  review_sensitivity: ReviewResult | null;
  published_at: string | null;
  created_at: string | null;
}

interface ArticleDetailClientProps {
  article: Article;
}

// ============================================================================
// Status badge
// ============================================================================

function statusLabel(status: string | null): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    generating: { label: "Generating", className: "text-slate-400" },
    reviewing: { label: "Reviewing", className: "text-blue-400" },
    pending_review: { label: "Pending Review", className: "text-amber-400" },
    published: { label: "Published", className: "text-pitch-green" },
    rejected: { label: "Rejected", className: "text-red-400" },
  };
  return (
    map[status ?? ""] ?? {
      label: status ?? "Unknown",
      className: "text-muted-foreground",
    }
  );
}

// ============================================================================
// Main Client Component
// ============================================================================

export function ArticleDetailClient({ article }: ArticleDetailClientProps) {
  const router = useRouter();
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<
    "approve" | "reject" | "regenerate" | "save" | null
  >(null);

  const currentContent = editedContent ?? article.content ?? "";
  const hasUnsavedChanges =
    editedContent !== null && editedContent !== article.content;

  const { label: sLabel, className: sClass } = statusLabel(article.status);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  function handleSave() {
    if (!hasUnsavedChanges) return;
    setActiveAction("save");
    startTransition(async () => {
      try {
        await updateArticleContent(article.id, editedContent!);
        toast.success("Content saved");
        setEditedContent(null);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save content"
        );
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleApprove() {
    setActiveAction("approve");
    startTransition(async () => {
      try {
        // Save any pending edits first
        if (hasUnsavedChanges) {
          await updateArticleContent(article.id, editedContent!);
        }
        await approveArticle(article.id);
        toast.success("Article approved and published");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to approve article"
        );
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleReject() {
    setActiveAction("reject");
    startTransition(async () => {
      try {
        await rejectArticle(article.id);
        toast.success("Article rejected");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to reject article"
        );
      } finally {
        setActiveAction(null);
      }
    });
  }

  function handleRegenerate() {
    setActiveAction("regenerate");
    startTransition(async () => {
      try {
        await regenerateArticle(article.id);
        toast.success("Regeneration triggered — check back in a few minutes");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to trigger regeneration"
        );
      } finally {
        setActiveAction(null);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="self-start">
          <Link href="/admin/blog">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {/* Meta */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
            {article.article_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(article.article_date), "d MMM yyyy")}
              </span>
            )}
            <span className={`font-medium ${sClass}`}>{sLabel}</span>
          </div>

          {/* Action buttons */}
          {hasUnsavedChanges && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={isPending}
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              {activeAction === "save" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              Save Edits
            </Button>
          )}

          {article.status !== "published" && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isPending}
              className="bg-pitch-green/20 text-pitch-green hover:bg-pitch-green/30 border border-pitch-green/30"
            >
              {activeAction === "approve" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve
            </Button>
          )}

          {article.status !== "rejected" && article.status !== "published" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              disabled={isPending}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {activeAction === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Reject
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleRegenerate}
            disabled={isPending}
            className="text-muted-foreground hover:text-floodlight"
          >
            {activeAction === "regenerate" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </Button>

          {article.status === "published" && article.slug && (
            <Button size="sm" variant="ghost" asChild>
              <a
                href={`/blog/${article.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-floodlight"
              >
                <Globe className="h-3.5 w-3.5" />
                View Live
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: Article Preview / Editor */}
        <ArticlePreview
          content={currentContent}
          title={article.title ?? undefined}
          onContentChange={setEditedContent}
        />

        {/* Right: Review results */}
        <div className="space-y-4">
          <ReviewResults
            factual={article.review_factual}
            quality={article.review_quality}
            sensitivity={article.review_sensitivity}
          />

          {/* Article metadata */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
              Metadata
            </p>
            {article.slug && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground w-20 shrink-0">Slug</span>
                <span className="text-floodlight font-mono text-xs break-all">
                  {article.slug}
                </span>
              </div>
            )}
            {article.created_at && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground w-20 shrink-0">Created</span>
                <span className="text-slate-300 text-xs">
                  {format(new Date(article.created_at), "d MMM yyyy HH:mm")}
                </span>
              </div>
            )}
            {article.published_at && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground w-20 shrink-0">Published</span>
                <span className="text-pitch-green text-xs">
                  {format(new Date(article.published_at), "d MMM yyyy HH:mm")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
