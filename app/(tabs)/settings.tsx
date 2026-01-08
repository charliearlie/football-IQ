/**
 * Settings Tab Screen
 *
 * Tab screen wrapper for the Settings feature.
 * Provides access to Privacy Policy, Terms of Service, and Rate App.
 */

import { SettingsScreen } from '@/features/settings';

export default function SettingsTab() {
  return <SettingsScreen testID="settings" />;
}
