/**
 * ModeDetailSheet Component
 *
 * Modal bottom sheet displaying all puzzles for a specific game mode.
 * Includes stats strip, "Surprise Me" shuffle button, and a scrollable
 * puzzle list with per-row play/resume/locked actions.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { X, Lock, Play, Shuffle, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';
import { ElevatedButton } from '@/components/ElevatedButton';
import { GameModeIcon } from '@/components';

import { ArchivePuzzle } from '../types/archive.types';
import { ModeStats } from '../hooks/useModeStats';
import { colors, borderRadius } from '@/theme';
import { triggerLight } from '@/lib/haptics';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ModeDetailSheetProps {
  mode: ModeStats | null;
  visible: boolean;
  onClose: () => void;
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WINDOW_HEIGHT = Dimensions.get('window').height;
const SHEET_MAX_HEIGHT = WINDOW_HEIGHT * 0.85;

// ─── PuzzleDetailRow ─────────────────────────────────────────────────────────

interface PuzzleDetailRowProps {
  puzzle: ArchivePuzzle;
  onPress: () => void;
}

function PuzzleDetailRow({ puzzle, onPress }: PuzzleDetailRowProps) {
  const d = new Date(puzzle.puzzleDate + 'T12:00:00');
  const dateLabel = d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });

  const renderRight = () => {
    if (puzzle.status === 'done') {
      return (
        <View style={rowStyles.rightDone}>
          <Text style={rowStyles.scoreText}>
            {puzzle.score !== undefined ? `${puzzle.score} IQ` : '-- IQ'}
          </Text>
          <Text style={rowStyles.viewText}>VIEW</Text>
        </View>
      );
    }

    if (puzzle.status === 'resume') {
      return (
        <ElevatedButton
          title=""
          onPress={onPress}
          icon={<Play size={18} color={colors.stadiumNavy} fill={colors.stadiumNavy} />}
          topColor="#FACC15"
          shadowColor="#D4A500"
          size="small"
          paddingHorizontal={13}
          paddingVertical={9}
          borderRadius={borderRadius.lg}
          hapticType="light"
          style={rowStyles.actionButton}
        />
      );
    }

    if (!puzzle.isLocked) {
      return (
        <ElevatedButton
          title=""
          onPress={onPress}
          icon={<Play size={18} color={colors.stadiumNavy} fill={colors.stadiumNavy} />}
          topColor="#58CC02"
          shadowColor="#46A302"
          size="small"
          paddingHorizontal={13}
          paddingVertical={9}
          borderRadius={borderRadius.lg}
          hapticType="light"
          style={rowStyles.actionButton}
        />
      );
    }

    // Locked
    return (
      <View style={rowStyles.lockedContainer}>
        <Lock size={16} color="rgba(250,204,21,0.4)" />
      </View>
    );
  };

  const handlePress = () => {
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      testID={`puzzle-row-${puzzle.id}`}
      style={({ pressed }) => [
        rowStyles.row,
        pressed && rowStyles.rowPressed,
      ]}
    >
      {/* Left: date + weekday */}
      <View style={rowStyles.left}>
        <Text style={rowStyles.dateLabel}>{dateLabel}</Text>
        <Text style={rowStyles.weekday}>{weekday}</Text>
      </View>

      {/* Center: spacer */}
      <View style={rowStyles.center} />

      {/* Right: action */}
      <View style={rowStyles.right}>{renderRight()}</View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  left: {
    width: 70,
    justifyContent: 'center',
  },
  dateLabel: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 15,
    color: HOME_COLORS.textMain,
  },
  weekday: {
    fontFamily: HOME_FONTS.body,
    fontSize: 11,
    color: 'rgba(248,250,252,0.5)',
  },
  center: {
    flex: 1,
  },
  right: {
    width: 80,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  rightDone: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 15,
    color: HOME_COLORS.pitchGreen,
  },
  viewText: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    color: colors.textSecondary,
  },
  actionButton: {
    // Override alignSelf so it doesn't stretch
    alignSelf: 'center',
  },
  lockedContainer: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
});

// ─── ModeDetailSheet ─────────────────────────────────────────────────────────

export function ModeDetailSheet({
  mode,
  visible,
  onClose,
  onPuzzlePress,
}: ModeDetailSheetProps) {
  if (!mode) {
    return null;
  }

  return (
    <ModeDetailSheetInner
      mode={mode}
      visible={visible}
      onClose={onClose}
      onPuzzlePress={onPuzzlePress}
    />
  );
}

