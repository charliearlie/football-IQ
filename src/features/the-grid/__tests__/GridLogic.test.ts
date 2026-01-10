/**
 * Grid Logic Tests (TDD)
 *
 * Tests for The Grid game validation, cell categories, and game state management.
 */

import { validateCellGuess, getCellCategories } from '../utils/validation';
import { calculateGridScore } from '../utils/scoring';
import { TheGridContent, CellIndex } from '../types/theGrid.types';

// Test fixture: sample puzzle content
const mockContent: TheGridContent = {
  xAxis: [
    { type: 'club', value: 'Real Madrid' },
    { type: 'club', value: 'Barcelona' },
    { type: 'nation', value: 'France' },
  ],
  yAxis: [
    { type: 'nation', value: 'Brazil' },
    { type: 'trophy', value: 'Champions League' },
    { type: 'stat', value: '100+ Goals' },
  ],
  valid_answers: {
    '0': ['Vinícius Júnior', 'Rodrygo', 'Casemiro'],
    '1': ['Neymar', 'Ronaldinho', 'Rivaldo'],
    '2': ['Karim Benzema', 'Zinedine Zidane'],
    '3': ['Cristiano Ronaldo', 'Luka Modrić'],
    '4': ['Lionel Messi', 'Xavi', 'Iniesta'],
    '5': ['Kylian Mbappé', 'Antoine Griezmann'],
    '6': ['Karim Benzema', 'Cristiano Ronaldo'],
    '7': ['Lionel Messi', 'Neymar'],
    '8': ['Thierry Henry', 'Karim Benzema'],
  },
};

describe('validateCellGuess', () => {
  it('returns valid for exact match', () => {
    const result = validateCellGuess('Vinícius Júnior', 0, mockContent);
    expect(result.isValid).toBe(true);
    expect(result.matchedPlayer).toBe('Vinícius Júnior');
  });

  it('returns valid for fuzzy match (typos)', () => {
    // Minor typo: "Vinicius" without accents
    const result = validateCellGuess('Vinicius Junior', 0, mockContent);
    expect(result.isValid).toBe(true);
    expect(result.matchedPlayer).toBe('Vinícius Júnior');
  });

  it('returns valid for accent-normalized match', () => {
    // Without accent marks
    const result = validateCellGuess('Casemiro', 0, mockContent);
    expect(result.isValid).toBe(true);
    expect(result.matchedPlayer).toBe('Casemiro');
  });

  it('returns valid for case-insensitive match', () => {
    const result = validateCellGuess('RODRYGO', 0, mockContent);
    expect(result.isValid).toBe(true);
    expect(result.matchedPlayer).toBe('Rodrygo');
  });

  it('returns valid for partial name match (surname)', () => {
    // Just surname should match
    const result = validateCellGuess('Messi', 4, mockContent);
    expect(result.isValid).toBe(true);
    expect(result.matchedPlayer).toBe('Lionel Messi');
  });

  it('returns invalid for non-matching player', () => {
    const result = validateCellGuess('Harry Kane', 0, mockContent);
    expect(result.isValid).toBe(false);
    expect(result.matchedPlayer).toBeUndefined();
  });

  it('returns invalid for empty string', () => {
    const result = validateCellGuess('', 0, mockContent);
    expect(result.isValid).toBe(false);
  });

  it('returns invalid for whitespace only', () => {
    const result = validateCellGuess('   ', 0, mockContent);
    expect(result.isValid).toBe(false);
  });

  it('returns invalid when cell has no valid answers', () => {
    const contentWithMissing: TheGridContent = {
      ...mockContent,
      valid_answers: { '0': [] },
    };
    const result = validateCellGuess('Messi', 0, contentWithMissing);
    expect(result.isValid).toBe(false);
  });
});

