"use server";

import { createAdminClient } from "@/lib/supabase/server";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const BATCH_SIZE = 50;
const DELAY_MS = 1500; // Wikidata rate limit: ~1 req/s, be conservative

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerInput {
  name: string;
  date_of_birth?: string;
  nationality?: string;
  position?: string;
}

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

export interface BatchResult {
  resolved: ResolvedPlayer[];
  failed: string[];
  batchIndex: number;
  totalBatches: number;
}

// ─── SPARQL Query Builders ────────────────────────────────────────────────────

function buildBatchLookupQuery(names: string[]): string {
  const values = names
    .map((n) => `"${n.replace(/"/g, '\\"')}"@en`)
    .join(" ");

  // Search both rdfs:label (primary name) and skos:altLabel (aliases/nicknames)
  return `
    SELECT ?player ?playerLabel ?birthDate ?nationalityCode ?positionLabel ?sitelinks WHERE {
      VALUES ?searchLabel { ${values} }
      { ?player rdfs:label ?searchLabel }
      UNION
      { ?player skos:altLabel ?searchLabel }
      ?player wdt:P106 wd:Q937857 .
      OPTIONAL { ?player wdt:P569 ?birthDate }
      OPTIONAL { ?player wdt:P27/wdt:P298 ?nationalityCode }
      OPTIONAL { ?player wdt:P413 ?position }
      ?player wikibase:sitelinks ?sitelinks .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY DESC(?sitelinks)
  `;
}

function buildCareerQuery(qid: string): string {
  return `
    SELECT ?club ?clubLabel ?startYear ?endYear ?clubCountryCode WHERE {
      wd:${qid} p:P54 ?stmt .
      ?stmt ps:P54 ?club .
      ?club wdt:P31/wdt:P279* wd:Q476028 .
      OPTIONAL { ?stmt pq:P580 ?start }
      OPTIONAL { ?stmt pq:P582 ?end }
      BIND(YEAR(?start) AS ?startYear)
      BIND(YEAR(?end) AS ?endYear)
      OPTIONAL { ?club wdt:P17/wdt:P298 ?clubCountryCode }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY ?startYear
  `;
}

// ─── SPARQL Execution ─────────────────────────────────────────────────────────

async function executeSparql(query: string): Promise<Record<string, unknown>[]> {
  const url = `${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "FootballIQ-PlayerScout/1.0 (admin tool)",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SPARQL error ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = await response.json();
  return json.results?.bindings ?? [];
}

// ─── Data Mapping ─────────────────────────────────────────────────────────────

function extractQid(uri: string): string {
  const match = uri.match(/Q\d+$/);
  return match ? match[0] : uri;
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
  "sweeper": "Defender",
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

function categorizePosition(label: string | undefined): string | null {
  if (!label) return null;
  const lower = label.toLowerCase().trim();
  return POSITION_MAP[lower] ?? null;
}

// ─── Wikidata Search API (fuzzy fallback) ────────────────────────────────────

/**
 * Fuzzy search for a single player using Wikidata's wbsearchentities API.
 * Returns the best match QID if found, or null.
 */
async function searchWikidataEntity(name: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=5&format=json`;
  const response = await fetch(url, {
    headers: { "User-Agent": "FootballIQ-PlayerScout/1.0 (admin tool)" },
  });
  if (!response.ok) return null;
  const json = await response.json();
  const results = json.search ?? [];
  // Return first result QID (best match)
  return results.length > 0 ? results[0].id : null;
}

/**
 * Given a QID, fetch player metadata via SPARQL to verify it's a footballer
 * and extract birth year, nationality, position, sitelinks.
 */
