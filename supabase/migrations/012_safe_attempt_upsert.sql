-- =============================================================================
-- Migration: 012_safe_attempt_upsert
-- Description: Add safe upsert function that prevents completed attempts from
--              being overwritten by incomplete ones (stale data protection).
--              Also adds unique constraint and hardens RLS policies.
--
-- Fixes SDET Audit Issues:
-- - Issue #1: Anonymous UPSERT creates duplicate rows
-- - Issue #2: UPSERT overwrites completed with incomplete (data loss)
-- - Issue #3: Missing unique constraint on (user_id, puzzle_id)
-- - Issue #4: RLS policy allows anonymous insert with ANY user_id
--
-- Date: 2026-01-14
-- =============================================================================

-- =============================================================================
-- STEP 1: Clean up existing duplicate attempts
-- =============================================================================
-- Keep the most recent attempt (by updated_at) for each user+puzzle combination
-- This is required before adding the unique constraint

DELETE FROM puzzle_attempts a
USING puzzle_attempts b
WHERE a.user_id = b.user_id
  AND a.puzzle_id = b.puzzle_id
  AND a.id != b.id
  AND (
    -- Keep the one with later updated_at
    a.updated_at < b.updated_at
    OR (
      -- If updated_at is same, keep the completed one
      a.updated_at = b.updated_at
      AND b.completed = true
      AND (a.completed IS NULL OR a.completed = false)
    )
    OR (
      -- If both have same updated_at and completion status, keep by id (deterministic)
      a.updated_at = b.updated_at
      AND a.completed IS NOT DISTINCT FROM b.completed
      AND a.id < b.id
    )
  );

-- =============================================================================
-- STEP 2: Add unique constraint on (user_id, puzzle_id)
-- =============================================================================
-- This enables proper UPSERT behavior via ON CONFLICT

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_puzzle'
  ) THEN
    ALTER TABLE puzzle_attempts
      ADD CONSTRAINT unique_user_puzzle UNIQUE (user_id, puzzle_id);
  END IF;
END $$;

-- =============================================================================
-- STEP 3: Create safe upsert function
-- =============================================================================
-- This function implements "completion protection" - once an attempt is marked
-- as completed, it cannot be overwritten by incomplete data from a stale device.
--
-- Logic:
-- - If row doesn't exist: INSERT new row
-- - If row exists AND is NOT completed: UPDATE with new data
-- - If row exists AND IS completed: Only update if new data is also completing
--   (preserve the existing completion data)

CREATE OR REPLACE FUNCTION safe_upsert_attempt(
  p_id UUID,
  p_puzzle_id UUID,
  p_user_id UUID,
  p_completed BOOLEAN,
  p_score INTEGER,
  p_score_display TEXT,
  p_metadata JSONB,
  p_started_at TIMESTAMPTZ,
  p_completed_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO puzzle_attempts (
    id, puzzle_id, user_id, completed, score, score_display,
    metadata, started_at, completed_at, updated_at
  )
  VALUES (
    p_id, p_puzzle_id, p_user_id, COALESCE(p_completed, false), p_score, p_score_display,
    p_metadata, p_started_at, p_completed_at, NOW()
  )
  ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
    -- COMPLETION PROTECTION: Never un-complete a completed attempt
    -- If existing row is completed, preserve all its data
    -- If existing row is not completed, accept the new data
    completed = CASE
      WHEN puzzle_attempts.completed = true THEN true
      ELSE COALESCE(EXCLUDED.completed, false)
    END,
    score = CASE
      WHEN puzzle_attempts.completed = true THEN puzzle_attempts.score
      ELSE EXCLUDED.score
    END,
    score_display = CASE
      WHEN puzzle_attempts.completed = true THEN puzzle_attempts.score_display
      ELSE EXCLUDED.score_display
    END,
    metadata = CASE
      WHEN puzzle_attempts.completed = true THEN puzzle_attempts.metadata
      ELSE EXCLUDED.metadata
    END,
    completed_at = CASE
      WHEN puzzle_attempts.completed = true THEN puzzle_attempts.completed_at
      ELSE EXCLUDED.completed_at
    END,
    -- Always update the timestamp to track sync activity
    updated_at = NOW()
  WHERE
    -- Only perform the update if:
    -- 1. Incoming data is completing the attempt (p_completed = true), OR
    -- 2. Existing row is not yet completed
    -- This prevents stale incomplete data from touching completed rows at all
    COALESCE(EXCLUDED.completed, false) = true
    OR puzzle_attempts.completed IS NOT TRUE;
END;
$$;

-- Grant execute permission to authenticated role
-- Note: Anonymous users via signInAnonymously() use the 'authenticated' role
GRANT EXECUTE ON FUNCTION safe_upsert_attempt TO authenticated;

-- =============================================================================
-- STEP 4: Harden RLS policies
-- =============================================================================
-- Fix: Remove overly permissive anonymous branch that allowed inserting with ANY user_id
-- Anonymous users via signInAnonymously() have auth.uid(), so they don't need special handling

-- Drop the existing overly-permissive insert policy
DROP POLICY IF EXISTS "Insert own attempts" ON puzzle_attempts;

-- Create tightened policy: ALL users must use their own user_id
-- This works for both authenticated and anonymous users (both have auth.uid())
CREATE POLICY "Insert own attempts" ON puzzle_attempts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- STEP 5: Fix role permissions
-- =============================================================================
-- Revoke grants from 'anon' role since anonymous users should use 'authenticated' role
-- via signInAnonymously() which properly sets auth.uid()

REVOKE INSERT ON puzzle_attempts FROM anon;
REVOKE SELECT ON puzzle_attempts FROM anon;

-- Ensure authenticated role has proper permissions
GRANT INSERT ON puzzle_attempts TO authenticated;
GRANT SELECT ON puzzle_attempts TO authenticated;
GRANT UPDATE ON puzzle_attempts TO authenticated;
GRANT DELETE ON puzzle_attempts TO authenticated;

-- =============================================================================
-- DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION safe_upsert_attempt IS
  'Safely upserts a puzzle attempt with completion protection. '
  'Once an attempt is marked completed=true, it cannot be overwritten by incomplete data. '
  'This prevents data loss from stale devices syncing old incomplete attempts. '
  'Uses ON CONFLICT (user_id, puzzle_id) for deduplication.';

COMMENT ON CONSTRAINT unique_user_puzzle ON puzzle_attempts IS
  'Ensures only one attempt per user per puzzle. '
  'Enables safe UPSERT behavior and prevents duplicate rows.';
