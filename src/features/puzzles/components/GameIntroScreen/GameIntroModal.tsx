/**
 * Game Intro Modal Component
 *
 * Modal wrapper for GameIntroScreen, used by the help button.
 * Opens rules in a full-screen modal without losing game state.
 */

import { Modal, Keyboard } from 'react-native';
import { GameMode } from '../../types/puzzle.types';
import { GameIntroScreen } from './GameIntroScreen';
import { useHaptics } from '@/hooks';
import { useEffect } from 'react';

interface GameIntroModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Game mode to show rules for */
  gameMode: GameMode;
  /** Callback when user closes the modal */
  onClose: () => void;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Modal wrapper for GameIntroScreen used by help button
 */
export function GameIntroModal({
  visible,
  gameMode,
  onClose,
  testID,
}: GameIntroModalProps) {
  const { triggerSelection } = useHaptics();

  // Dismiss keyboard when modal opens
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      triggerSelection();
    }
  }, [visible, triggerSelection]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      testID={testID}
    >
      <GameIntroScreen
        gameMode={gameMode}
        onStart={onClose}
        buttonText="Got It"
        isModal
        testID={testID ? `${testID}-content` : undefined}
      />
    </Modal>
  );
}
