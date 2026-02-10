-- Add unique constraint on (user_id, platform) to push_tokens.
-- This enables atomic upsert by user+platform instead of delete-then-insert,
-- preventing orphaned tokens if the insert fails after a delete.

-- First, deduplicate any existing rows: keep only the most recently updated
-- token per (user_id, platform) pair before adding the constraint.
DELETE FROM push_tokens
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, platform) id
  FROM push_tokens
  ORDER BY user_id, platform, updated_at DESC
);

ALTER TABLE push_tokens
  ADD CONSTRAINT push_tokens_user_id_platform_key UNIQUE (user_id, platform);
