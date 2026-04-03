/**
 * useChallenge hook
 *
 * Provides challenge creation and sharing for game result modals.
 * Usage:
 *   const { challengeState, createAndShare } = useChallenge();
 *   <Button onPress={() => createAndShare({ gameMode, puzzleId, score, ... })} />
 */

import { useState, useCallback } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  createChallenge,
  shareChallenge,
  type CreateChallengeInput,
} from './createChallenge';

export type ChallengeState = 'idle' | 'creating' | 'sharing' | 'shared' | 'error';

export function useChallenge() {
  const [challengeState, setChallengeState] = useState<ChallengeState>('idle');
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const { capture } = useAnalytics();

  const createAndShare = useCallback(
    async (input: CreateChallengeInput & { gameModeName: string }) => {
      setChallengeState('creating');

      const result = await createChallenge(input);

      if (!result) {
        setChallengeState('error');
        // Reset after 2 seconds so they can try again
        setTimeout(() => setChallengeState('idle'), 2000);
        return;
      }

      setChallengeUrl(result.url);
      setChallengeState('sharing');

      const shareResult = await shareChallenge(
        result.url,
        input.scoreDisplay ?? String(input.score),
        input.gameModeName,
      );

      if (shareResult.success) {
        setChallengeState('shared');
        capture('challenge_created', {
          game_mode: input.gameMode,
          share_method: shareResult.method,
        });
      } else {
        setChallengeState('idle');
      }
    },
    [capture],
  );

  const reset = useCallback(() => {
    setChallengeState('idle');
    setChallengeUrl(null);
  }, []);

  return {
    challengeState,
    challengeUrl,
    createAndShare,
    reset,
  };
}
