/**
 * SPARQL query builders for Wikidata Query Service.
 *
 * These queries are used by the admin tool (tools/player-scout.html),
 * NOT by the mobile client. The mobile app queries Supabase RPCs instead.
 */

/**
 * Build a SPARQL query to look up football players by name.
 * Uses VALUES clause for batching multiple names in one query.
 *
 * @param names - Array of player names to look up
 * @returns SPARQL query string
 */
export function buildPlayerLookupQuery(names: string[]): string {
  const valuesEntries = names
    .map((name) => {
      // Escape double quotes in names
      const escaped = name.replace(/"/g, '\\"');
      return `"${escaped}"@en`;
    })
    .join(' ');

  return `SELECT ?player ?playerLabel ?birthDate ?nationalityLabel ?positionLabel ?sitelinks WHERE {
  VALUES ?searchName { ${valuesEntries} }

  ?player rdfs:label ?searchName .
  ?player wdt:P106 wd:Q937857 .

  OPTIONAL { ?player wdt:P569 ?birthDate . }
  OPTIONAL {
    { ?player wdt:P1532 ?nationality }
    UNION
    { ?player wdt:P27 ?nationality . FILTER NOT EXISTS { ?player wdt:P1532 [] } }
  }
  OPTIONAL { ?player wdt:P413 ?position . }

  ?player wikibase:sitelinks ?sitelinks .

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

/**
 * Build a SPARQL query to fetch career clubs for a specific player.
 *
 * @param qid - Wikidata QID (e.g., "Q11571")
 * @returns SPARQL query string
 */
export function buildCareerQuery(qid: string): string {
  return `SELECT ?club ?clubLabel ?startYear ?endYear ?clubCountryCode WHERE {
  wd:${qid} p:P54 ?careerStatement .
  ?careerStatement ps:P54 ?club .

  OPTIONAL { ?careerStatement pq:P580 ?startTime . }
  OPTIONAL { ?careerStatement pq:P582 ?endTime . }

  BIND(YEAR(?startTime) AS ?startYear)
  BIND(YEAR(?endTime) AS ?endYear)

  OPTIONAL {
    ?club wdt:P17 ?country .
    ?country wdt:P298 ?clubCountryCode .
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?startYear`;
}

/**
 * Build a SPARQL query with name + birth year for disambiguation.
 * Used when multiple players share the same name (e.g., "Ronaldo").
 *
 * @param names - Array of player names
 * @param birthYears - Array of birth years (parallel to names, null for unknown)
 * @returns SPARQL query string
 */
export function buildBatchPlayerLookupQuery(
  names: string[],
  birthYears: (number | null)[]
): string {
  const valuesEntries = names
    .map((name) => {
      const escaped = name.replace(/"/g, '\\"');
      return `"${escaped}"@en`;
    })
    .join(' ');

  return `SELECT ?player ?playerLabel ?birthDate ?nationalityLabel ?positionLabel ?sitelinks WHERE {
  VALUES ?searchName { ${valuesEntries} }

  ?player rdfs:label ?searchName .
  ?player wdt:P106 wd:Q937857 .

  OPTIONAL { ?player wdt:P569 ?birthDate . }
  OPTIONAL {
    { ?player wdt:P1532 ?nationality }
    UNION
    { ?player wdt:P27 ?nationality . FILTER NOT EXISTS { ?player wdt:P1532 [] } }
  }
  OPTIONAL { ?player wdt:P413 ?position . }

  ?player wikibase:sitelinks ?sitelinks .

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}
