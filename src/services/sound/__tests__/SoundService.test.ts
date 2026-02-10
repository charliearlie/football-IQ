// We need a fresh module for each test to reset the singleton state
let SoundService: typeof import('../SoundService').SoundService;

// Mock AsyncStorage — return 'true' for sound enabled so tests can play sounds
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('true'),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-audio
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockSeekTo = jest.fn();
const mockRelease = jest.fn();

const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);
const mockCreateAudioPlayer = jest.fn().mockReturnValue({
  play: mockPlay,
  pause: mockPause,
  seekTo: mockSeekTo,
  release: mockRelease,
  loop: false,
});

jest.mock('expo-audio', () => ({
  setAudioModeAsync: (...args: unknown[]) => mockSetAudioModeAsync(...args),
  createAudioPlayer: (...args: unknown[]) => mockCreateAudioPlayer(...args),
}));

describe('SoundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-add mock implementations after clearAllMocks
    mockPlay.mockReturnValue(undefined);
    mockPause.mockReturnValue(undefined);
    mockSeekTo.mockReturnValue(undefined);
    mockRelease.mockReturnValue(undefined);
    mockSetAudioModeAsync.mockResolvedValue(undefined);
    mockCreateAudioPlayer.mockReturnValue({
      play: mockPlay,
      pause: mockPause,
      seekTo: mockSeekTo,
      release: mockRelease,
      loop: false,
    });

    // Get a fresh singleton by re-requiring the module
    jest.isolateModules(() => {
      SoundService = require('../SoundService').SoundService;
    });
  });

  describe('init', () => {
    it('configures audio mode', async () => {
      await SoundService.init();
      expect(mockSetAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          playsInSilentMode: false,
          shouldPlayInBackground: false,
        })
      );
    });

    it('creates 3 audio players', async () => {
      await SoundService.init();
      expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(3);
    });

    it('does not re-initialize if already initialized', async () => {
      await SoundService.init();
      await SoundService.init();
      // Should only be called once (3 sounds)
      expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(3);
    });
  });

  describe('playCorrect', () => {
    it('plays the correct sound', async () => {
      await SoundService.init();
      await SoundService.playCorrect();
      expect(mockSeekTo).toHaveBeenCalledWith(0);
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  describe('playWrong', () => {
    it('plays the wrong sound', async () => {
      await SoundService.init();
      await SoundService.playWrong();
      expect(mockSeekTo).toHaveBeenCalledWith(0);
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  describe('playHeartbeat', () => {
    it('sets looping and plays the heartbeat sound', async () => {
      await SoundService.init();
      await SoundService.playHeartbeat();
      expect(mockSeekTo).toHaveBeenCalledWith(0);
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  describe('stopHeartbeat', () => {
    it('stops the heartbeat sound', async () => {
      await SoundService.init();
      await SoundService.stopHeartbeat();
      expect(mockPause).toHaveBeenCalled();
    });
  });

  describe('default muted state', () => {
    it('is muted by default when AsyncStorage returns null', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      let FreshService: typeof SoundService;
      jest.isolateModules(() => {
        FreshService = require('../SoundService').SoundService;
      });

      await FreshService!.init();
      mockPlay.mockClear();
      mockSeekTo.mockClear();
      await FreshService!.playCorrect();
      expect(mockPlay).not.toHaveBeenCalled();
    });
  });

  describe('setMuted', () => {
    it('prevents playback when muted', async () => {
      await SoundService.init();
      SoundService.setMuted(true);
      mockPlay.mockClear();
      mockSeekTo.mockClear();
      await SoundService.playCorrect();
      expect(mockPlay).not.toHaveBeenCalled();
    });

    it('allows playback when unmuted', async () => {
      await SoundService.init();
      SoundService.setMuted(true);
      SoundService.setMuted(false);
      mockPlay.mockClear();
      await SoundService.playCorrect();
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('releases all players', async () => {
      await SoundService.init();
      await SoundService.dispose();
      expect(mockRelease).toHaveBeenCalledTimes(3);
    });
  });
});
