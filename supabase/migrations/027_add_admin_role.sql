-- =============================================================================
-- Migration: 027_add_admin_role
-- Description: Add is_admin flag to profiles for admin access control.
-- Date: 2026-02-05
-- =============================================================================

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.is_admin IS
  'Whether the user has admin privileges. Controls access to admin routes and features.';

-- Create an index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
