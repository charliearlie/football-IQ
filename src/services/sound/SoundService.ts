/**
 * SoundService - Football-themed audio for game interactions.
 *
 * Provides percussive soundscape using expo-av:
 * - Correct: Ball-hitting-net thwack
 * - Wrong: Referee's whistle double-blow
 * - Heartbeat: Rhythmic low-frequency loop for time-pressure modes
 *
 * Singleton pattern — call init() on app startup, then use play methods.
 * Sound assets in assets/sounds/ (replace placeholders with real SFX).
 */

import { Audio, AVPlaybackSource } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SoundName = 'correct' | 'wrong' | 'heartbeat';

/** AsyncStorage key matching the dev menu toggle in SettingsScreen */
const SOUND_DEV_ENABLED_KEY = '@sound_dev_enabled';

class SoundServiceClass {
  private sounds: Map<SoundName, Audio.Sound> = new Map();
  private initialized = false;
  private muted = true; // OFF by default — enabled via developer menu

  /**
   * Initialize the sound system. Call once on app startup.
   * Configures audio session and preloads all sound assets.
   * Sound files are loaded lazily here (not at module scope) to avoid
   * runtime errors if assets can't be resolved during import.
   *
   * Sound is muted by default. Only unmuted when the developer menu
   * toggle (@sound_dev_enabled) is set to 'true'.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Check developer toggle — sound stays muted unless explicitly enabled
    const enabled = await AsyncStorage.getItem(SOUND_DEV_ENABLED_KEY);
    this.muted = enabled !== 'true';

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    /* eslint-disable @typescript-eslint/no-var-requires */
    const soundFiles: Record<SoundName, AVPlaybackSource> = {
      correct: require('../../../assets/sounds/correct.mp3'),
      wrong: require('../../../assets/sounds/wrong.mp3'),
      heartbeat: require('../../../assets/sounds/heartbeat.mp3'),
    };
    /* eslint-enable @typescript-eslint/no-var-requires */

    const entries = Object.entries(soundFiles) as [SoundName, AVPlaybackSource][];
    for (const [name, source] of entries) {
      const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
      this.sounds.set(name, sound);
    }

    this.initialized = true;
  }

  /** Play the "correct answer" thwack sound. */
  async playCorrect(): Promise<void> {
    await this.play('correct');
  }

  /** Play the "wrong answer" whistle sound. */
  async playWrong(): Promise<void> {
    await this.play('wrong');
  }

  /** Start looping the heartbeat sound for time-pressure modes. */
  async playHeartbeat(): Promise<void> {
    const sound = this.sounds.get('heartbeat');
    if (!sound || this.muted) return;
    await sound.setIsLoopingAsync(true);
    await sound.setPositionAsync(0);
    await sound.playAsync();
  }

  /** Stop the looping heartbeat sound. */
  async stopHeartbeat(): Promise<void> {
    const sound = this.sounds.get('heartbeat');
    if (!sound) return;
    await sound.stopAsync();
  }

  /** Toggle mute state. When muted, all play methods are no-ops. */
  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Play a one-shot sound by name. */
  private async play(name: SoundName): Promise<void> {
    const sound = this.sounds.get(name);
    if (!sound || this.muted) return;
    await sound.setPositionAsync(0);
    await sound.playAsync();
  }

  /** Unload all sounds and reset state. */
  async dispose(): Promise<void> {
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
    this.initialized = false;
  }
}

export const SoundService = new SoundServiceClass();