describe('getCellCategories', () => {
  it('returns correct row/col for cell 0 (top-left)', () => {
    const result = getCellCategories(0, mockContent);
    expect(result.row).toEqual({ type: 'nation', value: 'Brazil' });
    expect(result.col).toEqual({ type: 'club', value: 'Real Madrid' });
  });

  it('returns correct row/col for cell 1 (top-middle)', () => {
    const result = getCellCategories(1, mockContent);
    expect(result.row).toEqual({ type: 'nation', value: 'Brazil' });
    expect(result.col).toEqual({ type: 'club', value: 'Barcelona' });
  });

  it('returns correct row/col for cell 2 (top-right)', () => {
    const result = getCellCategories(2, mockContent);
    expect(result.row).toEqual({ type: 'nation', value: 'Brazil' });
    expect(result.col).toEqual({ type: 'nation', value: 'France' });
  });

  it('returns correct row/col for cell 3 (middle-left)', () => {
    const result = getCellCategories(3, mockContent);
    expect(result.row).toEqual({ type: 'trophy', value: 'Champions League' });
    expect(result.col).toEqual({ type: 'club', value: 'Real Madrid' });
  });

  it('returns correct row/col for cell 4 (center)', () => {
    const result = getCellCategories(4, mockContent);
    expect(result.row).toEqual({ type: 'trophy', value: 'Champions League' });
    expect(result.col).toEqual({ type: 'club', value: 'Barcelona' });
  });

  it('returns correct row/col for cell 5 (middle-right)', () => {
    const result = getCellCategories(5, mockContent);
    expect(result.row).toEqual({ type: 'trophy', value: 'Champions League' });
    expect(result.col).toEqual({ type: 'nation', value: 'France' });
  });

  it('returns correct row/col for cell 6 (bottom-left)', () => {
    const result = getCellCategories(6, mockContent);
    expect(result.row).toEqual({ type: 'stat', value: '100+ Goals' });
    expect(result.col).toEqual({ type: 'club', value: 'Real Madrid' });
  });

  it('returns correct row/col for cell 7 (bottom-middle)', () => {
    const result = getCellCategories(7, mockContent);
    expect(result.row).toEqual({ type: 'stat', value: '100+ Goals' });
    expect(result.col).toEqual({ type: 'club', value: 'Barcelona' });
  });

  it('returns correct row/col for cell 8 (bottom-right)', () => {
    const result = getCellCategories(8, mockContent);
    expect(result.row).toEqual({ type: 'stat', value: '100+ Goals' });
    expect(result.col).toEqual({ type: 'nation', value: 'France' });
  });
});

describe('calculateGridScore', () => {
  it('returns 100 points for 9 cells filled', () => {
    const score = calculateGridScore(9);
    expect(score.points).toBe(100);
    expect(score.maxPoints).toBe(100);
    expect(score.cellsFilled).toBe(9);
  });

  it('returns 0 points for 0 cells filled', () => {
    const score = calculateGridScore(0);
    expect(score.points).toBe(0);
    expect(score.maxPoints).toBe(100);
    expect(score.cellsFilled).toBe(0);
  });

  it('returns proportional points for partial completion', () => {
    const score = calculateGridScore(5);
    expect(score.points).toBe(56); // round(5/9 * 100) = 56
    expect(score.cellsFilled).toBe(5);
  });

  it('returns correct points for 1 cell filled', () => {
    const score = calculateGridScore(1);
    expect(score.points).toBe(11); // round(1/9 * 100) = 11
    expect(score.cellsFilled).toBe(1);
  });

  it('returns correct points for 8 cells filled', () => {
    const score = calculateGridScore(8);
    expect(score.points).toBe(89); // round(8/9 * 100) = 89
    expect(score.cellsFilled).toBe(8);
  });
});

// TODO: Add useTheGridGame hook tests once the hook is implemented
// These tests will use @testing-library/react-hooks
describe('useTheGridGame (placeholder)', () => {
  it.todo('updates cell state on valid selection');
  it.todo('shows error state on invalid selection (no browser alert)');
  it.todo('prevents selecting already filled cell');
  it.todo('completes game when all 9 cells filled');
  it.todo('calculates correct score based on cells filled');
  it.todo('generates attemptId on first selection');
  it.todo('restores progress from saved attempt');
});
