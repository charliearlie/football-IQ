-- Migration: 016_content_reports
-- Purpose: Create content_reports table for user-submitted puzzle error reports
-- Date: 2026-01-22

-- Create content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES daily_puzzles(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('retired_moved', 'incorrect_stats', 'name_visible', 'wrong_club', 'other')),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for quick lookup of pending reports by puzzle (used in calendar triage UI)
CREATE INDEX IF NOT EXISTS idx_content_reports_puzzle_pending
  ON content_reports(puzzle_id)
  WHERE status = 'pending';

-- Index for listing all pending reports (used in triage dashboard)
CREATE INDEX IF NOT EXISTS idx_content_reports_status_created
  ON content_reports(status, created_at DESC);

-- Index for finding reports within a date range (join with daily_puzzles for calendar view)
CREATE INDEX IF NOT EXISTS idx_content_reports_created
  ON content_reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anonymous) can create reports
-- This allows mobile users to report errors without authentication barriers
CREATE POLICY "Anyone can create reports" ON content_reports
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Policy: Service role can read all reports (for CMS admin access)
-- Note: CMS uses service role key which bypasses RLS, but this is explicit
CREATE POLICY "Service role can read all reports" ON content_reports
  FOR SELECT TO service_role
  USING (true);

-- Policy: Authenticated users can read their own reports
CREATE POLICY "Users can read own reports" ON content_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Policy: Service role can update reports (for resolve/dismiss actions)
CREATE POLICY "Service role can update reports" ON content_reports
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_content_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_reports_updated_at
  BEFORE UPDATE ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_content_reports_updated_at();

-- Add comment for documentation
COMMENT ON TABLE content_reports IS 'User-submitted error reports for puzzle content. Part of the Content Oracle quality control system.';
COMMENT ON COLUMN content_reports.report_type IS 'Type of error: retired_moved (player changed clubs), incorrect_stats (wrong data), name_visible (spoiler), wrong_club (club name error), other';
COMMENT ON COLUMN content_reports.status IS 'Report status: pending (needs review), resolved (fixed), dismissed (invalid report)';
