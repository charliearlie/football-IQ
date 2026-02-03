/**
 * PlayerSearchOverlay Component
 *
 * Modal overlay for searching and selecting players from the local database.
 * Features:
 * - Debounced search input (200ms)
 * - "Keep typing..." hint for short queries (0-2 chars)
 * - FlatList results for 3+ char queries
 * - Loading state support for future API integration
 * - Auto-close on player selection
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Animated, { SlideInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { X, Search } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { colors, fonts, spacing, borderRadius, textStyles } from '@/theme';
import { searchPlayersHybrid } from '@/services/player/HybridSearchEngine';
import { UnifiedPlayer } from '@/services/oracle/types';
import { FlagIcon } from '@/components/FlagIcon';

/** Minimum characters required for search */
const MIN_SEARCH_LENGTH = 3;

export interface PlayerSearchOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback when a player is selected */
  onSelectPlayer: (player: UnifiedPlayer) => void;
  /** Callback when overlay is closed */
  onClose: () => void;
  /** Optional title for the overlay */
  title?: string;
  /** Whether search is loading (for future API integration) */
  isLoading?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * PlayerSearchOverlay
 *
 * A modal overlay that provides player search functionality.
 * Searches the local SQLite database with debounced queries.
 *
 * @example
 * ```tsx
 * <PlayerSearchOverlay
 *   visible={showSearch}
 *   onSelectPlayer={(player) => handleSelection(player)}
 *   onClose={() => setShowSearch(false)}
 *   title="Search Players"
 * />
 * ```
 */
export function PlayerSearchOverlay({
  visible,
  onSelectPlayer,
  onClose,
  title = 'Search Players',
  isLoading: externalLoading = false,
  testID,
}: PlayerSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedPlayer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const requestTokenRef = useRef(0);

  // Combined loading state
  const isLoading = isSearching || externalLoading;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      // Focus input after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  // Hybrid search (local Elite Index + Oracle fallback)
  useEffect(() => {
    if (query.length < MIN_SEARCH_LENGTH) {
      requestTokenRef.current++;
      setResults([]);
      setIsSearching(false);
      return;
    }

    const token = ++requestTokenRef.current;
    setIsSearching(true);

    let callbackCount = 0;
    searchPlayersHybrid(query, (newResults) => {
      if (token !== requestTokenRef.current) return;
      callbackCount++;
      setResults(newResults);
      if (callbackCount > 1 || newResults.length >= 3) {
        setIsSearching(false);
      }
    });
  }, [query]);

  // Handle player selection
  const handleSelectPlayer = useCallback(
    (player: UnifiedPlayer) => {
      onSelectPlayer(player);
      // Auto-close handled by parent
    },
    [onSelectPlayer]
  );

  // Handle close
  const handleClose = useCallback(() => {
    setQuery('');
    setResults([]);
    onClose();
  }, [onClose]);

  // Render empty state based on query length
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer} testID={`${testID}-loading`}>
          <ActivityIndicator size="large" color={colors.pitchGreen} />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      );
    }

    if (query.length < MIN_SEARCH_LENGTH) {
      return (
        <View style={styles.emptyContainer} testID={`${testID}-hint`}>
          <Search size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Keep typing...</Text>
          <Text style={styles.emptyHint}>
            Enter at least {MIN_SEARCH_LENGTH} characters to search
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer} testID={`${testID}-no-results`}>
        <Text style={styles.emptyText}>No players found</Text>
        <Text style={styles.emptyHint}>Try a different search term</Text>
      </View>
    );
  };

  // Render result item (zero-spoiler: flag, name, position, birth year)
  const renderItem = useCallback(
    ({ item }: { item: UnifiedPlayer }) => {
      const meta = getPlayerMeta(item);
      return (
        <Pressable
          onPress={() => handleSelectPlayer(item)}
          style={({ pressed }) => [styles.resultItem, pressed && styles.resultItemPressed]}
          testID={`${testID}-result-${item.id}`}
        >
          <View style={styles.resultContent}>
            {item.nationality_code ? (
              <View style={styles.resultFlag}>
                <FlagIcon code={item.nationality_code} size={16} />
              </View>
            ) : null}
            <View style={styles.resultTextGroup}>
              <Text style={styles.resultName} numberOfLines={1}>
                {item.name}
              </Text>
              {meta ? (
                <Text style={styles.resultMeta} numberOfLines={1}>
                  {meta}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      );
    },
    [handleSelectPlayer, testID]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: UnifiedPlayer) => item.id,
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
      testID={testID}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(15).stiffness(100)}
          style={styles.modalContainer}
        >
          <GlassCard style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                testID={`${testID}-close`}
              >
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.inputContainer}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by player name..."
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="search"
                testID={`${testID}-input`}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Results List */}
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              testID={`${testID}-results`}
            />
          </GlassCard>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    maxHeight: '80%',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  modal: {
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 24,
    color: colors.floodlightWhite,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.floodlightWhite,
    paddingVertical: spacing.sm,
  },
  list: {
    flexGrow: 0,
    maxHeight: 400,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyHint: {
    ...textStyles.caption,
    textAlign: 'center',
  },
  resultItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  resultItemPressed: {
    backgroundColor: 'rgba(88, 204, 2, 0.12)',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultFlag: {
    width: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  resultTextGroup: {
    flex: 1,
  },
  resultName: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    lineHeight: 22,
  },
  resultMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
});

/** Build metadata string: "Position, b. Year" */
function getPlayerMeta(player: UnifiedPlayer): string {
  const parts: string[] = [];
  if (player.position_category) parts.push(player.position_category);
  if (player.birth_year) parts.push(`b. ${player.birth_year}`);
  return parts.join(', ');
}

export default PlayerSearchOverlay;
