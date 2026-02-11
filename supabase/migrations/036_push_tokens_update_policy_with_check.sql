-- Add explicit WITH CHECK clause to push_tokens UPDATE policy
--
-- PostgreSQL already uses the USING expression as an implicit WITH CHECK
-- when no WITH CHECK is specified, so this is not fixing a security hole.
-- However, making it explicit improves readability and makes the security
-- intent self-documenting.

DROP POLICY "Users can update own tokens" ON push_tokens;

CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
