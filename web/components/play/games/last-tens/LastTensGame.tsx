"use client";

import type { GameProps } from "@/lib/play/types";
import type { TopTensContent } from "@/lib/top-tens/types";
import { TopTensGame } from "@/components/play/games/top-tens/TopTensGame";

/**
 * Last Tens uses the Top Tens engine end-to-end. This wrapper only
 * threads `variant="last-tens"` so analytics + the share URL match
 * the dedicated Last Tens route.
 */
export function LastTensGame(props: GameProps<TopTensContent>) {
  return <TopTensGame {...props} variant="last-tens" />;
}
