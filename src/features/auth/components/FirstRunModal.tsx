/**
 * FirstRunModal Component
 *
 * Full-screen modal wrapper for the onboarding briefing experience.
 * Displays BriefingScreen in a non-dismissible modal on first app launch.
 */

import { Modal } from 'react-native';
import { BriefingScreen } from './BriefingScreen';

export interface FirstRunModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when user submits their display name */
  onSubmit: (displayName: string) => Promise<void>;
  /** External error message to display (e.g., from failed submission) */
  error?: string | null;
  /** Test ID for testing */
  testID?: string;
}

/**
 * FirstRunModal - Full-screen onboarding modal
 *
 * Wraps BriefingScreen in a non-dismissible full-screen modal.
 * Uses slide animation for a smooth entrance.
 */
export function FirstRunModal({ visible, onSubmit, error, testID }: FirstRunModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      testID={testID}
    >
      <BriefingScreen
        onSubmit={onSubmit}
        externalError={error}
        testID={testID ? `${testID}-content` : undefined}
      />
    </Modal>
  );
}
