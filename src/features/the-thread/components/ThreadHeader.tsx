import { View, Text, StyleSheet } from "react-native";
import { spacing, fonts } from "@/theme";
import { getThreadTheme, LAYOUT } from "../constants/timeline";
import type { ThreadType } from "../types/theThread.types";

export interface ThreadHeaderProps {
  /** Thread type determines theme color and content */
  threadType: ThreadType;
  /** Test ID prefix */
  testID?: string;
}

/**
 * ThreadHeader - Section header showing emoji and thread type label.
 *
 * - Sponsor: 🤝 Kit Sponsors
 * - Supplier: 🧵 Kit Suppliers
 */
export function ThreadHeader({ threadType, testID }: ThreadHeaderProps) {
  const theme = getThreadTheme(threadType);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{theme.emoji}</Text>
      <Text
        style={[styles.label, { color: theme.color }]}
        testID={testID ? `${testID}-header` : undefined}
      >
        {theme.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: LAYOUT.headerSectionHeight,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontFamily: fonts.headline,
    fontSize: 20,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
