/**
 * Shared Wikidata SPARQL utilities.
 *
 * Extracted from player-scout/actions.ts so both admin tools and
 * the automated cron pipeline can reuse the same SPARQL logic.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { NATION_LABEL_TO_ISO } from "@/lib/nationality-map";

// ─── Constants ────────────────────────────────────────���──────────────────────

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const QID_PATTERN = /^Q\d+$/;

/** Top-5 European league Wikidata QIDs */
export const TOP_LEAGUE_QIDS: Record<string, string> = {
  "Premier League": "Q9448",
  "La Liga": "Q324867",
  "Serie A": "Q15804",
  "Bundesliga": "Q82595",
  "Ligue 1": "Q13394",
};

// ─── Types ─────────────��─────────────────────────────────────────────────────

export interface ResolvedPlayer {
  qid: string;
  name: string;
  birthYear: number | null;
  nationalityCode: string | null;
  positionCategory: string | null;
  sitelinks: number;
}

export interface CareerEntry {
  clubQid: string;
  clubName: string;
  clubCountryCode: string | null;
  startYear: number | null;
  endYear: number | null;
}

export interface ClubLeagueResult {
  clubQid: string;
  leagueLabel: string;
}

// ─── Helpers ─────���────────────────────────────���──────────────────────────────

export function assertValidQid(qid: string): void {
  if (!QID_PATTERN.test(qid)) {
    throw new Error(`Invalid Wikidata QID: ${qid}`);
  }
}

export function extractQid(uri: string): string | null {
  const match = uri.match(/Q\d+$/);
  return match ? match[0] : null;
}

