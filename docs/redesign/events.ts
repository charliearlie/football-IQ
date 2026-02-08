// Mock configuration for the "Special Event" banner logic.
// In production, this would likely fetch from Supabase/Remote Config.

import { Href } from "expo-router";

export interface SpecialEvent {
  id: string;
  isActive: boolean;
  title: string;
  subtitle: string;
  tag: string;
  route: Href<string>; // Strongly typed route
  theme: 'blue' | 'red' | 'gold';
  expiresAt: string; // ISO Date
}

export const CURRENT_EVENT: SpecialEvent = {
  id: "derby-day-001",
  isActive: true, // Toggle this to test visibility
  title: "DERBY DAY SPECIAL",
  subtitle: "Double XP • Ends in 2h",
  tag: "LIMITED TIME",
  route: "/topical-quiz/derby-day", // Example route
  theme: 'blue',
  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
};

export const useSpecialEvent = () => {
  // Simple hook to simulate data fetching
  const now = new Date();
  const eventDate = new Date(CURRENT_EVENT.expiresAt);
  
  if (!CURRENT_EVENT.isActive || now > eventDate) {
    return null;
  }
  
  return CURRENT_EVENT;
};