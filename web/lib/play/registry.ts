// web/lib/play/registry.ts
"use client";

import { CareerPathGame } from "@/components/play/CareerPathGame";
import { TransferGuessGame } from "@/components/play/TransferGuessGame";
import { ConnectionsGame } from "@/components/play/ConnectionsGame";
import { TopicalQuizGame } from "@/components/play/TopicalQuizGame";
import { TimelineGame } from "@/components/play/TimelineGame";
import { WhosThatGame } from "@/components/play/games/whos-that/WhosThatGame";
import { HigherLowerGame } from "@/components/play/games/higher-lower/HigherLowerGame";
import { TopTensGame } from "@/components/play/games/top-tens/TopTensGame";
import { WhoAmIGame } from "@/components/play/games/who-am-i/WhoAmIGame";
import { LastTensGame } from "@/components/play/games/last-tens/LastTensGame";
import { CareerPathProGame } from "@/components/play/games/career-path-pro/CareerPathProGame";
import { TheThreadGame } from "@/components/play/games/the-thread/TheThreadGame";

import {
  FALLBACK_CAREER_PUZZLE,
  FALLBACK_TRANSFER_PUZZLE,
  FALLBACK_CONNECTIONS_PUZZLE,
  FALLBACK_QUIZ_PUZZLE,
  FALLBACK_TIMELINE_PUZZLE,
  FALLBACK_WHOS_THAT_PUZZLE,
  FALLBACK_HIGHER_LOWER_PUZZLE,
  FALLBACK_TOP_TENS_PUZZLE,
  FALLBACK_WHO_AM_I_PUZZLE,
  FALLBACK_LAST_TENS_PUZZLE,
  FALLBACK_CAREER_PATH_PRO_PUZZLE,
  FALLBACK_THE_THREAD_PUZZLE,
} from "@/lib/constants";

import type { GameRegistryEntry } from "./types";
import type {
  CareerPathContent,
  TransferGuessContent,
  ConnectionsContent,
  TopicalQuizContent,
  TimelineContent,
  TopTensContent,
  WhoAmIContent,
  TheThreadContent,
} from "@/lib/schemas/puzzle-schemas";
import type { WhosThatContent } from "@/lib/whos-that/types";
import type { HigherLowerContent } from "@/lib/higher-lower/types";

// Use a discriminated entry type so the registry remains typed end-to-end.
export type AnyGameRegistryEntry =
  | GameRegistryEntry<CareerPathContent>
  | GameRegistryEntry<TransferGuessContent>
  | GameRegistryEntry<ConnectionsContent>
  | GameRegistryEntry<TopicalQuizContent>
  | GameRegistryEntry<TimelineContent>
  | GameRegistryEntry<WhosThatContent>
  | GameRegistryEntry<HigherLowerContent>
  | GameRegistryEntry<TopTensContent>
  | GameRegistryEntry<WhoAmIContent>
  | GameRegistryEntry<TheThreadContent>;

export const GAME_REGISTRY: Record<string, AnyGameRegistryEntry> = {
  "career-path": {
    dbMode: "career_path",
    title: "Career Path",
    component: CareerPathGame,
    fallbackContent: FALLBACK_CAREER_PUZZLE as CareerPathContent,
  },
  "transfer-guess": {
    dbMode: "guess_the_transfer",
    title: "Transfer Guess",
    component: TransferGuessGame,
    fallbackContent: FALLBACK_TRANSFER_PUZZLE as TransferGuessContent,
  },
  "connections": {
    dbMode: "connections",
    title: "Connections",
    component: ConnectionsGame,
    fallbackContent: FALLBACK_CONNECTIONS_PUZZLE as ConnectionsContent,
  },
  "topical-quiz": {
    dbMode: "topical_quiz",
    title: "Topical Quiz",
    component: TopicalQuizGame,
    fallbackContent: FALLBACK_QUIZ_PUZZLE as TopicalQuizContent,
  },
  "timeline": {
    dbMode: "timeline",
    title: "Timeline",
    component: TimelineGame,
    fallbackContent: FALLBACK_TIMELINE_PUZZLE as TimelineContent,
  },
  "whos-that": {
    dbMode: "whos-that",
    title: "Who's That?",
    component: WhosThatGame,
    fallbackContent: FALLBACK_WHOS_THAT_PUZZLE as WhosThatContent,
  },
  "higher-lower": {
    dbMode: "higher_lower",
    title: "Higher/Lower",
    component: HigherLowerGame,
    fallbackContent: FALLBACK_HIGHER_LOWER_PUZZLE as HigherLowerContent,
  },
  "top-tens": {
    dbMode: "top_tens",
    title: "Top Tens",
    component: TopTensGame,
    fallbackContent: FALLBACK_TOP_TENS_PUZZLE as TopTensContent,
  },
  "who-am-i": {
    dbMode: "who_am_i",
    title: "Who Am I?",
    component: WhoAmIGame,
    fallbackContent: FALLBACK_WHO_AM_I_PUZZLE as WhoAmIContent,
  },
  "last-tens": {
    dbMode: "last_tens",
    title: "Last 10",
    component: LastTensGame,
    fallbackContent: FALLBACK_LAST_TENS_PUZZLE as TopTensContent,
  },
  "career-path-pro": {
    dbMode: "career_path_pro",
    title: "Career Path Pro",
    component: CareerPathProGame,
    fallbackContent: FALLBACK_CAREER_PATH_PRO_PUZZLE as CareerPathContent,
  },
  "the-thread": {
    dbMode: "the_thread",
    title: "The Thread",
    component: TheThreadGame,
    fallbackContent: FALLBACK_THE_THREAD_PUZZLE as TheThreadContent,
  },
};

export function getGameEntry(slug: string): AnyGameRegistryEntry | null {
  return GAME_REGISTRY[slug] ?? null;
}
