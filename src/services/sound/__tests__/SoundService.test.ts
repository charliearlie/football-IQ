// We need a fresh module for each test to reset the singleton state
let SoundService: typeof import('../SoundService').SoundService;

// Mock AsyncStorage — return 'true' for sound enabled so tests can play sounds
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue('true'),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-av
const mockPlayAsync = jest.fn().mockResolvedValue({});
const mockStopAsync = jest.fn().mockResolvedValue({});
const mockSetPositionAsync = jest.fn().mockResolvedValue({});
const mockSetIsLoopingAsync = jest.fn().mockResolvedValue({});
const mockUnloadAsync = jest.fn().mockResolvedValue({});

const mockSoundInstance = {
  playAsync: mockPlayAsync,
  stopAsync: mockStopAsync,
  setPositionAsync: mockSetPositionAsync,
  setIsLoopingAsync: mockSetIsLoopingAsync,
  unloadAsync: mockUnloadAsync,
};

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: mockSoundInstance }),
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Audio: MockAudio } = require('expo-av') as { Audio: { setAudioModeAsync: jest.Mock; Sound: { createAsync: jest.Mock } } };

describe('SoundService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-add mock implementations after clearAllMocks
    mockPlayAsync.mockResolvedValue({});
    mockStopAsync.mockResolvedValue({});
    mockSetPositionAsync.mockResolvedValue({});
    mockSetIsLoopingAsync.mockResolvedValue({});
    mockUnloadAsync.mockResolvedValue({});
    MockAudio.setAudioModeAsync.mockResolvedValue(undefined);
    MockAudio.Sound.createAsync.mockResolvedValue({ sound: mockSoundInstance });

    // Get a fresh singleton by re-requiring the module
    jest.isolateModules(() => {
      SoundService = require('../SoundService').SoundService;
    });
  });

  describe('init', () => {
    it('configures audio mode', async () => {
      await SoundService.init();
      expect(MockAudio.setAudioModeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          playsInSilentModeIOS: false,
          staysActiveInBackground: false,
        })
      );
    });

    it('preloads 3 sounds', async () => {
      await SoundService.init();
      expect(MockAudio.Sound.createAsync).toHaveBeenCalledTimes(3);
    });

    it('does not re-initialize if already initialized', async () => {
      await SoundService.init();
      await SoundService.init();
      // Should only be called once (3 sounds)
      expect(MockAudio.Sound.createAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('playCorrect', () => {
    it('plays the correct sound', async () => {
      await SoundService.init();
      await SoundService.playCorrect();
      expect(mockSetPositionAsync).toHaveBeenCalledWith(0);
      expect(mockPlayAsync).toHaveBeenCalled();
    });
  });

  describe('playWrong', () => {
    it('plays the wrong sound', async () => {
      await SoundService.init();
      await SoundService.playWrong();
      expect(mockSetPositionAsync).toHaveBeenCalledWith(0);
      expect(mockPlayAsync).toHaveBeenCalled();
    });
  });

  describe('playHeartbeat', () => {
    it('sets looping and plays the heartbeat sound', async () => {
      await SoundService.init();
      await SoundService.playHeartbeat();
      expect(mockSetIsLoopingAsync).toHaveBeenCalledWith(true);
      expect(mockSetPositionAsync).toHaveBeenCalledWith(0);
      expect(mockPlayAsync).toHaveBeenCalled();
    });
  });

  describe('stopHeartbeat', () => {
    it('stops the heartbeat sound', async () => {
      await SoundService.init();
      await SoundService.stopHeartbeat();
      expect(mockStopAsync).toHaveBeenCalled();
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
      mockPlayAsync.mockClear();
      mockSetPositionAsync.mockClear();
      await FreshService!.playCorrect();
      expect(mockPlayAsync).not.toHaveBeenCalled();
    });
  });

  describe('setMuted', () => {
    it('prevents playback when muted', async () => {
      await SoundService.init();
      SoundService.setMuted(true);
      mockPlayAsync.mockClear();
      mockSetPositionAsync.mockClear();
      await SoundService.playCorrect();
      expect(mockPlayAsync).not.toHaveBeenCalled();
    });

    it('allows playback when unmuted', async () => {
      await SoundService.init();
      SoundService.setMuted(true);
      SoundService.setMuted(false);
      mockPlayAsync.mockClear();
      await SoundService.playCorrect();
      expect(mockPlayAsync).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('unloads all sounds', async () => {
      await SoundService.init();
      await SoundService.dispose();
      expect(mockUnloadAsync).toHaveBeenCalledTimes(3);
    });
  });
});
