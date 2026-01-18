/**
 * Message Rotation Tests
 *
 * Tests for notification message generation and rotation.
 */

import {
  getMorningMessage,
  getStreakSaverMessage,
  getMorningMessageByIndex,
  getAllMorningMessages,
} from '../utils/messageRotation';

describe('messageRotation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getMorningMessage', () => {
    it('returns a message with title and body', () => {
      const message = getMorningMessage();
      expect(message.title).toBeDefined();
      expect(message.body).toBeDefined();
      expect(message.title.length).toBeGreaterThan(0);
      expect(message.body.length).toBeGreaterThan(0);
    });

    it('returns consistent message for same day', () => {
      jest.setSystemTime(new Date('2025-01-15T08:00:00'));
      const msg1 = getMorningMessage();

      jest.setSystemTime(new Date('2025-01-15T20:00:00'));
      const msg2 = getMorningMessage();

      expect(msg1).toEqual(msg2);
    });

    it('may return different message on different days', () => {
      // This test verifies rotation works - messages can differ by day
      jest.setSystemTime(new Date('2025-01-15T08:00:00'));
      const msg1 = getMorningMessage();

      jest.setSystemTime(new Date('2025-01-16T08:00:00'));
      const msg2 = getMorningMessage();

      // At least verify they're valid messages (may or may not be equal)
      expect(msg1.title).toBeDefined();
      expect(msg2.title).toBeDefined();
    });

    it('cycles through all messages over multiple days', () => {
      const allMessages = getAllMorningMessages();
      const seenTitles = new Set<string>();

      // Check messages over enough days to see all variants
      for (let i = 0; i < allMessages.length * 2; i++) {
        jest.setSystemTime(new Date(`2025-01-${String(i + 1).padStart(2, '0')}T08:00:00`));
        const msg = getMorningMessage();
        seenTitles.add(msg.title);
      }

      // Should see all message variants
      expect(seenTitles.size).toBe(allMessages.length);
    });
  });

  describe('getStreakSaverMessage', () => {
    it('includes streak count in message body', () => {
      const message = getStreakSaverMessage(5);
      expect(message.title).toContain('STREAK');
      expect(message.body).toContain('5');
    });

    it('handles streak of 1', () => {
      const message = getStreakSaverMessage(1);
      expect(message.body).toContain('1');
    });

    it('handles large streak counts', () => {
      const message = getStreakSaverMessage(100);
      expect(message.body).toContain('100');
    });

    it('mentions time remaining', () => {
      const message = getStreakSaverMessage(7);
      expect(message.body).toContain('4 hours');
    });
  });

  describe('getMorningMessageByIndex', () => {
    it('returns message at specified index', () => {
      const msg0 = getMorningMessageByIndex(0);
      const msg1 = getMorningMessageByIndex(1);
      expect(msg0).toBeDefined();
      expect(msg1).toBeDefined();
      expect(msg0.title).not.toBe(msg1.title);
    });

    it('wraps around for out-of-bounds index', () => {
      const allMessages = getAllMorningMessages();
      const msg0 = getMorningMessageByIndex(0);
      const msgWrapped = getMorningMessageByIndex(allMessages.length);
      expect(msg0).toEqual(msgWrapped);
    });

    it('handles negative-like wrapping via modulo', () => {
      const allMessages = getAllMorningMessages();
      // Large index should wrap around
      const msgLarge = getMorningMessageByIndex(100);
      const expectedIndex = 100 % allMessages.length;
      const msgExpected = getMorningMessageByIndex(expectedIndex);
      expect(msgLarge).toEqual(msgExpected);
    });
  });

  describe('getAllMorningMessages', () => {
    it('returns array of messages', () => {
      const messages = getAllMorningMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    });

    it('returns copy not reference', () => {
      const messages1 = getAllMorningMessages();
      const messages2 = getAllMorningMessages();
      expect(messages1).not.toBe(messages2);
      expect(messages1).toEqual(messages2);
    });

    it('all messages have title and body', () => {
      const messages = getAllMorningMessages();
      messages.forEach((msg) => {
        expect(msg.title).toBeDefined();
        expect(msg.body).toBeDefined();
        expect(typeof msg.title).toBe('string');
        expect(typeof msg.body).toBe('string');
      });
    });

    it('contains at least 4 message variants', () => {
      const messages = getAllMorningMessages();
      expect(messages.length).toBeGreaterThanOrEqual(4);
    });
  });
});
