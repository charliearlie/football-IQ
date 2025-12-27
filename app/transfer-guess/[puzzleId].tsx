import { useLocalSearchParams } from 'expo-router';
import { TransferGuessScreen } from '@/features/transfer-guess';

/**
 * Dynamic route for Transfer Guess game with specific puzzle ID.
 * Used for both today's puzzle (from Home) and archive puzzles.
 */
export default function TransferGuessRoute() {
  const { puzzleId } = useLocalSearchParams<{ puzzleId: string }>();

  return <TransferGuessScreen puzzleId={puzzleId} />;
}
