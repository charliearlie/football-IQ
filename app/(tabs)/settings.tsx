/**
 * Settings Tab Screen
 *
 * Tab screen wrapper for the Settings feature.
 * Provides access to Privacy Policy, Terms of Service, and Rate App.
 */

import { SettingsScreen } from '@/features/settings';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';

export default function SettingsTab() {
  return (
    <TabScreenWrapper>
      <SettingsScreen testID="settings" />
    </TabScreenWrapper>
  );
}
