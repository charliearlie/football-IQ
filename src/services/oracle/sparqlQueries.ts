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

/**
 * Build a SPARQL query to fetch achievements for a specific player.
 *
 * Fetches two Wikidata properties:
 * - P166 (award received): Individual awards like Ballon d'Or, Golden Boot
 * - P1344 (participant in): Tournament participations (World Cup, Champions League)
 *
 * Qualifiers extracted:
 * - P585 (point in time): Year the award/participation occurred
 * - P54 (member of sports team): Club context for the achievement
 *
 * @param qid - Wikidata QID (e.g., "Q615" for Messi)
 * @returns SPARQL query string
 */
export function buildAchievementQuery(qid: string): string {
  return `SELECT ?achievement ?achievementLabel ?year ?club ?clubLabel WHERE {
  {
    # P166: Award received (individual awards)
    wd:${qid} p:P166 ?awardStatement .
    ?awardStatement ps:P166 ?achievement .
    OPTIONAL {
      ?awardStatement pq:P585 ?pointInTime .
      BIND(YEAR(?pointInTime) AS ?year)
    }
    OPTIONAL { ?awardStatement pq:P54 ?club . }
  }
  UNION
  {
    # P1344: Participant in (tournament editions)
    wd:${qid} p:P1344 ?participantStatement .
    ?participantStatement ps:P1344 ?event .

    # Resolve event to its parent competition (P361 = part of)
    ?event wdt:P361 ?achievement .

    OPTIONAL {
      ?event wdt:P580 ?startTime .
      BIND(YEAR(?startTime) AS ?year)
    }
    OPTIONAL { ?participantStatement pq:P54 ?club . }
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY ?year`;
}

/**
 * Parse raw SPARQL achievement results into structured data.
 *
 * @param bindings - Raw SPARQL result bindings
 * @returns Array of parsed achievement entries
 */
export interface ParsedAchievement {
  achievementQid: string;
  achievementLabel: string;
  year: number | null;
  clubQid: string | null;
  clubLabel: string | null;
}

export function parseSPARQLAchievementResults(
  bindings: Array<Record<string, { type: string; value: string }>>
): ParsedAchievement[] {
  return bindings.map((binding) => {
    const achievementUri = binding.achievement?.value ?? '';
    const achievementQid = achievementUri.split('/').pop() ?? '';
    const clubUri = binding.club?.value ?? '';
    const clubQid = clubUri ? clubUri.split('/').pop() ?? null : null;

    return {
      achievementQid,
      achievementLabel: binding.achievementLabel?.value ?? '',
      year: binding.year?.value ? parseInt(binding.year.value, 10) : null,
      clubQid,
      clubLabel: binding.clubLabel?.value ?? null,
    };
  });
}
