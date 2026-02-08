import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  Keyboard,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
  FadeIn,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ElevatedButton, ErrorFlashOverlay } from '@/components';
import { ClubShield } from '@/components/ClubShield';
import { colors, spacing, fonts, fontWeights, borderRadius } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { searchClubsHybrid } from '@/services/club';
import type { UnifiedClub } from '@/services/club';

/** Spring configuration for shake recovery */
const SHAKE_SPRING = {
  damping: 8,
  stiffness: 400,
  mass: 0.3,
};

export interface ClubAutocompleteProps {
  /** Called when user selects a club from the dropdown */
  onSelect: (club: UnifiedClub) => void;
  /** Called when user submits typed text without selecting from dropdown */
  onSubmitText?: (text: string) => void;
  /** Whether to trigger shake animation */
  shouldShake?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when input gains focus */
  onFocus?: () => void;
  /** Test ID prefix */
  testID?: string;
}

/**
 * Club autocomplete input with neubrutalist styling.
 *
 * Display format: [ClubShield] Club Name
 * Shows primary/secondary colors via shield icon.
 */
export function ClubAutocomplete({
  onSelect,
  onSubmitText,
  shouldShake = false,
  disabled = false,
  placeholder = 'Search club...',
  onFocus,
  testID,
}: ClubAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedClub[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const selectedRef = useRef(false);
  const requestTokenRef = useRef(0);
  const shakeX = useSharedValue(0);
  const focusProgress = useSharedValue(0);
  const borderFlash = useSharedValue(0);
  const { triggerLight } = useHaptics();

  // Shake animation + border flash on incorrect guess
  useEffect(() => {
    if (shouldShake) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withSpring(0, SHAKE_SPRING)
      );
      borderFlash.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
      // Clear input after shake
      setQuery('');
      setIsOpen(false);
      selectedRef.current = false;
    }
  }, [shouldShake, shakeX, borderFlash]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Combined border style: error takes priority over focus
  const borderStyle = useAnimatedStyle(() => {
    if (borderFlash.value > 0.01) {
      const borderColor = interpolateColor(
        borderFlash.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.1)', '#EF4444']
      );
      return { borderColor };
    }
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.1)', 'rgba(88, 204, 2, 0.5)']
    );
    return { borderColor };
  });

  const handleInputFocus = useCallback(() => {
    focusProgress.value = withTiming(1, { duration: 200 });
    onFocus?.();
  }, [focusProgress, onFocus]);

  const handleInputBlur = useCallback(() => {
    focusProgress.value = withTiming(0, { duration: 250 });
  }, [focusProgress]);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    selectedRef.current = false;

    if (text.length < 2) {
      requestTokenRef.current++;
      setIsOpen(false);
      setResults([]);
      setIsSearching(false);
      return;
    }

    const token = ++requestTokenRef.current;
    setIsOpen(true);
    setIsSearching(true);

    let callbackCount = 0;
    searchClubsHybrid(text, (newResults) => {
      if (token !== requestTokenRef.current) return;
      callbackCount++;
      setResults(newResults);
      // First callback delivers local results; second delivers remote-merged results.
      // Stop searching when remote completes (2nd call) or won't fire (≥3 local hits).
      if (callbackCount > 1 || newResults.length >= 3) {
        setIsSearching(false);
      }
    });
  }, []);

  const handleSelect = useCallback(
    (club: UnifiedClub) => {
      triggerLight();
      setQuery(club.name);
      setIsOpen(false);
      setResults([]);
      selectedRef.current = true;
      Keyboard.dismiss();
      onSelect(club);
    },
    [onSelect, triggerLight]
  );

  const handleSubmit = useCallback(() => {
    if (!query.trim() || disabled) return;

    if (selectedRef.current) {
      // Already submitted via onSelect -- no-op
      return;
    }
    // User typed without selecting from dropdown -- submit as text
    Keyboard.dismiss();
    onSubmitText?.(query.trim());
  }, [query, disabled, onSubmitText]);

  // Dropdown visibility logic
  const shouldShowDropdown = isOpen && query.length >= 2;
  const showLoading = shouldShowDropdown && isSearching && results.length === 0;
  const showNoResults = shouldShowDropdown && !isSearching && results.length === 0;
  const showResults = shouldShowDropdown && results.length > 0;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.inputRow}>
        <Animated.View style={[styles.inputContainer, shakeStyle, borderStyle]}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleSearch}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            testID={testID ? `${testID}-input` : undefined}
          />
          <ErrorFlashOverlay
            active={shouldShake}
            style={{ borderRadius: borderRadius.xl }}
            testID={testID ? `${testID}-error-flash` : undefined}
          />
        </Animated.View>
        {onSubmitText && (
          <ElevatedButton
            title="Submit"
            onPress={handleSubmit}
            disabled={disabled || !query.trim()}
            size="medium"
            testID={testID ? `${testID}-submit` : undefined}
          />
        )}
      </View>

      {(showResults || showLoading || showNoResults) && (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={styles.dropdown}
          testID={testID ? `${testID}-dropdown` : undefined}
        >
          {Platform.OS !== 'web' && (
            <BlurView
              intensity={15}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          )}

          {showLoading && (
            <View style={styles.hintContainer}>
              <ActivityIndicator size="small" color={colors.pitchGreen} />
            </View>
          )}

          {showNoResults && (
            <View style={styles.hintContainer}>
              <Text style={styles.hintText}>No clubs found</Text>
              <Text style={styles.hintSubtext}>Try a different spelling</Text>
            </View>
          )}

          {showResults && (
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
                  <View style={styles.resultContent}>
                    <View style={styles.shieldContainer}>
                      <ClubShield
                        primaryColor={item.primary_color}
                        secondaryColor={item.secondary_color}
                        size={24}
                      />
                    </View>
                    <View style={styles.resultTextGroup}>
                      <Text style={styles.resultName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.match_type === 'nickname' && (
                        <Text style={styles.resultMeta} numberOfLines={1}>
                          via nickname
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              )}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Animated.View>
      )}
    </View>
  );
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
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.medium,
    fontSize: 16,
    color: colors.floodlightWhite,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    letterSpacing: 0.3,
    textAlignVertical: 'center',
  },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxHeight: 260,
    zIndex: 1000,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  resultsList: {
    padding: spacing.xs,
  },
  resultItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    marginVertical: 2,
  },
  resultItemPressed: {
    backgroundColor: 'rgba(88, 204, 2, 0.12)',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shieldContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextGroup: {
    flex: 1,
  },
  resultName: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    fontSize: 15,
    color: colors.floodlightWhite,
    lineHeight: 20,
  },
  resultMeta: {
    fontFamily: fonts.body,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
    fontStyle: 'italic',
  },
  hintContainer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  hintSubtext: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
