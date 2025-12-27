import { CareerPathScreen } from '@/features/career-path';

/**
 * Static route for Career Path - uses today's puzzle.
 * Fallback when no puzzleId is provided.
 */
export default function CareerPathIndexRoute() {
  return <CareerPathScreen />;
}
