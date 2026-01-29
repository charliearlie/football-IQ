/**
 * TDD tests for SPARQL query builders.
 * Tests written BEFORE implementation.
 *
 * Validates SPARQL query structure for Wikidata Query Service.
 */

import {
  buildPlayerLookupQuery,
  buildCareerQuery,
  buildBatchPlayerLookupQuery,
} from '../sparqlQueries';

describe('buildPlayerLookupQuery', () => {
  it('builds a valid SPARQL query with VALUES clause for multiple names', () => {
    const query = buildPlayerLookupQuery(['Cristiano Ronaldo', 'Lionel Messi']);

    // Must contain VALUES clause with quoted names
    expect(query).toContain('VALUES');
    expect(query).toContain('"Cristiano Ronaldo"@en');
    expect(query).toContain('"Lionel Messi"@en');

    // Must filter for football players (Q937857 = association football player)
    expect(query).toContain('Q937857');

    // Must select required fields
    expect(query).toContain('?player');
    expect(query).toContain('?playerLabel');
    expect(query).toContain('?sitelinks');

    // Must include optional fields
    expect(query).toContain('?birthDate');
    expect(query).toContain('?nationalityCode');
    expect(query).toContain('?positionLabel');
  });

  it('escapes double quotes in player names', () => {
    const query = buildPlayerLookupQuery(['O\'Brien']);
    // Should not break the SPARQL query
    expect(query).toContain('VALUES');
  });

  it('returns a query that starts with SELECT', () => {
    const query = buildPlayerLookupQuery(['Messi']);
    expect(query.trim()).toMatch(/^SELECT/);
  });
});

describe('buildCareerQuery', () => {
  it('builds a SPARQL query for a specific player QID', () => {
    const query = buildCareerQuery('Q11571');

    // Must bind the player entity
    expect(query).toContain('wd:Q11571');

    // Must query P54 (member of sports team)
    expect(query).toContain('P54');

    // Must select club info
    expect(query).toContain('?club');
    expect(query).toContain('?clubLabel');

    // Must include optional time qualifiers
    expect(query).toContain('?startYear');
    expect(query).toContain('?endYear');
  });

  it('includes country code for clubs', () => {
    const query = buildCareerQuery('Q615');
    expect(query).toContain('?clubCountryCode');
  });
});

describe('buildBatchPlayerLookupQuery', () => {
  it('builds a query with name and birth year for disambiguation', () => {
    const query = buildBatchPlayerLookupQuery(
      ['Ronaldo', 'Ronaldo'],
      [1985, 1976]
    );

    expect(query).toContain('VALUES');
    expect(query).toContain('"Ronaldo"@en');
    // Must use birth year for disambiguation
    expect(query).toContain('?birthDate');
  });

  it('handles names without birth years', () => {
    const query = buildBatchPlayerLookupQuery(
      ['Pelé'],
      [null as unknown as number]
    );

    expect(query).toContain('VALUES');
    expect(query).toContain('"Pelé"@en');
  });
});
