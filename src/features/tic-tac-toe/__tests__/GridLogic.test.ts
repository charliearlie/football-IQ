/**
 * Grid Logic Tests for Tic Tac Toe
 *
 * Tests the cell validation logic that checks if a player
 * satisfies both row and column category criteria.
 */

import { validateCellGuess, getCellCategories } from '../utils/validation';
import type { TicTacToeContent } from '../types/ticTacToe.types';

// Mock puzzle data for testing
const mockPuzzle: TicTacToeContent = {
  rows: ['Real Madrid', 'Barcelona', 'Man City'],
  columns: ['Brazil', 'Argentina', 'France'],
  valid_answers: {
    // Row 0 (Real Madrid)
    '0': ['Vinícius Júnior', 'Rodrygo', 'Casemiro'], // Real Madrid x Brazil
    '1': ['Ángel Di María'], // Real Madrid x Argentina (past player)
    '2': ['Karim Benzema', 'Zinedine Zidane'], // Real Madrid x France

    // Row 1 (Barcelona)
    '3': ['Ronaldinho', 'Neymar', 'Dani Alves'], // Barcelona x Brazil
    '4': ['Lionel Messi', 'Javier Mascherano'], // Barcelona x Argentina
    '5': ['Thierry Henry', 'Antoine Griezmann'], // Barcelona x France

    // Row 2 (Man City)
    '6': ['Ederson', 'Gabriel Jesus', 'Fernandinho'], // Man City x Brazil
    '7': ['Sergio Agüero', 'Pablo Zabaleta'], // Man City x Argentina
    '8': ['Benjamin Mendy'], // Man City x France
  },
};

describe('validateCellGuess', () => {
  describe('Real Madrid x Brazil cell (index 0)', () => {
    it('should return true for "Vinícius Júnior"', () => {
      const result = validateCellGuess('Vinícius Júnior', 0, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Vinícius Júnior');
      expect(result.score).toBeGreaterThanOrEqual(0.85);
    });

    it('should return true for "Vinicius Junior" (without accents)', () => {
      const result = validateCellGuess('Vinicius Junior', 0, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Vinícius Júnior');
    });

    it('should return true for "Rodrygo"', () => {
      const result = validateCellGuess('Rodrygo', 0, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Rodrygo');
    });

    it('should return false for "Messi" (wrong nationality and club)', () => {
      const result = validateCellGuess('Messi', 0, mockPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.matchedPlayer).toBeNull();
    });

    it('should return false for "Benzema" (French, not Brazilian)', () => {
      const result = validateCellGuess('Benzema', 0, mockPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.matchedPlayer).toBeNull();
    });
  });

  describe('Barcelona x Argentina cell (index 4)', () => {
    it('should return true for "Messi"', () => {
      const result = validateCellGuess('Messi', 4, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Lionel Messi');
    });

    it('should return true for "Lionel Messi" (full name)', () => {
      const result = validateCellGuess('Lionel Messi', 4, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Lionel Messi');
    });

    it('should return true for "Mascherano"', () => {
      const result = validateCellGuess('Mascherano', 4, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Javier Mascherano');
    });
  });

  describe('Man City x Argentina cell (index 7)', () => {
    it('should return true for "Aguero" (with accent normalization)', () => {
      const result = validateCellGuess('Aguero', 7, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Sergio Agüero');
    });

    it('should return true for "Sergio Aguero"', () => {
      const result = validateCellGuess('Sergio Aguero', 7, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Sergio Agüero');
    });
  });

  describe('edge cases', () => {
    it('should return false for empty string', () => {
      const result = validateCellGuess('', 0, mockPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.matchedPlayer).toBeNull();
      expect(result.score).toBe(0);
    });

    it('should return false for whitespace only', () => {
      const result = validateCellGuess('   ', 0, mockPuzzle);

      expect(result.isValid).toBe(false);
      expect(result.matchedPlayer).toBeNull();
    });

    it('should handle case insensitivity', () => {
      const result = validateCellGuess('MESSI', 4, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Lionel Messi');
    });

    it('should handle typos with fuzzy matching', () => {
      // "Ronnaldinho" (double 'n') should match "Ronaldinho" (score: 0.947)
      const result = validateCellGuess('Ronnaldinho', 3, mockPuzzle);

      expect(result.isValid).toBe(true);
      expect(result.matchedPlayer).toBe('Ronaldinho');
    });
  });
});

describe('getCellCategories', () => {
  it('should return correct categories for cell 0 (top-left)', () => {
    const categories = getCellCategories(0, mockPuzzle);

    expect(categories.row).toBe('Real Madrid');
    expect(categories.column).toBe('Brazil');
  });

  it('should return correct categories for cell 4 (center)', () => {
    const categories = getCellCategories(4, mockPuzzle);

    expect(categories.row).toBe('Barcelona');
    expect(categories.column).toBe('Argentina');
  });

  it('should return correct categories for cell 8 (bottom-right)', () => {
    const categories = getCellCategories(8, mockPuzzle);

    expect(categories.row).toBe('Man City');
    expect(categories.column).toBe('France');
  });

  it('should return correct categories for cell 2 (top-right)', () => {
    const categories = getCellCategories(2, mockPuzzle);

    expect(categories.row).toBe('Real Madrid');
    expect(categories.column).toBe('France');
  });

  it('should return correct categories for cell 6 (bottom-left)', () => {
    const categories = getCellCategories(6, mockPuzzle);

    expect(categories.row).toBe('Man City');
    expect(categories.column).toBe('Brazil');
  });
});
