import { View, FlatList, StyleSheet } from "react-native";
import { spacing, layout } from "@/theme";
import { BrandNode } from "./BrandNode";
import { ThreadAxis } from "./ThreadAxis";
import { ThreadHeader } from "./ThreadHeader";
import { getTimelineConfig } from "../constants/timeline";
import type { ThreadBrand, ThreadType, ThreadGameStatus } from "../types/theThread.types";

const config = getTimelineConfig();

export interface LaundryLineProps {
  /** Chronological list of brands */
  brands: ThreadBrand[];
  /** Thread type determines color theme */
  threadType: ThreadType;
  /** Current game status for reveal animation */
  gameStatus: ThreadGameStatus;
  /** Per-brand visibility (maps to brands by index) */
  brandVisibility?: boolean[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * LaundryLine - Vertical timeline displaying kit sponsor/supplier history.
 *
 * The timeline shows all brands upfront (this is the puzzle - user guesses the club).
 * On game end (won/revealed), the dashed line becomes solid with a glow animation.
 *
 * Layout:
 * - ThreadHeader: Emoji + label ("🧵 Kit Suppliers" or "🤝 Kit Sponsors")
 * - ThreadAxis: Vertical dashed line (absolute positioned)
 * - BrandNode × N: Timeline entries with node, years, brand name
 */
export function LaundryLine({
  brands,
  threadType,
  gameStatus,
  brandVisibility,
  testID,
}: LaundryLineProps) {
  const renderBrandNode = ({ item, index }: { item: ThreadBrand; index: number }) => (
    <BrandNode
      brand={item}
      index={index}
      threadType={threadType}
      gameStatus={gameStatus}
      visible={brandVisibility ? brandVisibility[index] : true}
      testID={testID ? `${testID}-node-${index}` : undefined}
    />
  );

  const renderHeader = () => (
    <ThreadHeader threadType={threadType} testID={testID} />
  );

  return (
    <View style={styles.container} testID={testID}>
      {/* Vertical axis line (absolute positioned behind nodes) */}
      <ThreadAxis
        nodeCount={brands.length}
        threadType={threadType}
        gameStatus={gameStatus}
        testID={testID ? `${testID}-axis` : undefined}
      />

      {/* Brand nodes list */}
      <FlatList
        data={brands}
        keyExtractor={(item, index) => `${item.brand_name}-${index}`}
        renderItem={renderBrandNode}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Parent ScrollView handles scrolling
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  listContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
  },
});
