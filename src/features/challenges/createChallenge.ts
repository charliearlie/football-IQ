/**
 * Challenge creation and sharing.
 *
 * Creates a challenge via the web API and returns a shareable URL.
 * Used by all game modes' result modals to add "Challenge a Friend" functionality.
 */

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '@/lib/supabase';

const CHALLENGE_API_URL =
  process.env.EXPO_PUBLIC_WEB_URL
    ? `${process.env.EXPO_PUBLIC_WEB_URL}/api/challenges`
    : 'https://www.football-iq.app/api/challenges';

export interface CreateChallengeInput {
  gameMode: string;
  puzzleId: string;
  puzzleDate?: string;
  score: number;
  scoreDisplay?: string;
  metadata?: Record<string, unknown>;
}

export interface ChallengeResult {
  id: string;
  url: string;
}

/**
 * Create a challenge and get a shareable URL.
 */
export async function createChallenge(
  input: CreateChallengeInput,
): Promise<ChallengeResult | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const response = await fetch(CHALLENGE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengerId: user.id,
        gameMode: input.gameMode,
        puzzleId: input.puzzleId,
        puzzleDate: input.puzzleDate,
        score: input.score,
        scoreDisplay: input.scoreDisplay,
        metadata: input.metadata,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown');
      console.warn(`[Challenges] API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return { id: data.id, url: data.url };
  } catch (error) {
    console.warn('[Challenges] Failed to create challenge:', error);
    return null;
  }
}

/**
 * Share a challenge link with a personalised message.
 */
export async function shareChallenge(
  challengeUrl: string,
  scoreDisplay: string,
  gameModeName: string,
): Promise<{ success: boolean; method: 'share' | 'clipboard' }> {
  const shareText = [
    `I scored ${scoreDisplay} on ${gameModeName}. Can you beat me? 🏆`,
    '',
    challengeUrl,
  ].join('\n');

  if (Platform.OS !== 'web') {
    try {
      const result = await Share.share({ message: shareText });
      if (result.action === Share.sharedAction) {
        return { success: true, method: 'share' };
      }
      return { success: false, method: 'share' };
    } catch {
      // Fall through to clipboard
    }
  }

  try {
    await Clipboard.setStringAsync(shareText);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'clipboard' };
  }
}
