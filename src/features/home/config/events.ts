// Mock configuration for the "Special Event" banner logic.
// In production, this would likely fetch from Supabase/Remote Config.

import { Href } from "expo-router";

export interface SpecialEvent {
  id: string;
  isActive: boolean;
  title: string;
  subtitle: string;
  tag: string;
  route: Href; // Strongly typed route
  theme: 'blue' | 'red' | 'gold';
  startDate: string; // ISO Date
  endDate: string; // ISO Date
}

// Array of special events
export const SPECIAL_EVENTS: SpecialEvent[] = [
  {
    id: "derby-day-001",
    isActive: true,
    title: "DERBY DAY SPECIAL",
    subtitle: "Double XP • Ends in 2h",
    tag: "LIMITED TIME",
    route: "/topical-quiz/derby-day",
    theme: 'blue',
    startDate: new Date().toISOString(), // Started now
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // Ends in 2h
  }
];