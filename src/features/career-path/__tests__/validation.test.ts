import {
  validateGuess,
  normalizeString,
  MATCH_THRESHOLD,
} from '../utils/validation';

describe('normalizeString', () => {
  it('converts to lowercase', () => {
    expect(normalizeString('MESSI')).toBe('messi');
    expect(normalizeString('Cristiano Ronaldo')).toBe('cristiano ronaldo');
  });

  it('removes accents/diacritics', () => {
    expect(normalizeString('Özil')).toBe('ozil');
    expect(normalizeString('Müller')).toBe('muller');
    expect(normalizeString('Agüero')).toBe('aguero');
    expect(normalizeString('Ibrahimović')).toBe('ibrahimovic');
    expect(normalizeString('Sørloth')).toBe('sorloth');
  });

  it('trims whitespace', () => {
    expect(normalizeString('  Ronaldo  ')).toBe('ronaldo');
    expect(normalizeString('\tMessi\n')).toBe('messi');
  });

  it('handles empty strings', () => {
    expect(normalizeString('')).toBe('');
    expect(normalizeString('   ')).toBe('');
  });
});

describe('validateGuess', () => {
  describe('exact matches', () => {
    it('matches identical strings', () => {
      const result = validateGuess('Morgan Rogers', 'Morgan Rogers');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('matches case-insensitively', () => {
      const result = validateGuess('MORGAN ROGERS', 'Morgan Rogers');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('matches with accent normalization', () => {
      const result = validateGuess('Ozil', 'Özil');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('matches with mixed case and accents', () => {
      const result = validateGuess('MESUT OZIL', 'Mesut Özil');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });

  describe('partial name matches (surname only)', () => {
    it('matches surname "Messi" to "Lionel Messi"', () => {
      const result = validateGuess('Messi', 'Lionel Messi');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    it('matches "Van Dijk" to "Virgil van Dijk"', () => {
      const result = validateGuess('Van Dijk', 'Virgil van Dijk');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    it('matches "Ronaldo" to "Cristiano Ronaldo"', () => {
      const result = validateGuess('Ronaldo', 'Cristiano Ronaldo');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    it('matches "Mbappé" to "Kylian Mbappé"', () => {
      const result = validateGuess('Mbappe', 'Kylian Mbappé');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.9);
    });

    it('rejects very short partials (less than 3 chars)', () => {
      const result = validateGuess('Me', 'Lionel Messi');
      expect(result.isMatch).toBe(false);
    });
  });

  describe('fuzzy matches (typos)', () => {
    it('matches minor typo: "Rogrers" to "Rogers"', () => {
      const result = validateGuess('Morgan Rogrers', 'Morgan Rogers');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    });

    it('matches "Mbape" to "Mbappé" (missing letter)', () => {
      const result = validateGuess('Kylian Mbape', 'Kylian Mbappé');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(MATCH_THRESHOLD);
    });

    it('matches "Haaland" with double letters', () => {
      const result = validateGuess('Erling Haaland', 'Erling Haaland');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });

  describe('non-matches (different players)', () => {
    it('rejects "Cristiano Ronaldo" vs "Lionel Messi"', () => {
      const result = validateGuess('Cristiano Ronaldo', 'Lionel Messi');
      expect(result.isMatch).toBe(false);
      expect(result.score).toBeLessThan(MATCH_THRESHOLD);
    });

    it('rejects "Ronaldinho" vs "Ronaldo" (similar but different)', () => {
      const result = validateGuess('Ronaldinho', 'Cristiano Ronaldo');
      expect(result.isMatch).toBe(false);
      expect(result.score).toBeLessThan(MATCH_THRESHOLD);
    });

    it('rejects completely different names', () => {
      const result = validateGuess('Kevin De Bruyne', 'Mohamed Salah');
      expect(result.isMatch).toBe(false);
      expect(result.score).toBeLessThan(0.5);
    });

    it('rejects partial match that is too short', () => {
      const result = validateGuess('Li', 'Lionel Messi');
      expect(result.isMatch).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles empty guess', () => {
      const result = validateGuess('', 'Lionel Messi');
      expect(result.isMatch).toBe(false);
      expect(result.score).toBe(0);
    });

    it('handles whitespace-only guess', () => {
      const result = validateGuess('   ', 'Lionel Messi');
      expect(result.isMatch).toBe(false);
      expect(result.score).toBe(0);
    });

    it('handles names with hyphens', () => {
      const result = validateGuess('Pierre-Emerick Aubameyang', 'Pierre-Emerick Aubameyang');
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });

    it('handles names with apostrophes', () => {
      const result = validateGuess("N'Golo Kanté", "N'Golo Kanté");
      expect(result.isMatch).toBe(true);
      expect(result.score).toBe(1.0);
    });
  });
});
