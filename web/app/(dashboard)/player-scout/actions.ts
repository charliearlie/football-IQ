"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { ACHIEVEMENT_MAP } from "../../../../src/services/oracle/achievementMappings";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const QID_PATTERN = /^Q\d+$/;

function assertValidQid(qid: string): void {
  if (!QID_PATTERN.test(qid)) {
    throw new Error(`Invalid Wikidata QID: ${qid}`);
  }
}

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
    .map((n) => `"${n.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"@en`)
    .join(" ");

  // Search both rdfs:label (primary name) and skos:altLabel (aliases/nicknames)
  // Nationality: prefer P1532 (country for sport) over P27 (citizenship)
  // to distinguish England/Scotland/Wales/NIR from generic "United Kingdom".
  // Fetches the nation label for mapping through NATION_TO_ISO.
  return `
    SELECT ?player ?playerLabel ?searchLabel ?birthDate ?nationalityLabel ?positionLabel ?sitelinks WHERE {
      VALUES ?searchLabel { ${values} }
      { ?player rdfs:label ?searchLabel }
      UNION
      { ?player skos:altLabel ?searchLabel }
      ?player wdt:P106 wd:Q937857 .
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
}

function buildCareerQuery(qid: string): string {
  assertValidQid(qid);
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

function extractQid(uri: string): string | null {
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

/**
 * Map a Wikidata nationality entity label to ISO code.
 * Handles GB home nations (England → GB-ENG, etc.)
 * and standard countries (France → FR, etc.)
 */
const NATION_LABEL_TO_ISO: Record<string, string> = {
  england: "GB-ENG", scotland: "GB-SCT", wales: "GB-WLS", "northern ireland": "GB-NIR",
  afghanistan: "AF", albania: "AL", algeria: "DZ", andorra: "AD", angola: "AO",
  "antigua and barbuda": "AG", argentina: "AR", armenia: "AM", australia: "AU", austria: "AT",
  azerbaijan: "AZ", bahrain: "BH", bangladesh: "BD", barbados: "BB", belarus: "BY",
  belgium: "BE", benin: "BJ", bermuda: "BM", bolivia: "BO",
  "bosnia and herzegovina": "BA", botswana: "BW", brazil: "BR", bulgaria: "BG",
  "burkina faso": "BF", burundi: "BI", cameroon: "CM", canada: "CA", "cape verde": "CV",
  "central african republic": "CF", chad: "TD", chile: "CL", china: "CN", colombia: "CO",
  comoros: "KM", congo: "CG", "democratic republic of the congo": "CD", "costa rica": "CR",
  croatia: "HR", cuba: "CU", "curaçao": "CW", curacao: "CW", cyprus: "CY",
  "czech republic": "CZ", czechia: "CZ", denmark: "DK", "dominican republic": "DO",
  ecuador: "EC", egypt: "EG", "el salvador": "SV", "equatorial guinea": "GQ",
  eritrea: "ER", estonia: "EE", ethiopia: "ET", "faroe islands": "FO", fiji: "FJ",
  finland: "FI", france: "FR", gabon: "GA", gambia: "GM", georgia: "GE", germany: "DE",
  ghana: "GH", gibraltar: "GI", greece: "GR", grenada: "GD", guatemala: "GT",
  guinea: "GN", "guinea-bissau": "GW", guyana: "GY", haiti: "HT", honduras: "HN",
  "hong kong": "HK", hungary: "HU", iceland: "IS", india: "IN", indonesia: "ID",
  iran: "IR", iraq: "IQ", ireland: "IE", "republic of ireland": "IE", israel: "IL",
  italy: "IT", "ivory coast": "CI", "côte d'ivoire": "CI", jamaica: "JM", japan: "JP",
  jordan: "JO", kazakhstan: "KZ", kenya: "KE", kosovo: "XK", kuwait: "KW",
  latvia: "LV", lebanon: "LB", liberia: "LR", libya: "LY", liechtenstein: "LI",
  lithuania: "LT", luxembourg: "LU", "north macedonia": "MK", madagascar: "MG",
  malawi: "MW", malaysia: "MY", mali: "ML", malta: "MT", mauritania: "MR",
  mauritius: "MU", mexico: "MX", moldova: "MD", montenegro: "ME", morocco: "MA",
  mozambique: "MZ", namibia: "NA", nepal: "NP", netherlands: "NL", "new zealand": "NZ",
  nicaragua: "NI", niger: "NE", nigeria: "NG", norway: "NO", oman: "OM", pakistan: "PK",
  palestine: "PS", panama: "PA", paraguay: "PY", peru: "PE", philippines: "PH",
  poland: "PL", portugal: "PT", qatar: "QA", romania: "RO", russia: "RU", rwanda: "RW",
  "saint kitts and nevis": "KN", "saint lucia": "LC", samoa: "WS", "san marino": "SM",
  "saudi arabia": "SA", senegal: "SN", serbia: "RS", "serbia and montenegro": "RS",
  seychelles: "SC", "sierra leone": "SL", singapore: "SG", slovakia: "SK", slovenia: "SI",
  somalia: "SO", "south africa": "ZA", "south korea": "KR", "korea republic": "KR",
  spain: "ES", "sri lanka": "LK", sudan: "SD", suriname: "SR", sweden: "SE",
  switzerland: "CH", syria: "SY", taiwan: "TW", tanzania: "TZ", thailand: "TH",
  togo: "TG", "trinidad and tobago": "TT", tunisia: "TN", turkey: "TR", "türkiye": "TR",
  uganda: "UG", ukraine: "UA", "united arab emirates": "AE",
  "united kingdom": "GB", "united states of america": "US", "united states": "US",
  uruguay: "UY", uzbekistan: "UZ", venezuela: "VE", vietnam: "VN", zambia: "ZM",
  zimbabwe: "ZW",
  // Historical / dissolved states
  "soviet union": "RU", czechoslovakia: "CZ", yugoslavia: "RS",
  "federal republic of yugoslavia": "RS", "socialist federal republic of yugoslavia": "RS",
  "west germany": "DE", rhodesia: "ZW", "zimbabwe rhodesia": "ZW",
  "french guiana": "GF", "kingdom of the netherlands": "NL", "kingdom of denmark": "DK",
  "netherlands antilles": "NL", "people's republic of china": "CN", "the gambia": "GM",
  "commonwealth of independent states": "RU", "united kingdom of great britain and ireland": "GB",
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
  assertValidQid(qid);
  const query = `
    SELECT ?playerLabel ?birthDate ?nationalityLabel ?positionLabel ?sitelinks WHERE {
      wd:${qid} wdt:P106 wd:Q937857 .
      OPTIONAL { wd:${qid} wdt:P569 ?birthDate }
      OPTIONAL {
        { wd:${qid} wdt:P1532 ?nationality }
        UNION
        { wd:${qid} wdt:P27 ?nationality . FILTER NOT EXISTS { wd:${qid} wdt:P1532 [] } }
      }
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
      nationalityCode: mapNationLabelToISO(b.nationalityLabel?.value),
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
  // Track all matched search labels (including alt-labels) for failed-list comparison
  const matchedSearchLabels = new Set<string>();

  for (const b of bindings as Record<string, { value?: string }>[] ) {
    const playerUri = b.player?.value;
    const name = b.playerLabel?.value;
    const searchLabel = b.searchLabel?.value;
    if (!playerUri || !name) continue;

    // Record the search label that produced this match (may differ from playerLabel for alt-label matches)
    if (searchLabel) {
      matchedSearchLabels.add(searchLabel.toLowerCase());
    }

    // Skip duplicates (keep highest sitelinks, which comes first due to ORDER BY)
    const nameLower = name.toLowerCase();
    if (foundNames.has(nameLower)) continue;
    foundNames.add(nameLower);

    const qid = extractQid(playerUri);
    if (!qid) continue;

    resolved.push({
      qid,
      name,
      birthYear: extractYear(b.birthDate?.value),
      nationalityCode: mapNationLabelToISO(b.nationalityLabel?.value),
      positionCategory: categorizePosition(b.positionLabel?.value),
      sitelinks: parseInt(b.sitelinks?.value ?? "0", 10),
    });
  }

  // Find names that weren't resolved — check against matched search labels
  // (not playerLabel) so alt-label matches aren't reported as failures
  const failed = names.filter((n) => !matchedSearchLabels.has(n.toLowerCase()));

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

  return (bindings as Record<string, { value?: string }>[])
    .map((b) => {
      const clubQid = extractQid(b.club?.value ?? "");
      if (!clubQid) return null;
      return {
        clubQid,
        clubName: b.clubLabel?.value ?? "Unknown",
        clubCountryCode: b.clubCountryCode?.value ?? null,
        startYear: b.startYear?.value ? parseInt(b.startYear.value, 10) : null,
        endYear: b.endYear?.value ? parseInt(b.endYear.value, 10) : null,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
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
    .ilike("search_name", `%${query.toLowerCase().replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`)
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
 * Uses paginated fetch of DISTINCT player_ids to build the exclusion set,
 * since Supabase caps unpaginated queries at 1,000 rows.
 */
export async function getPlayersWithoutCareers(): Promise<{ qid: string; name: string }[]> {
  const supabase = await createAdminClient();

  // Paginate through player_appearances to get ALL player_ids that have careers
  const hasCareer = new Set<string>();
  const APP_PAGE = 1000;
  let appOffset = 0;
  while (true) {
    const { data } = await supabase
      .from("player_appearances")
      .select("player_id")
      .order("player_id")
      .range(appOffset, appOffset + APP_PAGE - 1);

    if (!data || data.length === 0) break;
    for (const r of data) hasCareer.add(r.player_id);
    if (data.length < APP_PAGE) break;
    appOffset += APP_PAGE;
  }

  // Paginate through all players, filtering out those with careers
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

/**
 * Sync a single player's career from Wikidata by their QID.
 * Used for quickly fixing a specific player's missing data.
 */
export async function syncPlayerCareerByQid(
  qid: string
): Promise<{ success: boolean; name?: string; careerCount?: number; error?: string }> {
  try {
    assertValidQid(qid);
    const supabase = await createAdminClient();

    // Get player name
    const { data: player } = await supabase
      .from("players")
      .select("name")
      .eq("id", qid)
      .single();

    if (!player) {
      return { success: false, error: `Player ${qid} not found in database` };
    }

    // Fetch career from Wikidata
    const career = await fetchPlayerCareer(qid);
    if (career.length === 0) {
      return { success: false, name: player.name, error: "No career data found on Wikidata" };
    }

    // Save to database
    const saveResult = await saveCareerToSupabase(qid, career);
    if (!saveResult.success) {
      return { success: false, name: player.name, error: saveResult.error };
    }

    return { success: true, name: player.name, careerCount: career.length };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Achievement Fetching & Sync ─────────────────────────────────────────────

export interface AchievementEntry {
  achievementQid: string;
  name: string;
  category: "Individual" | "Club" | "International";
  year: number | null;
  clubQid: string | null;
  clubName: string | null;
}

/**
 * Fetch achievements for a player from Wikidata via SPARQL.
 * Queries P166 (award received) and P1344 (participant in → competition edition).
 * Filters results through the curated ACHIEVEMENT_MAP whitelist.
 */
export async function fetchPlayerAchievements(
  qid: string
): Promise<AchievementEntry[]> {
  assertValidQid(qid);

  const query = `
    SELECT ?achievement ?achievementLabel ?year ?club ?clubLabel WHERE {
      {
        wd:${qid} p:P166 ?stmt .
        ?stmt ps:P166 ?achievement .
        OPTIONAL { ?stmt pq:P585 ?date }
        OPTIONAL { ?stmt pq:P54 ?club }
        BIND(YEAR(?date) AS ?year)
      }
      UNION
      {
        wd:${qid} p:P1344 ?stmt .
        ?stmt ps:P1344 ?edition .
        ?edition wdt:P361 ?achievement .
        OPTIONAL { ?stmt pq:P585 ?date }
        OPTIONAL { ?edition wdt:P580 ?startDate }
        OPTIONAL { ?stmt pq:P54 ?club }
        BIND(COALESCE(YEAR(?date), YEAR(?startDate)) AS ?year)
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
    }
    ORDER BY ?year
  `;

  const bindings = await executeSparql(query);
  const results: AchievementEntry[] = [];
  const seen = new Set<string>();

  for (const b of bindings as Record<string, { value?: string }>[]) {
    const achievementUri = b.achievement?.value;
    if (!achievementUri) continue;

    const achievementQid = extractQid(achievementUri);
    if (!achievementQid || !(achievementQid in ACHIEVEMENT_MAP)) continue;

    const year = b.year?.value ? parseInt(b.year.value, 10) : null;
    const dedupeKey = `${achievementQid}-${year ?? "null"}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const def = ACHIEVEMENT_MAP[achievementQid];
    const clubUri = b.club?.value;
    const clubQid = clubUri ? extractQid(clubUri) : null;

    results.push({
      achievementQid,
      name: def.name,
      category: def.category,
      year,
      clubQid,
      clubName: b.clubLabel?.value ?? null,
    });
  }

  return results;
}

/**
 * Save fetched achievements to Supabase.
 * Upserts clubs referenced by achievements, then replaces all
 * player_achievements for this player, and recalculates stats_cache.
 */
export async function saveAchievementsToSupabase(
  playerQid: string,
  achievements: AchievementEntry[]
): Promise<{ success: boolean; count: number; statsCache?: Record<string, number>; error?: string }> {
  const supabase = await createAdminClient();

  // Upsert any clubs referenced by achievements
  const clubRows = achievements
    .filter((a) => a.clubQid && a.clubName)
    .map((a) => ({
      id: a.clubQid!,
      name: a.clubName!,
      search_name: a.clubName!
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim(),
    }));

  const uniqueClubs = [...new Map(clubRows.map((c) => [c.id, c])).values()];
  if (uniqueClubs.length > 0) {
    const { error: clubError } = await supabase
      .from("clubs")
      .upsert(uniqueClubs, { onConflict: "id" });
    if (clubError) {
      return { success: false, count: 0, error: `Clubs: ${clubError.message}` };
    }
  }

  // Atomically replace achievements using stored procedure (single transaction)
  const achievementsPayload = achievements.map((a) => ({
    achievement_id: a.achievementQid,
    year: a.year,
    club_id: a.clubQid,
  }));

  const { error: replaceError } = await (supabase.rpc as unknown as (
    fn: string,
    params: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>)(
    "replace_player_achievements",
    { p_player_id: playerQid, p_achievements: achievementsPayload }
  );

  if (replaceError) {
    return { success: false, count: 0, error: `Replace: ${replaceError.message}` };
  }

  // Recalculate stats_cache via the database function
  // (trigger should handle this, but call explicitly to get the result)
  // Note: calculate_player_stats RPC not in generated types, cast to allow access
  const { data: statsData, error: statsError } = (await (supabase as unknown as { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> })
    .rpc("calculate_player_stats", { target_player_id: playerQid }));

  if (statsError) {
    console.error("[saveAchievements] stats_cache calc failed:", statsError.message);
  }

  const typedStatsData = statsData as Record<string, number> | null;

  // Bump elite index version so mobile clients pick up changes
  const { error: bumpError } = await supabase
    .rpc("bump_elite_index_version");

  if (bumpError) {
    console.error("[saveAchievements] version bump failed:", bumpError.message);
  }

  return {
    success: true,
    count: achievements.length,
    statsCache: typedStatsData ?? undefined,
  };
}

/**
 * Full sync: fetch achievements from Wikidata and save to Supabase.
 * Convenience wrapper combining fetch + save for the CMS button.
 */
export async function syncPlayerAchievements(
  playerQid: string
): Promise<{ success: boolean; count: number; statsCache?: Record<string, number>; error?: string }> {
  try {
    assertValidQid(playerQid);
    const achievements = await fetchPlayerAchievements(playerQid);
    return await saveAchievementsToSupabase(playerQid, achievements);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}
