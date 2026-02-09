"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getReportsForPuzzle,
  getPendingReportsForDateRange,
  resolveReport,
} from "@/app/(dashboard)/calendar/actions";
import type { ContentReport } from "@/types/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface PendingReportCount {
  puzzleId: string;
  reportCount: number;
}

export interface UseReportsForPuzzleReturn {
  reports: ContentReport[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  resolve: (reportId: string, status: "resolved" | "dismissed") => Promise<boolean>;
  pendingCount: number;
}

export interface UsePendingReportsReturn {
  pendingReports: PendingReportCount[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasPendingReport: (puzzleId: string) => boolean;
  getPendingCount: (puzzleId: string) => number;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch and manage reports for a specific puzzle.
 *
 * @param puzzleId - The puzzle ID to fetch reports for
 * @returns Reports data, loading state, and actions
 */
export function useReportsForPuzzle(
  puzzleId: string | null
): UseReportsForPuzzleReturn {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!puzzleId) {
      setReports([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getReportsForPuzzle(puzzleId);
      if (result.success && result.data) {
        setReports(result.data);
      } else {
        setError(result.error || "Failed to fetch reports");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [puzzleId]);

  // Fetch reports when puzzle ID changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const resolve = useCallback(
    async (reportId: string, status: "resolved" | "dismissed"): Promise<boolean> => {
      try {
        const result = await resolveReport(reportId, status);
        if (result.success) {
          // Update local state optimistically
          setReports((prev) =>
            prev.map((r) =>
              r.id === reportId
                ? { ...r, status, resolved_at: new Date().toISOString() }
                : r
            )
          );
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return {
    reports,
    isLoading,
    error,
    refetch: fetchReports,
    resolve,
    pendingCount,
  };
}

/**
 * Hook to fetch pending reports for puzzles within a date range.
 * Used to display report indicators on the calendar.
 *
 * @param startDate - Start of date range (YYYY-MM-DD)
 * @param endDate - End of date range (YYYY-MM-DD)
 * @returns Pending report counts by puzzle ID
 */
export function usePendingReports(
  startDate: string,
  endDate: string
): UsePendingReportsReturn {
  const [pendingReports, setPendingReports] = useState<PendingReportCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingReports = useCallback(async () => {
    if (!startDate || !endDate) {
      setPendingReports([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPendingReportsForDateRange(startDate, endDate);
      if (result.success && result.data) {
        setPendingReports(result.data);
      } else {
        setError(result.error || "Failed to fetch pending reports");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Fetch pending reports when date range changes
  useEffect(() => {
    fetchPendingReports();
  }, [fetchPendingReports]);

  const hasPendingReport = useCallback(
    (puzzleId: string): boolean => {
      return pendingReports.some((r) => r.puzzleId === puzzleId);
    },
    [pendingReports]
  );

  const getPendingCount = useCallback(
    (puzzleId: string): number => {
      const report = pendingReports.find((r) => r.puzzleId === puzzleId);
      return report?.reportCount || 0;
    },
    [pendingReports]
  );

  return {
    pendingReports,
    isLoading,
    error,
    refetch: fetchPendingReports,
    hasPendingReport,
    getPendingCount,
  };
}
