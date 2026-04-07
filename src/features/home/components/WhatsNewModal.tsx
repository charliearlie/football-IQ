import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { colors, spacing, fonts, borderRadius } from '@/theme';
import { RELEASE_NOTES } from '../constants/releaseNotes';

interface WhatsNewModalProps {
  visible: boolean;
  version: string;
  onDismiss: () => void;
}

export function WhatsNewModal({ visible, version, onDismiss }: WhatsNewModalProps) {
  const release = RELEASE_NOTES[version];
  if (!release) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.springify().damping(20).mass(0.8).stiffness(100)}
          style={styles.card}
        >
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{version}</Text>
          </View>

          <Text style={styles.title}>{release.title}</Text>

          <View style={styles.notesContainer}>
            {release.notes.map((note, i) => (
              <View key={i} style={styles.noteRow}>
                <Text style={styles.bullet}>{note.emoji}</Text>
                <Text style={styles.noteText}>{note.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>LET'S GO</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.stadiumNavy,
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: colors.pitchGreen,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    flexGrow: 0,
  },
  versionBadge: {
    backgroundColor: 'rgba(46, 252, 93, 0.12)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  versionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.pitchGreen,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.headline,
    fontSize: 28,
    color: colors.floodlightWhite,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  notesContainer: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  noteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
  },
  noteText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    backgroundColor: colors.pitchGreen,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: fonts.headline,
    fontSize: 16,
    color: colors.stadiumNavy,
    letterSpacing: 1.5,
  },
});