// Inner component receives guaranteed non-null mode so hooks are called
// unconditionally (rules of hooks compliance).
interface InnerProps {
  mode: ModeStats;
  visible: boolean;
  onClose: () => void;
  onPuzzlePress: (puzzle: ArchivePuzzle) => void;
}

function ModeDetailSheetInner({ mode, visible, onClose, onPuzzlePress }: InnerProps) {
  const insets = useSafeAreaInsets();

  // ── Surprise Me: 70/30 split between free and locked unplayed puzzles ─────
  const unplayedFree = useMemo(
    () => mode.puzzles.filter((p) => !p.isLocked && p.status !== 'done'),
    [mode.puzzles]
  );

  const unplayedLocked = useMemo(
    () => mode.puzzles.filter((p) => p.isLocked && p.status !== 'done'),
    [mode.puzzles]
  );

  const hasSurpriseContent = unplayedFree.length > 0 || unplayedLocked.length > 0;

  const handleSurpriseMe = useCallback(() => {
    if (!hasSurpriseContent) return;
    void triggerLight();

    // 70% free, 30% locked. Falls back if one pool is empty.
    const pickFromLocked =
      unplayedLocked.length > 0 &&
      (unplayedFree.length === 0 || Math.random() < 0.3);

    const pool = pickFromLocked ? unplayedLocked : unplayedFree;
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool[idx];

    // Parent's onPuzzlePress wrapper handles closing this sheet and
    // sequencing the next modal to avoid simultaneous modal transitions.
    onPuzzlePress(picked);
  }, [unplayedFree, unplayedLocked, hasSurpriseContent, onPuzzlePress]);

  // ── Row renderer ──────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ArchivePuzzle }) => (
      <PuzzleDetailRow
        puzzle={item}
        onPress={() => onPuzzlePress(item)}
      />
    ),
    [onPuzzlePress]
  );

  const keyExtractor = useCallback((item: ArchivePuzzle) => item.id, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dark overlay — plain View; Modal slide animation handles entrance */}
      <View style={styles.overlay}>
        {/* Bottom-anchored sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={styles.headerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={24} color="rgba(248,250,252,0.7)" />
            </Pressable>

            <View style={styles.headerIconWrap}>
              <GameModeIcon gameMode={mode.gameMode} size={32} />
            </View>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {mode.title}
            </Text>

            <Pressable
              onPress={onClose}
              style={styles.headerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={24} color="rgba(248,250,252,0.7)" />
            </Pressable>
          </View>

          {/* ── Stats strip ── */}
          <View style={styles.statsStrip}>
            <View style={styles.statPill}>
              <Text style={styles.statBigNumber}>{mode.playedCount}</Text>
              <Text style={styles.statLabel}>PLAYED</Text>
              <Text style={styles.statSub}>of {mode.totalCount}</Text>
            </View>
          </View>

          {/* ── Surprise Me button ── */}
          <View style={styles.surpriseWrap}>
            <ElevatedButton
              title="SURPRISE ME"
              onPress={handleSurpriseMe}
              icon={<Shuffle size={18} color={colors.stadiumNavy} />}
              topColor={HOME_COLORS.pitchGreen}
              shadowColor={HOME_COLORS.grassShadow}
              size="small"
              fullWidth
              disabled={!hasSurpriseContent}
              borderRadius={borderRadius.lg}
              hapticType="medium"
              testID="surprise-me-button"
            />
          </View>

          {/* ── Separator ── */}
          <View style={styles.separator} />

          {/* ── Puzzle list ── */}
          <FlashList
            data={mode.puzzles}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={64}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SHEET_MAX_HEIGHT,
    overflow: 'hidden',
  },
  // Drag indicator
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerButton: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrap: {
    marginRight: 8,
  },
  headerTitle: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 22,
    color: HOME_COLORS.textMain,
    letterSpacing: 0.5,
    flex: 1,
  },
  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    alignItems: 'center',
  },
  statBigNumber: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 20,
    color: HOME_COLORS.textMain,
  },
  statLabel: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 10,
    color: 'rgba(248,250,252,0.5)',
    letterSpacing: 0.5,
  },
  statSub: {
    fontFamily: HOME_FONTS.body,
    fontSize: 10,
    color: 'rgba(248,250,252,0.3)',
  },
  // Surprise Me
  surpriseWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  // Separator between button and list
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
