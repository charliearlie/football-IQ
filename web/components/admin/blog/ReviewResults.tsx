"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

import type { ReviewResult } from "@/lib/blog/types";

// ============================================================================
// Types
// ============================================================================

interface ReviewResultsProps {
  factual: ReviewResult | null;
  quality: ReviewResult | null;
  sensitivity: ReviewResult | null;
}

// ============================================================================
// Single review pass card
// ============================================================================

interface ReviewPassProps {
  label: string;
  description: string;
  result: ReviewResult | null;
}

function ReviewPass({ label, description, result }: ReviewPassProps) {
  const [expanded, setExpanded] = useState(false);

  const hasIssues = result && result.issues && result.issues.length > 0;

  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-3">
        {/* Status icon */}
        <div className="shrink-0 mt-0.5">
          {!result ? (
            <MinusCircle className="h-4 w-4 text-muted-foreground/50" />
          ) : result.passed ? (
            <CheckCircle2 className="h-4 w-4 text-pitch-green" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
        </div>

        {/* Label + confidence */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-floodlight">{label}</span>
            {result && (
              <span className="text-xs text-muted-foreground shrink-0">
                {Math.round(result.confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>

          {/* Confidence bar */}
          {result && (
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  result.passed ? "bg-pitch-green" : "bg-red-500"
                }`}
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Issues section */}
      {result && !result.passed && (
        <div className="border-t border-white/10">
          {hasIssues ? (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  {result.issues.length} issue
                  {result.issues.length !== 1 ? "s" : ""} flagged
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded && (
                <ul className="px-3 pb-3 space-y-1.5 border-t border-white/5 pt-2">
                  {result.issues.map((issue, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-400"
                    >
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400/70 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No specific issues recorded.
            </p>
          )}
        </div>
      )}

      {/* Not yet reviewed */}
      {!result && (
        <div className="border-t border-white/5 px-3 py-2">
          <p className="text-xs text-muted-foreground/50 italic">
            Not yet reviewed
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function ReviewResults({
  factual,
  quality,
  sensitivity,
}: ReviewResultsProps) {
  const allPassed =
    factual?.passed === true &&
    quality?.passed === true &&
    sensitivity?.passed === true;

  const anyFailed =
    factual?.passed === false ||
    quality?.passed === false ||
    sensitivity?.passed === false;

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      <div
        className={`rounded-lg border px-4 py-3 text-sm font-medium ${
          allPassed
            ? "border-pitch-green/30 bg-pitch-green/10 text-pitch-green"
            : anyFailed
            ? "border-red-500/30 bg-red-500/10 text-red-400"
            : "border-white/10 bg-white/5 text-muted-foreground"
        }`}
      >
        {allPassed
          ? "All review checks passed — ready to approve"
          : anyFailed
          ? "One or more review checks failed — review issues below"
          : "Review checks not yet completed"}
      </div>

      {/* Individual pass results */}
      <ReviewPass
        label="Factual Accuracy"
        description="Verifies claims, statistics, and facts in the article"
        result={factual}
      />
      <ReviewPass
        label="Quality & Clarity"
        description="Assesses writing quality, structure, and readability"
        result={quality}
      />
      <ReviewPass
        label="Sensitivity"
        description="Checks for potentially sensitive or harmful content"
        result={sensitivity}
      />
    </div>
  );
}
