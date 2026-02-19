/**
 * TimelineList Component
 *
 * Wraps react-native-draggable-flatlist for the Timeline game.
 * Renders cards with drag-to-reorder functionality and locked state support.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { TimelineCard } from './TimelineCard';
import { spacing } from '@/theme';
import type { TimelineEvent, RevealPhase } from '../types/timeline.types';

export interface TimelineListProps {
  events: TimelineEvent[];
  lockedIndices: Set<number>;
  lastAttemptResults: boolean[];
  revealPhase: RevealPhase;
  onReorder: (from: number, to: number) => void;
  disabled: boolean;
  gameOver: boolean;
  testID?: string;
}

/**
 * TimelineList - Draggable list of timeline events.
 */
export function TimelineList({
  events,
  lockedIndices,
  lastAttemptResults,
  revealPhase,
  onReorder,
  disabled,
  gameOver,
  testID,
}: TimelineListProps) {
  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<TimelineEvent>) => {
    const index = getIndex();
    if (index === undefined) return null;

    const isLocked = lockedIndices.has(index);
    const isRevealing = revealPhase === 'revealing';
    const isCorrect = lastAttemptResults[index] ?? null;
    const showYear = gameOver;

    return (
      <ScaleDecorator>
        <TimelineCard
          event={item}
          index={index}
          isLocked={isLocked}
          isRevealing={isRevealing}
          isCorrect={isCorrect}
          isDragging={isActive}
          showYear={showYear}
          drag={!isLocked && !disabled ? drag : undefined}
          testID={testID ? `${testID}-card-${index}` : undefined}
        />
      </ScaleDecorator>
    );
  };

  const handleDragEnd = ({ from, to }: { from: number; to: number }) => {
    // Check if either position is locked
    if (lockedIndices.has(from) || lockedIndices.has(to)) {
      return;
    }

    onReorder(from, to);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <DraggableFlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.text}-${index}`}
        onDragEnd={handleDragEnd}
        activationDistance={10}
        containerStyle={styles.flatListContainer}
        contentContainerStyle={styles.contentContainer}
        testID={testID}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