async function verifyAndFetchPlayer(qid: string, originalName: string): Promise<ResolvedPlayer | null> {
  const query = `
    SELECT ?playerLabel ?birthDate ?nationalityCode ?positionLabel ?sitelinks WHERE {
      wd:${qid} wdt:P106 wd:Q937857 .
      OPTIONAL { wd:${qid} wdt:P569 ?birthDate }
      OPTIONAL { wd:${qid} wdt:P27/wdt:P298 ?nationalityCode }
      OPTIONAL { wd:${qid} wdt:P413 ?position }
      wd:${qid} wikibase:sitelinks ?sitelinks .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    LIMIT 1
  `;
  try {
    const bindings = await executeSparql(query);
    if (bindings.length === 0) return null; // Not a footballer
    const b = bindings[0] as Record<string, { value?: string }>;
    return {
      qid,
      name: b.playerLabel?.value ?? originalName,
      birthYear: extractYear(b.birthDate?.value),
      nationalityCode: b.nationalityCode?.value ?? null,
      positionCategory: categorizePosition(b.positionLabel?.value),
      sitelinks: parseInt(b.sitelinks?.value ?? "0", 10),
    };
  } catch {
    return null;
  }
}

// ─── Wikipedia URL Resolution ─────────────────────────────────────────────────

/**
 * Resolve a player from a Wikipedia URL.
 * Extracts the article title, looks up the Wikidata QID via the Wikipedia API,
 * then fetches player metadata via SPARQL.
 */
