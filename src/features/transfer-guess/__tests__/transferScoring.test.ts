import {
  calculateTransferScore,
  formatTransferScore,
  TransferGuessScore,
  MAX_POINTS,
} from '../utils/transferScoring';

describe('calculateTransferScore', () => {
  describe('winning scenarios - hint-based scoring', () => {
    it('calculates perfect score (0 hints) = 5 points', () => {
      const score = calculateTransferScore(0, 0, true);
      expect(score.points).toBe(5);
      expect(score.maxPoints).toBe(5);
      expect(score.hintsRevealed).toBe(0);
      expect(score.incorrectGuesses).toBe(0);
      expect(score.won).toBe(true);
    });

    it('calculates score with 1 hint revealed = 3 points', () => {
      const score = calculateTransferScore(1, 0, true);
      expect(score.points).toBe(3);
    });

    it('calculates score with 2 hints revealed = 2 points', () => {
      const score = calculateTransferScore(2, 0, true);
      expect(score.points).toBe(2);
    });

    it('calculates score with 3 hints revealed = 1 point (minimum)', () => {
      const score = calculateTransferScore(3, 0, true);
      expect(score.points).toBe(1);
    });

    it('incorrect guesses do not affect score (0 hints)', () => {
      const score = calculateTransferScore(0, 4, true);
      expect(score.points).toBe(5); // Still 5 points regardless of guesses
    });

    it('incorrect guesses do not affect score (1 hint)', () => {
      const score = calculateTransferScore(1, 3, true);
      expect(score.points).toBe(3); // Still 3 points regardless of guesses
    });

    it('incorrect guesses do not affect score (2 hints)', () => {
      const score = calculateTransferScore(2, 4, true);
      expect(score.points).toBe(2); // Still 2 points regardless of guesses
    });

    it('incorrect guesses do not affect score (3 hints)', () => {
      const score = calculateTransferScore(3, 4, true);
      expect(score.points).toBe(1); // Still 1 point regardless of guesses
    });
  });

  describe('losing scenarios', () => {
    it('returns 0 points after 5 incorrect guesses (game over)', () => {
      const score = calculateTransferScore(2, 5, false);
      expect(score.points).toBe(0);
      expect(score.won).toBe(false);
    });

    it('returns 0 points on give up with no hints revealed', () => {
      const score = calculateTransferScore(0, 0, false);
      expect(score.points).toBe(0);
      expect(score.won).toBe(false);
    });

    it('returns 0 points on give up with 3 hints revealed', () => {
      const score = calculateTransferScore(3, 2, false);
      expect(score.points).toBe(0);
      expect(score.won).toBe(false);
    });

    it('tracks hints revealed and incorrect guesses on loss', () => {
      const score = calculateTransferScore(2, 5, false);
      expect(score.hintsRevealed).toBe(2);
      expect(score.incorrectGuesses).toBe(5);
    });
  });

  describe('metadata tracking', () => {
    it('tracks hints revealed correctly', () => {
      const score = calculateTransferScore(2, 1, true);
      expect(score.hintsRevealed).toBe(2);
    });

    it('tracks incorrect guesses correctly', () => {
      const score = calculateTransferScore(1, 3, true);
      expect(score.incorrectGuesses).toBe(3);
    });

    it('always returns maxPoints as 5', () => {
      expect(calculateTransferScore(0, 0, true).maxPoints).toBe(5);
      expect(calculateTransferScore(3, 4, true).maxPoints).toBe(5);
      expect(calculateTransferScore(2, 5, false).maxPoints).toBe(5);
    });
  });

  describe('constants', () => {
    it('has correct MAX_POINTS value', () => {
      expect(MAX_POINTS).toBe(5);
    });
  });
});

describe('formatTransferScore', () => {
  it('formats perfect score as 5/5', () => {
    const score: TransferGuessScore = {
      points: 5,
      maxPoints: 5,
      hintsRevealed: 0,
      incorrectGuesses: 0,
      won: true,
    };
    expect(formatTransferScore(score)).toBe('5/5');
  });

  it('formats winning score with 1 hint as 3/5', () => {
    const score: TransferGuessScore = {
      points: 3,
      maxPoints: 5,
      hintsRevealed: 1,
      incorrectGuesses: 0,
      won: true,
    };
    expect(formatTransferScore(score)).toBe('3/5');
  });

  it('formats minimum winning score as 1/5', () => {
    const score: TransferGuessScore = {
      points: 1,
      maxPoints: 5,
      hintsRevealed: 3,
      incorrectGuesses: 4,
      won: true,
    };
    expect(formatTransferScore(score)).toBe('1/5');
  });

  it('formats losing score as 0/5', () => {
    const score: TransferGuessScore = {
      points: 0,
      maxPoints: 5,
      hintsRevealed: 2,
      incorrectGuesses: 5,
      won: false,
    };
    expect(formatTransferScore(score)).toBe('0/5');
  });
});
