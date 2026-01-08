import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { ElevatedButton, GlassCard } from '@/components';
import { colors, textStyles, spacing, fonts, fontWeights } from '@/theme';

/**
 * Design Lab Screen
 *
 * Temporary route for showcasing and testing the Design System components.
 * This screen demonstrates all component variations and color combinations.
 */
export default function DesignLabScreen() {
  const handlePress = (name: string) => {
    console.log(`${name} pressed`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Elevated Buttons Section */}
      <Text style={[textStyles.h2, styles.sectionTitle]}>Elevated Buttons</Text>

      <Text style={[textStyles.caption, styles.label]}>Sizes</Text>
      <View style={styles.row}>
        <ElevatedButton
          title="Small"
          onPress={() => handlePress('Small')}
          size="small"
        />
        <ElevatedButton
          title="Medium"
          onPress={() => handlePress('Medium')}
          size="medium"
        />
        <ElevatedButton
          title="Large"
          onPress={() => handlePress('Large')}
          size="large"
        />
      </View>

      <Text style={[textStyles.caption, styles.label]}>Colors</Text>
      <View style={styles.row}>
        <ElevatedButton
          title="Primary"
          onPress={() => handlePress('Primary')}
        />
        <ElevatedButton
          title="Yellow Card"
          onPress={() => handlePress('Yellow')}
          topColor={colors.cardYellow}
          shadowColor="#D4A500"
        />
      </View>
      <View style={styles.row}>
        <ElevatedButton
          title="Red Card"
          onPress={() => handlePress('Red')}
          topColor={colors.redCard}
          shadowColor="#C53030"
        />
        <ElevatedButton
          title="Disabled"
          onPress={() => handlePress('Disabled')}
          disabled
        />
      </View>

      {/* Glass Cards Section */}
      <Text style={[textStyles.h2, styles.sectionTitle]}>Glass Cards</Text>

      <Text style={[textStyles.caption, styles.label]}>Default (10% blur)</Text>
      <GlassCard style={styles.card}>
        <Text style={textStyles.subtitle}>Glass Card</Text>
        <Text style={[textStyles.body, styles.cardBody]}>
          This card has a frosted glass effect with expo-blur.
          The background is semi-transparent with a subtle border.
        </Text>
      </GlassCard>

      <Text style={[textStyles.caption, styles.label]}>Higher blur (20%)</Text>
      <GlassCard intensity={20} style={styles.card}>
        <Text style={textStyles.subtitle}>Intense Blur</Text>
        <Text style={[textStyles.body, styles.cardBody]}>
          This card has more blur intensity for a stronger effect.
        </Text>
      </GlassCard>

      <Text style={[textStyles.caption, styles.label]}>Nested content</Text>
      <GlassCard style={styles.card}>
        <Text style={textStyles.subtitle}>Interactive Card</Text>
        <Text style={[textStyles.bodySmall, styles.cardBody]}>
          Cards can contain interactive elements:
        </Text>
        <View style={styles.cardActions}>
          <ElevatedButton
            title="Action"
            onPress={() => handlePress('Card Action')}
            size="small"
          />
        </View>
      </GlassCard>

      {/* Typography Section */}
      <Text style={[textStyles.h2, styles.sectionTitle]}>Typography</Text>

      <GlassCard style={styles.card}>
        <Text style={textStyles.h1}>Heading 1 - Bebas Neue</Text>
        <Text style={textStyles.h2}>Heading 2 - Bebas Neue</Text>
        <Text style={textStyles.h3}>Heading 3 - Bebas Neue</Text>
        <Text style={textStyles.subtitle}>Subtitle - Inter Bold</Text>
        <Text style={textStyles.body}>Body text - Inter Regular</Text>
        <Text style={textStyles.bodySmall}>Small body - Inter Regular</Text>
        <Text style={textStyles.caption}>Caption - Inter Regular</Text>
      </GlassCard>

      {/* Colors Section */}
      <Text style={[textStyles.h2, styles.sectionTitle]}>Color Palette</Text>

      <View style={styles.colorGrid}>
        <View style={[styles.colorSwatch, { backgroundColor: colors.pitchGreen }]}>
          <Text style={styles.colorLabel}>Pitch Green</Text>
        </View>
        <View style={[styles.colorSwatch, { backgroundColor: colors.grassShadow }]}>
          <Text style={styles.colorLabel}>Grass Shadow</Text>
        </View>
        <View style={[styles.colorSwatch, { backgroundColor: colors.cardYellow }]}>
          <Text style={[styles.colorLabel, { color: colors.stadiumNavy }]}>Card Yellow</Text>
        </View>
        <View style={[styles.colorSwatch, { backgroundColor: colors.redCard }]}>
          <Text style={styles.colorLabel}>Red Card</Text>
        </View>
        <View style={[styles.colorSwatch, { backgroundColor: colors.floodlightWhite }]}>
          <Text style={[styles.colorLabel, { color: colors.stadiumNavy }]}>Floodlight</Text>
        </View>
        <View style={[styles.colorSwatch, styles.navySwatch]}>
          <Text style={styles.colorLabel}>Stadium Navy</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stadiumNavy,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  sectionTitle: {
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardBody: {
    marginTop: spacing.sm,
    opacity: 0.8,
  },
  cardActions: {
    marginTop: spacing.lg,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorSwatch: {
    width: 100,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  navySwatch: {
    backgroundColor: colors.stadiumNavy,
    borderWidth: 2,
    borderColor: colors.floodlightWhite,
  },
  colorLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    fontWeight: fontWeights.semiBold,
    color: colors.floodlightWhite,
    textAlign: 'center',
  },
});