export async function resolvePlayerFromWikipedia(
  url: string
): Promise<{ player: ResolvedPlayer | null; error?: string }> {
  // Extract article title from URL (handles en.wikipedia.org/wiki/Title)
  const match = url.match(/wikipedia\.org\/wiki\/(.+?)(?:#.*)?$/);
  if (!match) {
    return { player: null, error: "Invalid Wikipedia URL" };
  }
  const title = decodeURIComponent(match[1].replace(/_/g, " "));

  // Use Wikipedia API to get Wikidata QID via pageprops
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(title)}&format=json&redirects=1`;
  const response = await fetch(apiUrl, {
    headers: { "User-Agent": "FootballIQ-PlayerScout/1.0 (admin tool)" },
  });

  if (!response.ok) {
    return { player: null, error: `Wikipedia API error: ${response.status}` };
  }

  const json = await response.json();
  const pages = json.query?.pages ?? {};
  const page = Object.values(pages)[0] as { pageprops?: { wikibase_item?: string } } | undefined;
  const qid = page?.pageprops?.wikibase_item;

  if (!qid) {
    return { player: null, error: `No Wikidata QID found for "${title}"` };
  }

  // Verify it's a footballer and fetch metadata
  const player = await verifyAndFetchPlayer(qid, title);
  if (!player) {
    return { player: null, error: `${title} (${qid}) is not tagged as a footballer on Wikidata` };
  }

  return { player };
}

// ─── Server Actions ───────────────────────────────────────────────────────────

/**
 * Resolve a batch of player names via Wikidata SPARQL.
 */
export async function resolvePlayerBatch(
  names: string[]
): Promise<{ resolved: ResolvedPlayer[]; failed: string[] }> {
  const query = buildBatchLookupQuery(names);
  const bindings = await executeSparql(query);

  const resolved: ResolvedPlayer[] = [];
  const foundNames = new Set<string>();

  for (const b of bindings as Record<string, { value?: string }>[] ) {
    const playerUri = b.player?.value;
    const name = b.playerLabel?.value;
    if (!playerUri || !name) continue;

    // Skip duplicates (keep highest sitelinks, which comes first due to ORDER BY)
    const nameLower = name.toLowerCase();
    if (foundNames.has(nameLower)) continue;
    foundNames.add(nameLower);

    resolved.push({
      qid: extractQid(playerUri),
      name,
      birthYear: extractYear(b.birthDate?.value),
      nationalityCode: b.nationalityCode?.value ?? null,
      positionCategory: categorizePosition(b.positionLabel?.value),
      sitelinks: parseInt(b.sitelinks?.value ?? "0", 10),
    });
  }

  // Find names that weren't resolved
  const resolvedNamesLower = new Set(resolved.map((p) => p.name.toLowerCase()));
  const failed = names.filter((n) => !resolvedNamesLower.has(n.toLowerCase()));

  return { resolved, failed };
}

/**
 * Fuzzy-resolve a single failed name via Wikidata search API + SPARQL verification.
 */
export async function resolvePlayerFuzzy(
  name: string
): Promise<ResolvedPlayer | null> {
  const qid = await searchWikidataEntity(name);
  if (!qid) return null;
  return verifyAndFetchPlayer(qid, name);
}

/**
 * Fetch career clubs for a player from Wikidata.
 */
export async function fetchPlayerCareer(qid: string): Promise<CareerEntry[]> {
  const query = buildCareerQuery(qid);
  const bindings = await executeSparql(query);

  return (bindings as Record<string, { value?: string }>[]).map((b) => ({
    clubQid: extractQid(b.club?.value ?? ""),
    clubName: b.clubLabel?.value ?? "Unknown",
    clubCountryCode: b.clubCountryCode?.value ?? null,
    startYear: b.startYear?.value ? parseInt(b.startYear.value, 10) : null,
    endYear: b.endYear?.value ? parseInt(b.endYear.value, 10) : null,
  })).filter((e) => e.clubQid.startsWith("Q"));
}

/**
 * Save resolved players to Supabase (upsert).
 */
export async function savePlayersToSupabase(
  players: ResolvedPlayer[]
): Promise<{ success: boolean; count: number; error?: string }> {
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

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  return { success: true, count: rows.length };
}

/**
 * Save career entries (clubs + appearances) to Supabase.
 */
export async function saveCareerToSupabase(
  playerQid: string,
  career: CareerEntry[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();

  // Upsert clubs — deduplicate by QID to avoid "cannot affect row a second time"
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

  // Delete existing appearances for this player, then insert fresh
  await supabase
    .from("player_appearances")
    .delete()
    .eq("player_id", playerQid);

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
 * Get current player count from Supabase.
 */
export async function getPlayerCount(): Promise<number> {
  const supabase = await createAdminClient();
  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

/**
 * Search existing players in Supabase.
 */
export async function searchExistingPlayers(
  query: string
): Promise<{ id: string; name: string; scout_rank: number }[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("players")
    .select("id, name, scout_rank")
    .ilike("search_name", `%${query.toLowerCase()}%`)
    .limit(20)
    .order("scout_rank", { ascending: false });
  return data ?? [];
}

/**
 * Get all player QIDs for Phase 2 career fetching.
 * Returns players in batches suitable for pagination.
 */
export async function getAllPlayerQids(): Promise<{ qid: string; name: string }[]> {
  const supabase = await createAdminClient();
  const allPlayers: { qid: string; name: string }[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from("players")
      .select("id, name")
      .order("name")
      .range(offset, offset + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    allPlayers.push(...data.map((p) => ({ qid: p.id, name: p.name })));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allPlayers;
}

/**
 * Get player QIDs that have NO career entries (no rows in player_appearances).
 */
export async function getPlayersWithoutCareers(): Promise<{ qid: string; name: string }[]> {
  const supabase = await createAdminClient();
  const allPlayers: { qid: string; name: string }[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  // Get all player IDs that DO have appearances
  const { data: withCareers } = await supabase
    .from("player_appearances")
    .select("player_id");
  const hasCareer = new Set((withCareers ?? []).map((r) => r.player_id));

  // Paginate through all players, filtering out those with careers
  while (true) {
    const { data } = await supabase
      .from("players")
      .select("id, name")
      .order("name")
      .range(offset, offset + PAGE_SIZE - 1);

    if (!data || data.length === 0) break;
    for (const p of data) {
      if (!hasCareer.has(p.id)) {
        allPlayers.push({ qid: p.id, name: p.name });
      }
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allPlayers;
}
