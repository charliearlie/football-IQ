/**
 * TDD tests for Oracle data mapping utilities.
 * Tests written BEFORE implementation.
 *
 * Covers:
 * - Position category normalization (players.json codes + Wikidata labels)
 * - Nation name → ISO 3166-1 alpha-2 mapping
 * - Birth year extraction from date strings
 * - SPARQL response parsing
 */

import {
  mapPositionCategory,
  mapNationToISO,
  extractBirthYear,
  categorizeWikidataPosition,
  parseSPARQLPlayerResults,
  parseSPARQLCareerResults,
} from '../dataMappings';
import { SPARQLResponse } from '../types';

describe('mapPositionCategory', () => {
  describe('players.json abbreviations', () => {
    it('maps ATT to Forward', () => {
      expect(mapPositionCategory('ATT')).toBe('Forward');
    });

    it('maps DEF to Defender', () => {
      expect(mapPositionCategory('DEF')).toBe('Defender');
    });

    it('maps MID to Midfielder', () => {
      expect(mapPositionCategory('MID')).toBe('Midfielder');
    });

    it('maps GK to Goalkeeper', () => {
      expect(mapPositionCategory('GK')).toBe('Goalkeeper');
    });
  });

  describe('players.json full names', () => {
    it('maps Attack to Forward', () => {
      expect(mapPositionCategory('Attack')).toBe('Forward');
    });

    it('maps Defender to Defender', () => {
      expect(mapPositionCategory('Defender')).toBe('Defender');
    });

    it('maps Sweeper to Defender', () => {
      expect(mapPositionCategory('Sweeper')).toBe('Defender');
    });
  });

  describe('case insensitivity', () => {
    it('handles lowercase input', () => {
      expect(mapPositionCategory('att')).toBe('Forward');
    });

    it('handles mixed case input', () => {
      expect(mapPositionCategory('Def')).toBe('Defender');
    });
  });

  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(mapPositionCategory('')).toBeNull();
    });

    it('returns null for unknown position', () => {
      expect(mapPositionCategory('Unknown')).toBeNull();
    });
  });
});

describe('categorizeWikidataPosition', () => {
  it('categorizes "association football goalkeeper"', () => {
    expect(categorizeWikidataPosition('association football goalkeeper')).toBe('Goalkeeper');
  });

  it('categorizes "association football midfielder"', () => {
    expect(categorizeWikidataPosition('association football midfielder')).toBe('Midfielder');
  });

  it('categorizes "association football defender"', () => {
    expect(categorizeWikidataPosition('association football defender')).toBe('Defender');
  });

  it('categorizes "association football forward"', () => {
    expect(categorizeWikidataPosition('association football forward')).toBe('Forward');
  });

  it('categorizes "striker" as Forward', () => {
    expect(categorizeWikidataPosition('striker')).toBe('Forward');
  });

  it('categorizes "winger" as Forward', () => {
    expect(categorizeWikidataPosition('winger')).toBe('Forward');
  });

  it('categorizes "centre-back" as Defender', () => {
    expect(categorizeWikidataPosition('centre-back')).toBe('Defender');
  });

  it('categorizes "full-back" as Defender', () => {
    expect(categorizeWikidataPosition('full-back')).toBe('Defender');
  });

  it('categorizes "defensive midfielder" as Midfielder', () => {
    expect(categorizeWikidataPosition('defensive midfielder')).toBe('Midfielder');
  });

  it('returns null for unrecognized position', () => {
    expect(categorizeWikidataPosition('coach')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(categorizeWikidataPosition('')).toBeNull();
  });
});

describe('mapNationToISO', () => {
  describe('common nations', () => {
    it('maps England to GB-ENG', () => {
      expect(mapNationToISO('England')).toBe('GB-ENG');
    });

    it('maps France to FR', () => {
      expect(mapNationToISO('France')).toBe('FR');
    });

    it('maps Brazil to BR', () => {
      expect(mapNationToISO('Brazil')).toBe('BR');
    });

    it('maps Argentina to AR', () => {
      expect(mapNationToISO('Argentina')).toBe('AR');
    });

    it('maps Germany to DE', () => {
      expect(mapNationToISO('Germany')).toBe('DE');
    });

    it('maps Spain to ES', () => {
      expect(mapNationToISO('Spain')).toBe('ES');
    });

    it('maps Italy to IT', () => {
      expect(mapNationToISO('Italy')).toBe('IT');
    });

    it('maps Portugal to PT', () => {
      expect(mapNationToISO('Portugal')).toBe('PT');
    });
  });

  describe('UK nations', () => {
    it('maps Scotland to GB-SCT', () => {
      expect(mapNationToISO('Scotland')).toBe('GB-SCT');
    });

    it('maps Wales to GB-WLS', () => {
      expect(mapNationToISO('Wales')).toBe('GB-WLS');
    });

    it('maps Northern Ireland to GB-NIR', () => {
      expect(mapNationToISO('Northern Ireland')).toBe('GB-NIR');
    });
  });

  describe('tricky nations in players.json', () => {
    it('maps Bosnia-Herzegovina to BA', () => {
      expect(mapNationToISO('Bosnia-Herzegovina')).toBe('BA');
    });

    it('maps Ivory Coast to CI', () => {
      expect(mapNationToISO('Ivory Coast')).toBe('CI');
    });

    it('maps DR Congo to CD', () => {
      expect(mapNationToISO('DR Congo')).toBe('CD');
    });

    it('maps South Korea to KR', () => {
      expect(mapNationToISO('South Korea')).toBe('KR');
    });

    it('maps Republic of Ireland to IE', () => {
      expect(mapNationToISO('Republic of Ireland')).toBe('IE');
    });

    it('maps Ireland to IE', () => {
      expect(mapNationToISO('Ireland')).toBe('IE');
    });
  });

  describe('case insensitivity', () => {
    it('handles lowercase', () => {
      expect(mapNationToISO('france')).toBe('FR');
    });

    it('handles uppercase', () => {
      expect(mapNationToISO('BRAZIL')).toBe('BR');
    });
  });

  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(mapNationToISO('')).toBeNull();
    });

    it('returns null for unknown nation', () => {
      expect(mapNationToISO('Narnia')).toBeNull();
    });
  });
});

