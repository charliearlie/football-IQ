-- =============================================================================
-- Migration: fix_security_definer_views
-- Purpose: Convert SECURITY DEFINER views to SECURITY INVOKER
-- These are admin/data-quality views that should not bypass RLS
-- =============================================================================

ALTER VIEW v_elite_at_obscure_clubs SET (security_invoker = true);
ALTER VIEW v_suspicious_club_assignments SET (security_invoker = true);
ALTER VIEW v_players_no_clubs SET (security_invoker = true);