function extractYear(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

const POSITION_MAP: Record<string, string> = {
  goalkeeper: "Goalkeeper",
  "association football goalkeeper": "Goalkeeper",
  defender: "Defender",
  "association football defender": "Defender",
  "centre-back": "Defender",
  "full-back": "Defender",
  "wing-back": "Defender",
  sweeper: "Defender",
  midfielder: "Midfielder",
  "association football midfielder": "Midfielder",
  "defensive midfielder": "Midfielder",
  "central midfielder": "Midfielder",
  "attacking midfielder": "Midfielder",
  forward: "Forward",
  "association football forward": "Forward",
  striker: "Forward",
  winger: "Forward",
  "centre-forward": "Forward",
};

function mapNationLabelToISO(label: string | undefined): string | null {
  if (!label) return null;
  return NATION_LABEL_TO_ISO[label.toLowerCase().trim()] ?? null;
}

function categorizePosition(label: string | undefined): string | null {
  if (!label) return null;
  const lower = label.toLowerCase().trim();
  return POSITION_MAP[lower] ?? null;
}

// ─── SPARQL Execution ────────────────────────────────────────────────────────

export async function executeSparql(
  query: string,
): Promise<Record<string, { value?: string }>[]> {
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "FootballIQ-DataPipeline/1.0 (automated refresh)",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SPARQL error ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  return json.results?.bindings ?? [];
}

/** Sleep helper for rate limiting between SPARQL calls. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── SPARQL Queries ──────���───────────────────────────────────────────────────

/**
 * Fetch career clubs for a player from Wikidata P54.
 * Filters to football clubs/teams only, excludes national teams.
 */
export async function fetchPlayerCareer(qid: string): Promise<CareerEntry[]> {
  assertValidQid(qid);

  const query = `
    SELECT ?club ?clubLabel ?startYear ?endYear ?clubCountryCode WHERE {
      wd:${qid} p:P54 ?stmt .
      ?stmt ps:P54 ?club .
      ?club wdt:P31/wdt:P279* ?type .
      VALUES ?type { wd:Q476028 wd:Q103229495 wd:Q20639856 wd:Q847017 }
      FILTER NOT EXISTS { ?club wdt:P31/wdt:P279* wd:Q6979593 }
      OPTIONAL { ?stmt pq:P580 ?start }
      OPTIONAL { ?stmt pq:P582 ?end }
      BIND(YEAR(?start) AS ?startYear)
      BIND(YEAR(?end) AS ?endYear)
      OPTIONAL { ?club wdt:P17/wdt:P298 ?clubCountryCode }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY ?startYear
  `;

  const bindings = await executeSparql(query);

  const seen = new Set<string>();
  return bindings
    .map((b) => {
      const clubQid = extractQid(b.club?.value ?? "");
      if (!clubQid) return null;
      const startYear = b.startYear?.value
        ? parseInt(b.startYear.value, 10)
        : null;
      const endYear = b.endYear?.value
        ? parseInt(b.endYear.value, 10)
        : null;
      const key = `${clubQid}|${startYear}|${endYear}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return {
        clubQid,
        clubName: b.clubLabel?.value ?? "Unknown",
        clubCountryCode: b.clubCountryCode?.value ?? null,
        startYear,
        endYear,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

/**
 * Batch-query league data for clubs via Wikidata P118.
 * Accepts up to 50 club QIDs per call.
 */
export async function fetchClubLeagues(
  clubQids: string[],
): Promise<ClubLeagueResult[]> {
  if (clubQids.length === 0) return [];

  const values = clubQids.map((q) => `wd:${q}`).join(" ");
  const query = `
    SELECT ?club ?leagueLabel WHERE {
      VALUES ?club { ${values} }
      ?club wdt:P118 ?league .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
  `;

  const bindings = await executeSparql(query);

  const seen = new Set<string>();
  return bindings
    .map((b) => {
      const clubQid = extractQid(b.club?.value ?? "");
      if (!clubQid || seen.has(clubQid)) return null;
      seen.add(clubQid);
      return {
        clubQid,
        leagueLabel: b.leagueLabel?.value ?? "",
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

/**
 * Discover all active players in a league via Wikidata.
 * Finds footballers with an open-ended P54 (member of sports team)
 * at a club whose P118 (league) matches the given league QID.
 */
export async function fetchLeagueSquadPlayers(
  leagueQid: string,
): Promise<ResolvedPlayer[]> {
  assertValidQid(leagueQid);

  const query = `
    SELECT DISTINCT ?player ?playerLabel ?birthDate ?nationalityLabel ?positionLabel ?sitelinks WHERE {
      ?player wdt:P106 wd:Q937857 ;
              p:P54 ?stmt .
      ?stmt ps:P54 ?club .
      ?club wdt:P118 wd:${leagueQid} .
      FILTER NOT EXISTS { ?stmt pq:P582 [] }
      OPTIONAL { ?player wdt:P569 ?birthDate }
      OPTIONAL {
        { ?player wdt:P1532 ?nationality }
        UNION
        { ?player wdt:P27 ?nationality . FILTER NOT EXISTS { ?player wdt:P1532 [] } }
      }
      OPTIONAL { ?player wdt:P413 ?position }
      ?player wikibase:sitelinks ?sitelinks .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY DESC(?sitelinks)
  `;

  const bindings = await executeSparql(query);

  const seen = new Set<string>();
  return bindings
    .map((b) => {
      const playerUri = b.player?.value;
      if (!playerUri) return null;
      const qid = extractQid(playerUri);
      if (!qid || seen.has(qid)) return null;
      seen.add(qid);
      return {
        qid,
        name: b.playerLabel?.value ?? "Unknown",
        birthYear: extractYear(b.birthDate?.value),
        nationalityCode: mapNationLabelToISO(b.nationalityLabel?.value),
        positionCategory: categorizePosition(b.positionLabel?.value),
        sitelinks: parseInt(b.sitelinks?.value ?? "0", 10),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

// ─── Database Persistence ───────────────��────────────────────────────────────

/**
 * Upsert resolved players to Supabase.
 */
export async function savePlayersToSupabase(
  players: ResolvedPlayer[],
): Promise<{ success: boolean; count: number; error?: string }> {
  if (players.length === 0) return { success: true, count: 0 };

  const supabase = await createAdminClient();

  const rows = players.map((p) => ({
    id: p.qid,
    name: p.name,
    search_name: p.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim(),
    scout_rank: p.sitelinks,
    birth_year: p.birthYear,
    position_category: p.positionCategory,
    nationality_code: p.nationalityCode,
  }));

  const { error } = await supabase.from("players").upsert(rows, {
    onConflict: "id",
  });

  if (error) return { success: false, count: 0, error: error.message };
  return { success: true, count: rows.length };
}

/**
 * Save career entries (clubs + appearances) to Supabase.
 * Deletes existing appearances for the player, then inserts fresh.
 */
export async function saveCareerToSupabase(
  playerQid: string,
  career: CareerEntry[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  // Upsert clubs
  const clubRowsAll = career.map((c) => ({
    id: c.clubQid,
    name: c.clubName,
    search_name: c.clubName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim(),
    country_code: c.clubCountryCode,
  }));
  const clubRows = [...new Map(clubRowsAll.map((c) => [c.id, c])).values()];

  if (clubRows.length > 0) {
    const { error: clubError } = await supabase
      .from("clubs")
      .upsert(clubRows, { onConflict: "id" });
    if (clubError) {
      return { success: false, error: `Clubs: ${clubError.message}` };
    }
  }

  // Delete existing appearances, then insert fresh
  const { error: deleteError } = await supabase
    .from("player_appearances")
    .delete()
    .eq("player_id", playerQid);

  if (deleteError) {
    return { success: false, error: `Appearances delete: ${deleteError.message}` };
  }

  const appearanceRows = career.map((c) => ({
    player_id: playerQid,
    club_id: c.clubQid,
    start_year: c.startYear,
    end_year: c.endYear,
  }));

  if (appearanceRows.length > 0) {
    const { error: appError } = await supabase
      .from("player_appearances")
      .insert(appearanceRows);
    if (appError) {
      return { success: false, error: `Appearances: ${appError.message}` };
    }
  }

  return { success: true };
}

/**
 * Update clubs.league for a batch of clubs.
 */
export async function updateClubLeagues(
  results: ClubLeagueResult[],
): Promise<{ updated: number; errors: number }> {
  const supabase = await createAdminClient();
  let updated = 0;
  let errors = 0;

  for (const r of results) {
    if (!r.leagueLabel) continue;
    const { error } = await supabase
      .from("clubs")
      .update({ league: r.leagueLabel })
      .eq("id", r.clubQid);
    if (error) {
      errors++;
    } else {
      updated++;
    }
  }

  return { updated, errors };
}

/**
 * Mark a player's career as recently refreshed.
 */
export async function markCareerRefreshed(playerQid: string): Promise<void> {
  const supabase = await createAdminClient();
  await supabase
    .from("players")
    .update({ career_refreshed_at: new Date().toISOString() })
    .eq("id", playerQid);
}
