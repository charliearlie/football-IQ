/**
 * Oracle search system — Wikidata-backed player graph.
 * Public API for the Oracle search feature.
 */

// Types
export type {
  OraclePlayer,
  UnifiedPlayer,
  PositionCategory,
  SPARQLResponse,
  WikidataPlayerData,
  WikidataCareerEntry,
} from './types';

// Service (Supabase RPC wrapper)
export { searchPlayersOracle, validatePlayerClub } from './WikidataService';

// Data mappings
export {
  mapPositionCategory,
  mapNationToISO,
  extractBirthYear,
  categorizeWikidataPosition,
  parseSPARQLPlayerResults,
  parseSPARQLCareerResults,
} from './dataMappings';

// SPARQL query builders (admin tool use only)
export {
  buildPlayerLookupQuery,
  buildCareerQuery,
  buildBatchPlayerLookupQuery,
} from './sparqlQueries';
