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
import { ParsedPlayer, PlayerSearchResult } from '@/types/database';
import { searchPlayers } from '@/services/player';
import { PlayerResultItem } from './PlayerResultItem';

/** Minimum characters required for search */
const MIN_SEARCH_LENGTH = 3;

/** Debounce delay in milliseconds */
const DEBOUNCE_MS = 200;

export interface PlayerSearchOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Callback when a player is selected */
  onSelectPlayer: (player: ParsedPlayer) => void;
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
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced search
  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search for short queries
    if (query.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce the search
    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchPlayers(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Player search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Handle player selection
  const handleSelectPlayer = useCallback(
    (player: ParsedPlayer) => {
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

  // Render result item
  const renderItem = useCallback(
    ({ item }: { item: PlayerSearchResult }) => (
      <PlayerResultItem
        player={item.player}
        onPress={() => handleSelectPlayer(item.player)}
        testID={`${testID}-result-${item.player.id}`}
      />
    ),
    [handleSelectPlayer, testID]
  );

  // Key extractor
  const keyExtractor = useCallback(
    (item: PlayerSearchResult) => item.player.id,
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
});

export default PlayerSearchOverlay;
