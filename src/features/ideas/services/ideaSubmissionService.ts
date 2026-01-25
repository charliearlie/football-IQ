/**
 * Idea Submission Service
 *
 * Handles submission of game ideas to Supabase.
 */

import { supabase } from '@/lib/supabase';
import type { SubmitIdeaPayload, SubmitIdeaResult } from '../types/idea.types';

/**
 * Submit a game idea to Supabase.
 *
 * @param payload - Idea details (title, description, optional email)
 * @returns Result with success status and submission ID or error
 */
export async function submitIdea(payload: SubmitIdeaPayload): Promise<SubmitIdeaResult> {
  try {
    // Get current user (may be null for anonymous users)
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id ?? null;

    const { data, error } = await supabase
      .from('game_submissions')
      .insert({
        user_id: userId,
        title: payload.title.trim(),
        description: payload.description.trim(),
        email: payload.email?.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[IdeaService] Insert failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      submissionId: data.id,
    };
  } catch (err) {
    console.error('[IdeaService] Unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error occurred',
    };
  }
}