describe('extractBirthYear', () => {
  it('extracts year from YYYY-MM-DD format', () => {
    expect(extractBirthYear('1985-02-05')).toBe(1985);
  });

  it('extracts year from ISO date format', () => {
    expect(extractBirthYear('2000-01-28')).toBe(2000);
  });

  it('extracts year from YYYY format', () => {
    expect(extractBirthYear('1979')).toBe(1979);
  });

  it('extracts year from Wikidata datetime', () => {
    expect(extractBirthYear('1985-02-05T00:00:00Z')).toBe(1985);
  });

  it('returns null for empty string', () => {
    expect(extractBirthYear('')).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(extractBirthYear('not-a-date')).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(extractBirthYear(null as unknown as string)).toBeNull();
    expect(extractBirthYear(undefined as unknown as string)).toBeNull();
  });
});

describe('parseSPARQLPlayerResults', () => {
  it('parses a valid SPARQL response into player data', () => {
    const response: SPARQLResponse = {
      results: {
        bindings: [
          {
            player: { type: 'uri', value: 'http://www.wikidata.org/entity/Q11571' },
            playerLabel: { type: 'literal', value: 'Cristiano Ronaldo' },
            birthDate: { type: 'literal', value: '1985-02-05T00:00:00Z', datatype: 'http://www.w3.org/2001/XMLSchema#dateTime' },
            nationalityCode: { type: 'literal', value: 'PT' },
            positionLabel: { type: 'literal', value: 'association football forward' },
            sitelinks: { type: 'literal', value: '207', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
          },
        ],
      },
    };

    const result = parseSPARQLPlayerResults(response);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      qid: 'Q11571',
      name: 'Cristiano Ronaldo',
      birth_year: 1985,
      nationality_code: 'PT',
      position_category: 'Forward',
      sitelinks: 207,
    });
  });

  it('handles missing optional fields gracefully', () => {
    const response: SPARQLResponse = {
      results: {
        bindings: [
          {
            player: { type: 'uri', value: 'http://www.wikidata.org/entity/Q12345' },
            playerLabel: { type: 'literal', value: 'Unknown Player' },
            sitelinks: { type: 'literal', value: '3', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
          },
        ],
      },
    };

    const result = parseSPARQLPlayerResults(response);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      qid: 'Q12345',
      name: 'Unknown Player',
      birth_year: null,
      nationality_code: null,
      position_category: null,
      sitelinks: 3,
    });
  });

  it('extracts QID from Wikidata entity URI', () => {
    const response: SPARQLResponse = {
      results: {
        bindings: [
          {
            player: { type: 'uri', value: 'http://www.wikidata.org/entity/Q615' },
            playerLabel: { type: 'literal', value: 'Lionel Messi' },
            sitelinks: { type: 'literal', value: '200', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
          },
        ],
      },
    };

    const result = parseSPARQLPlayerResults(response);
    expect(result[0].qid).toBe('Q615');
  });

  it('returns empty array for empty results', () => {
    const response: SPARQLResponse = { results: { bindings: [] } };
    expect(parseSPARQLPlayerResults(response)).toEqual([]);
  });
});

describe('parseSPARQLCareerResults', () => {
  it('parses career entries from SPARQL response', () => {
    const response: SPARQLResponse = {
      results: {
        bindings: [
          {
            club: { type: 'uri', value: 'http://www.wikidata.org/entity/Q8682' },
            clubLabel: { type: 'literal', value: 'Real Madrid CF' },
            startYear: { type: 'literal', value: '2009', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
            endYear: { type: 'literal', value: '2018', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
            clubCountryCode: { type: 'literal', value: 'ES' },
          },
          {
            club: { type: 'uri', value: 'http://www.wikidata.org/entity/Q847' },
            clubLabel: { type: 'literal', value: 'Juventus FC' },
            startYear: { type: 'literal', value: '2018', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
            endYear: { type: 'literal', value: '2021', datatype: 'http://www.w3.org/2001/XMLSchema#integer' },
            clubCountryCode: { type: 'literal', value: 'IT' },
          },
        ],
      },
    };

    const result = parseSPARQLCareerResults(response);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      club_qid: 'Q8682',
      club_name: 'Real Madrid CF',
      club_country_code: 'ES',
      start_year: 2009,
      end_year: 2018,
    });
    expect(result[1].club_qid).toBe('Q847');
  });

  it('handles missing year fields', () => {
    const response: SPARQLResponse = {
      results: {
        bindings: [
          {
            club: { type: 'uri', value: 'http://www.wikidata.org/entity/Q1234' },
            clubLabel: { type: 'literal', value: 'Some Club' },
          },
        ],
      },
    };

    const result = parseSPARQLCareerResults(response);
    expect(result[0].start_year).toBeNull();
    expect(result[0].end_year).toBeNull();
    expect(result[0].club_country_code).toBeNull();
  });
});
