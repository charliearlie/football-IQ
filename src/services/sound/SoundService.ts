/**
 * SoundService - Football-themed audio for game interactions.
 *
 * Provides percussive soundscape using expo-audio:
 * - Correct: Ball-hitting-net thwack
 * - Wrong: Referee's whistle double-blow
 * - Heartbeat: Rhythmic low-frequency loop for time-pressure modes
 *
 * Singleton pattern — call init() on app startup, then use play methods.
 * Sound assets in assets/sounds/ (replace placeholders with real SFX).
 */

import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SoundName = 'correct' | 'wrong' | 'heartbeat';

/** AsyncStorage key matching the dev menu toggle in SettingsScreen */
const SOUND_DEV_ENABLED_KEY = '@sound_dev_enabled';

class SoundServiceClass {
  private players: Map<SoundName, AudioPlayer> = new Map();
  private initialized = false;
  private muted = true; // OFF by default — enabled via developer menu

  /**
   * Initialize the sound system. Call once on app startup.
   * Configures audio session and preloads all sound assets.
   *
   * Sound is muted by default. Only unmuted when the developer menu
   * toggle (@sound_dev_enabled) is set to 'true'.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Check developer toggle — sound stays muted unless explicitly enabled
    const enabled = await AsyncStorage.getItem(SOUND_DEV_ENABLED_KEY);
    this.muted = enabled !== 'true';

    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
    });

    /* eslint-disable @typescript-eslint/no-var-requires */
    const soundFiles: Record<SoundName, number> = {
      correct: require('../../../assets/sounds/correct.mp3'),
      wrong: require('../../../assets/sounds/wrong.mp3'),
      heartbeat: require('../../../assets/sounds/heartbeat.mp3'),
    };
    /* eslint-enable @typescript-eslint/no-var-requires */

    const entries = Object.entries(soundFiles) as [SoundName, number][];
    for (const [name, source] of entries) {
      const player = createAudioPlayer(source);
      this.players.set(name, player);
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
    const player = this.players.get('heartbeat');
    if (!player || this.muted) return;
    player.loop = true;
    player.seekTo(0);
    player.play();
  }

  /** Stop the looping heartbeat sound. */
  async stopHeartbeat(): Promise<void> {
    const player = this.players.get('heartbeat');
    if (!player) return;
    player.pause();
    player.loop = false;
  }

  /** Toggle mute state. When muted, all play methods are no-ops. */
  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /** Play a one-shot sound by name. */
  private async play(name: SoundName): Promise<void> {
    const player = this.players.get(name);
    if (!player || this.muted) return;
    player.seekTo(0);
    player.play();
  }

  /** Release all players and reset state. */
  async dispose(): Promise<void> {
    for (const player of this.players.values()) {
      player.release();
    }
    this.players.clear();
    this.initialized = false;
  }
}

export const SoundService = new SoundServiceClass();
