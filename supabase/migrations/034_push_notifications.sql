-- Push Notifications Infrastructure
-- Stores device push tokens and notification history

-- Push tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token)
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can insert own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Sent notifications history table
CREATE TABLE sent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_count INTEGER DEFAULT 0
);

ALTER TABLE sent_notifications ENABLE ROW LEVEL SECURITY;
