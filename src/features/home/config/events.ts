/**
 * Special Event type definitions.
 *
 * Special events are puzzles with is_special=true in the database.
 * They appear via an EventBanner on the Home Screen instead of
 * in the standard daily feed.
 */

import { Href } from "expo-router";
import { GameMode } from "@/features/puzzles/types/puzzle.types";

export interface SpecialEvent {
  /** Puzzle ID */
  id: string;
  /** Game mode of the special puzzle */
  gameMode: GameMode;
  /** Whether the event is currently active */
  isActive: boolean;
  /** Banner title (from CMS event_title field) */
  title: string;
  /** Banner subtitle (from CMS event_subtitle field) */
  subtitle: string;
  /** Banner tag badge text (from CMS event_tag field) */
  tag: string;
  /** Route to navigate to when banner is pressed */
  route: Href;
  /** Banner color theme */
  theme: 'blue' | 'red' | 'gold';
}
