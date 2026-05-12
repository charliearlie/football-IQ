"use client";

import type { GameProps } from "@/lib/play/types";
import type { CareerPathContent } from "@/lib/schemas/puzzle-schemas";
import { CareerPathGame } from "@/components/play/CareerPathGame";

/**
 * Career Path Pro uses the Career Path engine end-to-end with a longer
 * chain. This wrapper threads `variant="career-path-pro"` so analytics
 * + the share URL match the dedicated Pro route.
 */
export function CareerPathProGame(props: GameProps<CareerPathContent>) {
  return <CareerPathGame {...props} variant="career-path-pro" />;
}
