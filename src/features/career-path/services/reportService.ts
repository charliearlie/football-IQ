/**
 * Report Service
 *
 * Handles submission of content error reports to Supabase.
 * Used by the ReportErrorSheet component.
 */

import { supabase } from '@/lib/supabase';

/**
 * Report type enum matching database constraint.
 */
export type ReportType =
  | 'retired_moved'
  | 'incorrect_stats'
  | 'name_visible'
  | 'wrong_club'
  | 'other';

/**
 * Result from submitting a report.
 */
export interface SubmitReportResult {
  success: boolean;
  reportId?: string;
  error?: string;
}

/**
 * Submit an error report for a puzzle.
 *
 * @param puzzleId - UUID of the puzzle being reported
 * @param reportType - Type of error (from predefined enum)
 * @param comment - Optional additional details
 * @returns Result with success status and report ID or error
 *
 * @example
 * ```ts
 * const result = await submitReport('abc-123', 'incorrect_stats', 'Goals wrong');
 * if (result.success) {
 *   console.log('Report submitted:', result.reportId);
 * }
 * ```
 */
export async function submitReport(
  puzzleId: string,
  reportType: ReportType,
  comment?: string
): Promise<SubmitReportResult> {
  try {
    // Get current user (may be null for anonymous users)
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    // Insert the report
    // Note: content_reports table allows null reporter_id for anonymous reports
    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        puzzle_id: puzzleId,
        report_type: reportType,
        comment: comment || null,
        reporter_id: userId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[ReportService] Insert failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      reportId: data.id,
    };
  } catch (err) {
    console.error('[ReportService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    };
  }
}

/**
 * Check if the current user has already reported a specific puzzle.
 *
 * @param puzzleId - UUID of the puzzle to check
 * @returns True if user has pending report for this puzzle
 */
export async function hasUserReportedPuzzle(puzzleId: string): Promise<boolean> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (!userId) {
      // Anonymous users can report multiple times (we rely on rate limiting)
      return false;
    }

    const { count, error } = await supabase
      .from('content_reports')
      .select('id', { count: 'exact', head: true })
      .eq('puzzle_id', puzzleId)
      .eq('reporter_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('[ReportService] Check failed:', error);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (err) {
    console.error('[ReportService] Unexpected error:', err);
    return false;
  }
}
