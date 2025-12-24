import {
  calculateTransferScore,
  formatTransferScore,
  TransferGuessScore,
  MAX_POINTS,
  HINT_PENALTY,
  GUESS_PENALTY,
} from '../utils/transferScoring';

describe('calculateTransferScore', () => {
  describe('winning scenarios', () => {
    it('calculates perfect score (0 hints, 0 wrong guesses) = 10 points', () => {
      const score = calculateTransferScore(0, 0, true);
      expect(score.points).toBe(10);
      expect(score.maxPoints).toBe(10);
      expect(score.hintsRevealed).toBe(0);
      expect(score.incorrectGuesses).toBe(0);
      expect(score.won).toBe(true);
    });

    it('calculates score with 1 hint revealed = 8 points', () => {
      const score = calculateTransferScore(1, 0, true);
      expect(score.points).toBe(8); // 10 - 2
    });

    it('calculates score with 2 hints, 0 wrong = 6 points', () => {
      const score = calculateTransferScore(2, 0, true);
      expect(score.points).toBe(6); // 10 - 4
    });

    it('calculates score with 3 hints, 0 wrong = 4 points', () => {
      const score = calculateTransferScore(3, 0, true);
      expect(score.points).toBe(4); // 10 - 6
    });

    it('calculates score with 0 hints, 1 wrong guess = 9 points', () => {
      const score = calculateTransferScore(0, 1, true);
      expect(score.points).toBe(9); // 10 - 1
    });

    it('calculates score with 0 hints, 4 wrong guesses = 6 points', () => {
      const score = calculateTransferScore(0, 4, true);
      expect(score.points).toBe(6); // 10 - 4
    });

    it('calculates score with 1 hint, 2 wrong guesses = 6 points', () => {
      const score = calculateTransferScore(1, 2, true);
      expect(score.points).toBe(6); // 10 - 2 - 2
    });

    it('calculates score with 2 hints, 3 wrong guesses = 3 points', () => {
      const score = calculateTransferScore(2, 3, true);
      expect(score.points).toBe(3); // 10 - 4 - 3
    });

    it('ensures minimum score of 1 point on win (3 hints, 4 wrong)', () => {
      const score = calculateTransferScore(3, 4, true);
      expect(score.points).toBe(1); // max(1, 10 - 6 - 4) = max(1, 0) = 1
    });

    it('ensures minimum score of 1 even with maximum penalties', () => {
      // Even with all penalties, winner gets at least 1 point
      const score = calculateTransferScore(3, 4, true);
      expect(score.points).toBeGreaterThanOrEqual(1);
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

    it('returns 0 points on give up with 1 hint and 2 wrong guesses', () => {
      const score = calculateTransferScore(1, 2, false);
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

    it('always returns maxPoints as 10', () => {
      expect(calculateTransferScore(0, 0, true).maxPoints).toBe(10);
      expect(calculateTransferScore(3, 4, true).maxPoints).toBe(10);
      expect(calculateTransferScore(2, 5, false).maxPoints).toBe(10);
    });
  });

  describe('constants', () => {
    it('has correct MAX_POINTS value', () => {
      expect(MAX_POINTS).toBe(10);
    });

    it('has correct HINT_PENALTY value', () => {
      expect(HINT_PENALTY).toBe(2);
    });

    it('has correct GUESS_PENALTY value', () => {
      expect(GUESS_PENALTY).toBe(1);
    });
  });
});

describe('formatTransferScore', () => {
  it('formats perfect score as 10/10', () => {
    const score: TransferGuessScore = {
      points: 10,
      maxPoints: 10,
      hintsRevealed: 0,
      incorrectGuesses: 0,
      won: true,
    };
    expect(formatTransferScore(score)).toBe('10/10');
  });

  it('formats winning score with penalties', () => {
    const score: TransferGuessScore = {
      points: 6,
      maxPoints: 10,
      hintsRevealed: 2,
      incorrectGuesses: 0,
      won: true,
    };
    expect(formatTransferScore(score)).toBe('6/10');
  });

  it('formats minimum winning score', () => {
    const score: TransferGuessScore = {
      points: 1,
      maxPoints: 10,
      hintsRevealed: 3,
      incorrectGuesses: 4,
      won: true,
    };
    expect(formatTransferScore(score)).toBe('1/10');
  });

  it('formats losing score as 0/10', () => {
    const score: TransferGuessScore = {
      points: 0,
      maxPoints: 10,
      hintsRevealed: 2,
      incorrectGuesses: 5,
      won: false,
    };
    expect(formatTransferScore(score)).toBe('0/10');
  });
});
