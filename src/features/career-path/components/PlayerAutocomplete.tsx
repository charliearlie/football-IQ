import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ElevatedButton, ErrorFlashOverlay } from '@/components';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { searchPlayersHybrid } from '@/services/player/HybridSearchEngine';
import { countryCodeToEmoji } from '@/services/player/playerUtils';
import { UnifiedPlayer } from '@/services/oracle/types';

/** Spring configuration for shake recovery */
const SHAKE_SPRING = {
  damping: 8,
  stiffness: 400,
  mass: 0.3,
};

export interface PlayerAutocompleteProps {
  /** Called when user selects a player from the dropdown */
  onSelect: (player: UnifiedPlayer) => void;
  /** Called when user submits typed text without selecting from dropdown */
  onSubmitText: (text: string) => void;
  /** Whether to trigger shake animation */
  shouldShake: boolean;
  /** Whether the game is over (disables input) */
  isGameOver: boolean;
  /** Callback when input gains focus */
  onFocus?: () => void;
  /** Test ID prefix */
  testID?: string;
}

/**
 * Player autocomplete input with zero-spoiler display.
 *
 * Display format: [Flag] Name (Position, b. Year)
 * Example: 🇵🇹 Cristiano Ronaldo (Forward, b. 1985)
 */
export function PlayerAutocomplete({
  onSelect,
  onSubmitText,
  shouldShake,
  isGameOver,
  onFocus,
  testID,
}: PlayerAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedPlayer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const selectedRef = useRef(false);
  const shakeX = useSharedValue(0);

  // Shake animation on incorrect guess
  useEffect(() => {
    if (shouldShake) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withSpring(0, SHAKE_SPRING)
      );
      // Clear input after shake
      setQuery('');
      setIsOpen(false);
      selectedRef.current = false;
    }
  }, [shouldShake, shakeX]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    selectedRef.current = false;

    if (text.length < 3) {
      setIsOpen(false);
      setResults([]);
      return;
    }

    setIsOpen(true);
    searchPlayersHybrid(text, (newResults) => {
      setResults(newResults);
    });
  }, []);

  const handleSelect = useCallback(
    (player: UnifiedPlayer) => {
      setQuery(player.name);
      setIsOpen(false);
      setResults([]);
      selectedRef.current = true;
      onSelect(player);
    },
    [onSelect]
  );

  const handleSubmit = useCallback(() => {
    if (!query.trim() || isGameOver) return;

    if (selectedRef.current) {
      // Already submitted via onSelect — no-op
      return;
    }
    // User typed without selecting from dropdown — submit as text
    onSubmitText(query.trim());
  }, [query, isGameOver, onSubmitText]);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.inputRow}>
        <Animated.View style={[styles.inputContainer, shakeStyle]}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
            placeholder="Search player..."
            placeholderTextColor={colors.textSecondary}
            editable={!isGameOver}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onFocus={onFocus}
            testID={testID ? `${testID}-input` : undefined}
          />
          <ErrorFlashOverlay
            active={shouldShake}
            style={{ borderRadius: borderRadius.xl }}
            testID={testID ? `${testID}-error-flash` : undefined}
          />
        </Animated.View>
        <ElevatedButton
          title="Submit"
          onPress={handleSubmit}
          disabled={isGameOver || !query.trim()}
          size="medium"
          testID={testID ? `${testID}-submit` : undefined}
        />
      </View>

      {isOpen && results.length > 0 && (
        <View style={styles.dropdown} testID={testID ? `${testID}-dropdown` : undefined}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.resultItem,
                  pressed && styles.resultItemPressed,
                ]}
                testID={testID ? `${testID}-result-${item.id}` : undefined}
              >
                <Text style={styles.resultText} numberOfLines={1}>
                  {formatPlayerDisplay(item)}
                </Text>
              </Pressable>
            )}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
}

/**
 * Format player for display: [Flag] Name (Position, b. Year)
 */
function formatPlayerDisplay(player: UnifiedPlayer): string {
  const flag = player.nationality_code
    ? countryCodeToEmoji(player.nationality_code)
    : '';

  const meta: string[] = [];
  if (player.position_category) meta.push(player.position_category);
  if (player.birth_year) meta.push(`b. ${player.birth_year}`);

  const suffix = meta.length > 0 ? ` (${meta.join(', ')})` : '';
  return `${flag} ${player.name}${suffix}`.trim();
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBackground,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.headline,
    fontSize: 18,
    color: colors.floodlightWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    letterSpacing: 0.5,
    textAlignVertical: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxHeight: 200,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  resultsList: {
    padding: spacing.xs,
  },
  resultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  resultItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.floodlightWhite,
  },
});
