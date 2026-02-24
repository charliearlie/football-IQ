"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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
  review_factual: ReviewResult | null;
  review_quality: ReviewResult | null;
  review_sensitivity: ReviewResult | null;
  published_at: string | null;
  created_at: string | null;
}

interface ArticleListProps {
  articles: Article[];
}

// ============================================================================
// Status badge helpers
// ============================================================================

type ArticleStatus =
  | "generating"
  | "reviewing"
  | "pending_review"
  | "published"
  | "rejected"
  | string;

function StatusBadge({ status }: { status: ArticleStatus | null }) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;

  const statusMap: Record<
    string,
    { label: string; className: string }
  > = {
    generating: {
      label: "Generating",
      className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    },
    reviewing: {
      label: "Reviewing",
      className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    pending_review: {
      label: "Pending Review",
      className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    published: {
      label: "Published",
      className: "bg-pitch-green/20 text-pitch-green border-pitch-green/30",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const config = statusMap[status] ?? {
    label: status,
    className: "bg-white/10 text-muted-foreground border-white/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ============================================================================
// Review dots
// ============================================================================

function ReviewDot({
  review,
  label,
}: {
  review: ReviewResult | null;
  label: string;
}) {
  if (!review) {
    return (
      <span
        title={`${label}: not reviewed`}
        className="inline-block h-2.5 w-2.5 rounded-full bg-white/20"
      />
    );
  }
  return (
    <span
      title={`${label}: ${review.passed ? "passed" : "failed"}`}
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        review.passed ? "bg-pitch-green" : "bg-red-500"
      }`}
    />
  );
}

function ReviewDots({
  factual,
  quality,
  sensitivity,
}: {
  factual: ReviewResult | null;
  quality: ReviewResult | null;
  sensitivity: ReviewResult | null;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <ReviewDot review={factual} label="Factual" />
      <ReviewDot review={quality} label="Quality" />
      <ReviewDot review={sensitivity} label="Sensitivity" />
    </div>
  );
}

// ============================================================================
// Filter options
// ============================================================================

const STATUS_FILTERS = [
  { value: "all", label: "All Articles" },
  { value: "pending_review", label: "Pending Review" },
  { value: "generating", label: "Generating" },
  { value: "reviewing", label: "Reviewing" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

// ============================================================================
// Main Component
// ============================================================================

export function ArticleList({ articles }: ArticleListProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered =
    statusFilter === "all"
      ? articles
      : articles.filter((a) => a.status === statusFilter);

  // Count per status for quick reference
  const pendingCount = articles.filter(
    (a) => a.status === "pending_review"
  ).length;

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 text-sm text-muted-foreground ml-auto">
          {pendingCount > 0 && (
            <span className="text-amber-400 font-medium">
              {pendingCount} awaiting review
            </span>
          )}
          <span>{filtered.length} article{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Title</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Reviews</TableHead>
              <TableHead className="text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-10"
                >
                  No articles found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((article) => (
                <TableRow
                  key={article.id}
                  className="border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {article.article_date
                      ? format(new Date(article.article_date), "d MMM yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-floodlight font-medium line-clamp-2 text-sm">
                      {article.title ?? "Untitled"}
                    </span>
                    {article.slug && (
                      <span className="block text-xs text-muted-foreground/60 mt-0.5 font-mono truncate">
                        /{article.slug}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={article.status} />
                  </TableCell>
                  <TableCell>
                    <ReviewDots
                      factual={article.review_factual}
                      quality={article.review_quality}
                      sensitivity={article.review_sensitivity}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/blog/${article.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
