/**
 * API-Football v3 External ID Mapping Pipeline
 *
 * Maps our Wikidata QIDs to API-Football player IDs using
 * name search + birth year + nationality disambiguation.
 *
 * Safety: auto-stops at REQUEST_SAFETY_LIMIT to preserve trial quota.
 */

// ---------------------------------------------------------------------------
// Nationality map — copied from player-scout/actions.ts to avoid importing
// a "use server" module. Kept in sync manually.
// ---------------------------------------------------------------------------
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
  "soviet union": "RU", czechoslovakia: "CZ", yugoslavia: "RS",
  "federal republic of yugoslavia": "RS", "socialist federal republic of yugoslavia": "RS",
  "west germany": "DE", rhodesia: "ZW", "zimbabwe rhodesia": "ZW",
  "french guiana": "GF", "kingdom of the netherlands": "NL", "kingdom of denmark": "DK",
  "netherlands antilles": "NL", "people's republic of china": "CN", "the gambia": "GM",
  "commonwealth of independent states": "RU", "united kingdom of great britain and ireland": "GB",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ApiFootballPlayer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    birth: {
      date: string | null; // "YYYY-MM-DD" or null
      place: string;
      country: string;
    };
    nationality: string;
    photo: string;
  };
  // Present in /players response, absent in /players/profiles response
  statistics?: Array<{
    team?: { id: number; name: string };
    league?: { id: number; name: string; season: number };
    games?: { appearences: number }; // API typo is intentional
  }>;
}

export interface ApiFootballResponse {
  results: number;
  paging: { current: number; total: number };
  response: ApiFootballPlayer[];
  errors?: Record<string, string> | unknown[];
}

export interface ApiFootballTransfer {
  date: string; // "YYYY-MM-DD"
  teams: {
    in: { id: number; name: string };
    out: { id: number; name: string };
  };
}

export interface AmbiguousCandidate {
  apiFootballId: number;
  name: string;
  birthYear: number | null;
  nationality: string;
  photo: string | null;
}

export interface MappingResult {
  playerQid: string;
  playerName: string;
  apiFootballId: number | null;
  confidence: "high" | "medium" | "none";
  reason: string;
  candidates: number;
  /** For ambiguous matches: the list of high-confidence candidates to pick from */
  ambiguousCandidates?: AmbiguousCandidate[];
}

export interface MappingRunResult {
  mapped: MappingResult[];
  flaggedForReview: MappingResult[];
  skipped: MappingResult[];
  requestsUsed: number;
  requestBudget: number;
}

export interface AppearanceFromApi {
  clubName: string;
  apiClubId: number;
  startYear: number;
  endYear: number | null;
}

export interface SeasonOverlap {
  clubName: string;
  apiClubId: number;
  overlapStart: number;
  overlapEnd: number;
}

// /players/teams endpoint types
export interface ApiFootballTeamEntry {
  team: { id: number; name: string; logo: string };
  seasons: number[];
}

export interface ApiFootballTeamsResponse {
  results: number;
  response: ApiFootballTeamEntry[];
}

// Career comparison types
export interface OurAppearance {
  clubId: string;
  clubName: string;
  startYear: number | null;
  endYear: number | null;
}

export interface ApiClubSummary {
  apiClubId: number;
  clubName: string;
  startYear: number;
  endYear: number;
  seasons: number[];
}

export interface ClubMatch {
  ourClubId: string;
  ourClubName: string;
  apiClubId: number;
  apiClubName: string;
  ourYears: { start: number | null; end: number | null };
  apiYears: { start: number; end: number };
  yearDiffStart: number | null;
  yearDiffEnd: number | null;
}

export interface CareerComparison {
  matched: ClubMatch[];
  missingFromOurs: ApiClubSummary[];
  missingFromApi: OurAppearance[];
}

export interface PlayerCareerValidation {
  playerQid: string;
  playerName: string;
  apiFootballId: number;
  comparison: CareerComparison;
  totalDiscrepancies: number;
}

export interface ClubMapping {
  clubQid: string;
  clubName: string;
  apiFootballId: number;
  apiClubName: string;
  discoveredVia: string; // playerQid that led to this mapping
}

export interface CareerValidationResult {
  validated: PlayerCareerValidation[];
  errors: Array<{ playerQid: string; playerName: string; error: string }>;
  clubMappingsDiscovered: ClubMapping[];
  requestsUsed: number;
  requestBudget: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
export const REQUEST_SAFETY_LIMIT = 7000;     // 7500/day with headroom
export const DELAY_BETWEEN_REQUESTS_MS = 210;  // 300/min = 200ms + buffer
const MIN_SEARCH_LENGTH = 4; // API-Football minimum for search param
const PEAK_AGE = 28; // approximate peak career age for season estimation
const EARLIEST_API_SEASON = 2010; // API-Football v3 data starts around 2010
const CURRENT_SEASON = 2024;

// ---------------------------------------------------------------------------
// Nationality conversion
// ---------------------------------------------------------------------------

/**
 * Estimate the best API-Football season to search for a player.
 * Uses birth year + peak age, clamped to API data range.
 * Returns null if no birth year is provided.
 */
export function estimateSearchSeason(birthYear: number | null): number {
  if (birthYear == null) return CURRENT_SEASON;
  const peak = birthYear + PEAK_AGE;
  return Math.max(EARLIEST_API_SEASON, Math.min(peak, CURRENT_SEASON));
}

/**
 * Convert an API-Football nationality string (e.g. "Argentina") to our
 * ISO 3166-1 alpha-2 code (e.g. "AR"). Returns null if unknown.
 */
export function apiNationalityToISO(nationality: string): string | null {
  if (!nationality) return null;
  return NATION_LABEL_TO_ISO[nationality.toLowerCase().trim()] ?? null;
}

// ---------------------------------------------------------------------------
// API-Football HTTP layer
// ---------------------------------------------------------------------------

/**
 * Check an API-Football response for body-level errors.
 * The API returns HTTP 200 even on errors, embedding them in the JSON body.
 */
function checkApiFootballErrors(data: { errors?: ApiFootballResponse["errors"] }) {
  if (!data.errors) return;
  // /players/profiles returns errors as [] (empty array = no errors)
  // /players returns errors as {} (empty object = no errors)
  if (Array.isArray(data.errors)) {
    if (data.errors.length > 0) {
      throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
    }
  } else if (Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
  }
}

/**
 * Sanitize a player name for API-Football search.
 * The /players/profiles endpoint only accepts alpha-numeric characters and spaces.
 * Strips diacritics (é→e, ü→u, etc.) and removes other special characters.
 */
export function sanitizeSearchName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-zA-Z0-9\s]/g, " ") // replace non-alphanumeric with space
    .replace(/\s+/g, " ")            // collapse whitespace
    .trim();
}

/**
 * Search API-Football for players by name using the /players/profiles endpoint.
 * Unlike /players, this does NOT require league or team — just a search term.
 * Works for historical and current players alike.
 */
export async function searchApiFootballPlayer(
  name: string,
  apiKey: string
): Promise<ApiFootballResponse> {
  const sanitized = sanitizeSearchName(name);
  const url = new URL(`${API_FOOTBALL_BASE}/players/profiles`);
  url.searchParams.set("search", sanitized);

  const res = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `API-Football error ${res.status}: ${JSON.stringify(body)}`
    );
  }

  const data: ApiFootballResponse = await res.json();
  checkApiFootballErrors(data);
  return data;
}

// ---------------------------------------------------------------------------
// Match scoring
// ---------------------------------------------------------------------------

/**
 * Score how well an API-Football player matches our Wikidata record.
 *
 * - "high": birth year AND nationality both match
 * - "medium": only one matches
 * - "none": neither matches
 */
export function scoreMatch(
  ourPlayer: {
    name: string;
    birth_year: number | null;
    nationality_code: string | null;
  },
  apiPlayer: ApiFootballPlayer
): { confidence: "high" | "medium" | "none"; reason: string } {
  const apiBirthYear = parseBirthYear(apiPlayer.player.birth?.date);
  const apiNatCode = apiNationalityToISO(apiPlayer.player.nationality);

  const birthYearMatch =
    ourPlayer.birth_year != null &&
    apiBirthYear != null &&
    ourPlayer.birth_year === apiBirthYear;

  const nationalityMatch =
    ourPlayer.nationality_code != null &&
    apiNatCode != null &&
    ourPlayer.nationality_code === apiNatCode;

  if (birthYearMatch && nationalityMatch) {
    return {
      confidence: "high",
      reason: `Matched birth year (${ourPlayer.birth_year}) and nationality (${ourPlayer.nationality_code})`,
    };
  }

  if (birthYearMatch) {
    return {
      confidence: "medium",
      reason: `Matched birth year (${ourPlayer.birth_year}) but nationality differs (ours=${ourPlayer.nationality_code}, api=${apiNatCode})`,
    };
  }

  if (nationalityMatch) {
    return {
      confidence: "medium",
      reason: `Matched nationality (${ourPlayer.nationality_code}) but birth year differs (ours=${ourPlayer.birth_year}, api=${apiBirthYear})`,
    };
  }

  return {
    confidence: "none",
    reason: `No match: birth year (ours=${ourPlayer.birth_year}, api=${apiBirthYear}), nationality (ours=${ourPlayer.nationality_code}, api=${apiNatCode})`,
  };
}

function parseBirthYear(dateStr: string | null | undefined): number | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const year = parseInt(dateStr.substring(0, 4), 10);
  return isNaN(year) ? null : year;
}

// ---------------------------------------------------------------------------
// Single player resolution
// ---------------------------------------------------------------------------

type ScoredCandidate = {
  apiPlayer: ApiFootballPlayer;
  confidence: "high" | "medium" | "none";
  reason: string;
};

type ScoreOutcome = "high" | "ambiguous" | "medium" | "no_match" | "empty";

interface CandidateResult {
  outcome: ScoreOutcome;
  match?: ScoredCandidate;
  highMatches?: ScoredCandidate[];
  highCount?: number;
  totalCandidates: number;
}

function outcomePriority(outcome: ScoreOutcome): number {
  switch (outcome) {
    case "high": return 4;
    case "ambiguous": return 3;
    case "medium": return 2;
    case "no_match": return 1;
    case "empty": return 0;
  }
}

function scoreCandidates(
  response: ApiFootballResponse,
  ourPlayer: { name: string; birth_year: number | null; nationality_code: string | null }
): CandidateResult {
  if (response.results === 0 || response.response.length === 0) {
    return { outcome: "empty", totalCandidates: 0 };
  }

  const scored = response.response.map((apiPlayer) => ({
    apiPlayer,
    ...scoreMatch(ourPlayer, apiPlayer),
  }));

  const highMatches = scored.filter((s) => s.confidence === "high");
  const mediumMatches = scored.filter((s) => s.confidence === "medium");

  if (highMatches.length === 1) {
    return { outcome: "high", match: highMatches[0], totalCandidates: response.results };
  }
  if (highMatches.length > 1) {
    return { outcome: "ambiguous", highMatches, highCount: highMatches.length, totalCandidates: response.results };
  }
  if (mediumMatches.length > 0) {
    return { outcome: "medium", match: mediumMatches[0], totalCandidates: response.results };
  }
  return { outcome: "no_match", totalCandidates: response.results };
}

/**
 * Attempt to find the best API-Football match for a single player.
 * Returns a MappingResult with the match (or lack thereof).
 *
 * Does NOT count against the request budget — caller is responsible.
 * Returns `requestsUsed` is tracked by the caller in runMappingBatch.
 */
export async function resolveOnePlayer(
  player: {
    id: string;
    name: string;
    birth_year: number | null;
    nationality_code: string | null;
  },
  apiKey: string,
  options?: { season?: number; delayMs?: number }
): Promise<MappingResult & { _requestsUsed: number }> {
  const baseMappingResult: Omit<MappingResult, "confidence" | "reason" | "candidates" | "apiFootballId"> = {
    playerQid: player.id,
    playerName: player.name,
  };

  // Check minimum name length
  if (player.name.length < MIN_SEARCH_LENGTH) {
    return {
      ...baseMappingResult,
      apiFootballId: null,
      confidence: "none",
      reason: `Name "${player.name}" too short (min ${MIN_SEARCH_LENGTH} chars for API search)`,
      candidates: 0,
      _requestsUsed: 0,
    };
  }

  let requestsUsed = 0;
  try {
    // /players/profiles?search= — no league/team/season needed
    let response = await searchApiFootballPlayer(player.name, apiKey);
    requestsUsed++;

    // Score candidates from full-name search
    let bestResult = scoreCandidates(response, player);

    // Fallback: try last name when full name found nothing OR found results
    // but none matched. e.g. "Lionel Messi" → finds "Lionel Messi Nyamsi"
    // (wrong player), but "Messi" → finds "L. Messi" (the real one).
    const needsFallback =
      bestResult.outcome === "empty" || bestResult.outcome === "no_match";

    if (needsFallback) {
      const parts = sanitizeSearchName(player.name).trim().split(/\s+/);
      const lastName = parts[parts.length - 1];
      if (parts.length > 1 && lastName.length >= MIN_SEARCH_LENGTH) {
        if (options?.delayMs && options.delayMs > 0) {
          await new Promise((r) => setTimeout(r, options.delayMs));
        }
        response = await searchApiFootballPlayer(lastName, apiKey);
        requestsUsed++;
        const fallbackResult = scoreCandidates(response, player);
        // Use fallback if it got a better outcome
        if (outcomePriority(fallbackResult.outcome) > outcomePriority(bestResult.outcome)) {
          bestResult = fallbackResult;
        }
      }
    }

    // Return based on best result
    switch (bestResult.outcome) {
      case "high":
        return {
          ...baseMappingResult,
          apiFootballId: bestResult.match!.apiPlayer.player.id,
          confidence: "high",
          reason: bestResult.match!.reason,
          candidates: bestResult.totalCandidates,
          _requestsUsed: requestsUsed,
        };
      case "ambiguous":
        return {
          ...baseMappingResult,
          apiFootballId: null,
          confidence: "medium",
          reason: `Ambiguous: ${bestResult.highCount} candidates match birth year + nationality`,
          candidates: bestResult.totalCandidates,
          ambiguousCandidates: bestResult.highMatches?.map((h) => ({
            apiFootballId: h.apiPlayer.player.id,
            name: h.apiPlayer.player.name,
            birthYear: parseBirthYear(h.apiPlayer.player.birth?.date),
            nationality: h.apiPlayer.player.nationality,
            photo: h.apiPlayer.player.photo || null,
          })),
          _requestsUsed: requestsUsed,
        };
      case "medium": {
        const best = bestResult.match!;
        return {
          ...baseMappingResult,
          apiFootballId: best.apiPlayer.player.id,
          confidence: "medium",
          reason: `Best partial match: ${best.reason}`,
          candidates: bestResult.totalCandidates,
          ambiguousCandidates: [{
            apiFootballId: best.apiPlayer.player.id,
            name: best.apiPlayer.player.name,
            birthYear: parseBirthYear(best.apiPlayer.player.birth?.date),
            nationality: best.apiPlayer.player.nationality,
            photo: best.apiPlayer.player.photo || null,
          }],
          _requestsUsed: requestsUsed,
        };
      }
      case "no_match":
        return {
          ...baseMappingResult,
          apiFootballId: null,
          confidence: "none",
          reason: `${bestResult.totalCandidates} candidates but none matched birth year or nationality`,
          candidates: bestResult.totalCandidates,
          _requestsUsed: requestsUsed,
        };
      case "empty":
      default:
        return {
          ...baseMappingResult,
          apiFootballId: null,
          confidence: "none",
          reason: "No API results for search query",
          candidates: 0,
          _requestsUsed: requestsUsed,
        };
    }
  } catch (err) {
    return {
      ...baseMappingResult,
      apiFootballId: null,
      confidence: "none",
      reason: `API error: ${err instanceof Error ? err.message : String(err)}`,
      candidates: 0,
      _requestsUsed: requestsUsed,
    };
  }
}

// ---------------------------------------------------------------------------
// Batch pipeline
// ---------------------------------------------------------------------------

/**
 * Run the mapping pipeline for a batch of players.
 * Stops at requestBudget to preserve trial quota.
 */
export async function runMappingBatch(
  players: Array<{
    id: string;
    name: string;
    birth_year: number | null;
    nationality_code: string | null;
  }>,
  apiKey: string,
  options?: {
    requestBudget?: number;
    delayMs?: number;
    season?: number;
  }
): Promise<MappingRunResult> {
  const budget = options?.requestBudget ?? REQUEST_SAFETY_LIMIT;
  const delayMs = options?.delayMs ?? DELAY_BETWEEN_REQUESTS_MS;

  const mapped: MappingResult[] = [];
  const flaggedForReview: MappingResult[] = [];
  const skipped: MappingResult[] = [];
  let requestsUsed = 0;

  for (const player of players) {
    // Budget check
    if (requestsUsed >= budget) {
      break;
    }

    // Pre-flight skip: name too short
    if (player.name.length < MIN_SEARCH_LENGTH) {
      skipped.push({
        playerQid: player.id,
        playerName: player.name,
        apiFootballId: null,
        confidence: "none",
        reason: `Name "${player.name}" too short (min ${MIN_SEARCH_LENGTH} chars)`,
        candidates: 0,
      });
      continue;
    }

    // Pre-flight skip: missing birth_year (can't disambiguate safely)
    if (player.birth_year == null) {
      skipped.push({
        playerQid: player.id,
        playerName: player.name,
        apiFootballId: null,
        confidence: "none",
        reason: "Missing birth_year — cannot safely disambiguate",
        candidates: 0,
      });
      continue;
    }

    // Resolve
    const result = await resolveOnePlayer(player, apiKey, { season: options?.season, delayMs: delayMs });
    requestsUsed += result._requestsUsed;

    // Strip internal field
    const { _requestsUsed, ...mappingResult } = result;

    if (mappingResult.confidence === "high") {
      mapped.push(mappingResult);
    } else if (mappingResult.confidence === "medium") {
      flaggedForReview.push(mappingResult);
    } else {
      skipped.push(mappingResult);
    }

    // Rate limiting delay (skip for last item)
    if (delayMs > 0 && requestsUsed < budget) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    mapped,
    flaggedForReview,
    skipped,
    requestsUsed,
    requestBudget: budget,
  };
}

// ---------------------------------------------------------------------------
// Career data mapping (for future Chain verification)
// ---------------------------------------------------------------------------

/**
 * Map API-Football transfer history to our player_appearances format.
 * Infers club stints from sequential transfer records.
 */
export function mapApiTransferToAppearances(
  transfers: ApiFootballTransfer[],
  _playerQid: string
): AppearanceFromApi[] {
  if (!transfers || transfers.length === 0) return [];

  // Sort by date ascending
  const sorted = [...transfers].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const appearances: AppearanceFromApi[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const transfer = sorted[i];
    const transferYear = new Date(transfer.date).getFullYear();

    // The "out" team is where they were before this transfer
    if (i === 0 && transfer.teams.out.id) {
      // First transfer: we know the previous club but not when they joined
      appearances.push({
        clubName: transfer.teams.out.name,
        apiClubId: transfer.teams.out.id,
        startYear: transferYear, // approximate — we don't know the actual start
        endYear: transferYear,
      });
    }

    // The "in" team is where they went
    const nextTransfer = sorted[i + 1];
    const endYear = nextTransfer
      ? new Date(nextTransfer.date).getFullYear()
      : null;

    appearances.push({
      clubName: transfer.teams.in.name,
      apiClubId: transfer.teams.in.id,
      startYear: transferYear,
      endYear,
    });
  }

  return appearances;
}

/**
 * Detect overlapping seasons between two players' career appearances.
 * Uses the same interval overlap logic as The Chain's check_players_linked RPC:
 *   A.start <= B.end AND B.start <= A.end
 */
export function detectOverlappingSeasons(
  playerAAppearances: AppearanceFromApi[],
  playerBAppearances: AppearanceFromApi[]
): SeasonOverlap[] {
  const overlaps: SeasonOverlap[] = [];
  const currentYear = new Date().getFullYear();

  for (const a of playerAAppearances) {
    for (const b of playerBAppearances) {
      // Must be same club (by API club ID)
      if (a.apiClubId !== b.apiClubId) continue;

      const aEnd = a.endYear ?? currentYear;
      const bEnd = b.endYear ?? currentYear;

      // Check temporal overlap
      if (a.startYear <= bEnd && b.startYear <= aEnd) {
        overlaps.push({
          clubName: a.clubName,
          apiClubId: a.apiClubId,
          overlapStart: Math.max(a.startYear, b.startYear),
          overlapEnd: Math.min(aEnd, bEnd),
        });
      }
    }
  }

  return overlaps;
}

// ---------------------------------------------------------------------------
// Career validation (Phase 2)
// ---------------------------------------------------------------------------

const NATIONAL_TEAM_PATTERNS = /\bU\d{2}\b|national|olympic/i;

/**
 * Fetch all teams a player has played for from the /players/teams endpoint.
 * Returns one entry per team with all seasons they appeared in.
 */
export async function fetchPlayerTeams(
  apiFootballId: number,
  apiKey: string
): Promise<ApiFootballTeamEntry[]> {
  const url = new URL(`${API_FOOTBALL_BASE}/players/teams`);
  url.searchParams.set("player", String(apiFootballId));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": apiKey },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `API-Football error ${res.status}: ${JSON.stringify(body)}`
    );
  }

  const data: ApiFootballTeamsResponse & { errors?: Record<string, string> } = await res.json();
  checkApiFootballErrors(data);
  return data.response ?? [];
}

/**
 * Check if a team entry looks like a national team rather than a club.
 * Heuristic: name matches a known country from NATION_LABEL_TO_ISO,
 * or contains U17/U20/U23/Olympic patterns.
 */
export function isNationalTeam(teamName: string): boolean {
  if (NATIONAL_TEAM_PATTERNS.test(teamName)) return true;
  // Check if the base name (without U20 etc.) is a known country
  const baseName = teamName.replace(/\s+U\d{2}$/, "").trim();
  return NATION_LABEL_TO_ISO[baseName.toLowerCase()] != null;
}

/**
 * Convert /players/teams response to club summaries.
 * Filters out national and youth teams.
 */
export function apiTeamsToClubSummaries(
  teams: ApiFootballTeamEntry[]
): ApiClubSummary[] {
  return teams
    .filter((t) => !isNationalTeam(t.team.name) && t.seasons.length > 0)
    .map((t) => ({
      apiClubId: t.team.id,
      clubName: t.team.name,
      startYear: Math.min(...t.seasons),
      endYear: Math.max(...t.seasons),
      seasons: [...t.seasons].sort((a, b) => a - b),
    }));
}

/**
 * Normalize a club name for fuzzy matching.
 * Strips common prefixes/suffixes, lowercases, collapses whitespace.
 */
export function normalizeClubName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|sfc|ac|as|ss|us|rc|rcd|cd|ud|sd|bsc|bv|sv|vfb|tsv|fk|nk|sk|pk|if|bk)\b/g, "")
    .replace(/[.\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compare API-Football career data against our Wikidata-sourced appearances.
 *
 * Matching strategy (in priority order):
 * 1. By club ID: if our club already has an api_football_id, match directly
 * 2. By name + year overlap: normalized name matching as fallback for unmapped clubs
 *
 * @param clubIdMap - Map of our club QID → API-Football team ID (existing mappings)
 */
export function compareCareerData(
  apiClubs: ApiClubSummary[],
  ourAppearances: OurAppearance[],
  clubIdMap?: Map<string, number>
): CareerComparison {
  const matched: ClubMatch[] = [];
  const matchedApiIds = new Set<number>();
  const matchedOurKeys = new Set<string>();

  const ourKey = (o: OurAppearance) => o.clubId + ":" + (o.startYear ?? "");

  // Pass 1: Match by club ID (reliable — already-mapped clubs)
  if (clubIdMap && clubIdMap.size > 0) {
    for (const api of apiClubs) {
      for (const ours of ourAppearances) {
        if (matchedOurKeys.has(ourKey(ours))) continue;
        if (matchedApiIds.has(api.apiClubId)) continue;

        const mappedApiId = clubIdMap.get(ours.clubId);
        if (mappedApiId === api.apiClubId) {
          const yearDiffStart =
            ours.startYear != null ? api.startYear - ours.startYear : null;
          const yearDiffEnd =
            ours.endYear != null ? api.endYear - ours.endYear : null;

          matched.push({
            ourClubId: ours.clubId,
            ourClubName: ours.clubName,
            apiClubId: api.apiClubId,
            apiClubName: api.clubName,
            ourYears: { start: ours.startYear, end: ours.endYear },
            apiYears: { start: api.startYear, end: api.endYear },
            yearDiffStart,
            yearDiffEnd,
          });

          matchedApiIds.add(api.apiClubId);
          matchedOurKeys.add(ourKey(ours));
          break;
        }
      }
    }
  }

  // Pass 2: Name-based matching for remaining unmatched clubs
  for (const api of apiClubs) {
    if (matchedApiIds.has(api.apiClubId)) continue;

    const apiNorm = normalizeClubName(api.clubName);
    let bestMatch: OurAppearance | null = null;
    let bestScore = 0;

    for (const ours of ourAppearances) {
      if (matchedOurKeys.has(ourKey(ours))) continue;

      const ourNorm = normalizeClubName(ours.clubName);

      // Exact normalized match or one contains the other
      let score = 0;
      if (apiNorm === ourNorm) {
        score = 3;
      } else if (apiNorm.includes(ourNorm) || ourNorm.includes(apiNorm)) {
        score = 2;
      }

      // Boost if year ranges overlap
      if (score > 0 && ours.startYear != null) {
        const ourEnd = ours.endYear ?? new Date().getFullYear();
        if (api.startYear <= ourEnd && ours.startYear <= api.endYear) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = ours;
      }
    }

    if (bestMatch && bestScore >= 2) {
      const yearDiffStart =
        bestMatch.startYear != null ? api.startYear - bestMatch.startYear : null;
      const yearDiffEnd =
        bestMatch.endYear != null ? api.endYear - bestMatch.endYear : null;

      matched.push({
        ourClubId: bestMatch.clubId,
        ourClubName: bestMatch.clubName,
        apiClubId: api.apiClubId,
        apiClubName: api.clubName,
        ourYears: { start: bestMatch.startYear, end: bestMatch.endYear },
        apiYears: { start: api.startYear, end: api.endYear },
        yearDiffStart,
        yearDiffEnd,
      });

      matchedApiIds.add(api.apiClubId);
      matchedOurKeys.add(ourKey(bestMatch));
    }
  }

  const missingFromOurs = apiClubs.filter((a) => !matchedApiIds.has(a.apiClubId));
  const missingFromApi = ourAppearances.filter(
    (o) => !matchedOurKeys.has(ourKey(o))
  );

  return { matched, missingFromOurs, missingFromApi };
}

/**
 * Run career validation for a batch of already-mapped players.
 * Each player costs 1 API request (to /players/teams).
 *
 * Club ID mapping bootstrap: when a player's API club matches one of our
 * clubs by name, the discovered mapping (our QID → API team ID) is recorded.
 * These accumulate across the batch so later players benefit from earlier matches.
 *
 * @param existingClubMap - Pre-existing club QID → API Football ID mappings from DB
 */
export async function runCareerValidationBatch(
  players: Array<{
    playerQid: string;
    playerName: string;
    apiFootballId: number;
    ourAppearances: OurAppearance[];
  }>,
  apiKey: string,
  options?: {
    requestBudget?: number;
    delayMs?: number;
    existingClubMap?: Map<string, number>;
  }
): Promise<CareerValidationResult> {
  const budget = options?.requestBudget ?? REQUEST_SAFETY_LIMIT;
  const delayMs = options?.delayMs ?? DELAY_BETWEEN_REQUESTS_MS;

  // Accumulate club mappings: start with existing, grow as we discover new ones
  const clubIdMap = new Map<string, number>(options?.existingClubMap ?? []);
  const newClubMappings: ClubMapping[] = [];

  const validated: PlayerCareerValidation[] = [];
  const errors: CareerValidationResult["errors"] = [];
  let requestsUsed = 0;

  for (const player of players) {
    if (requestsUsed >= budget) break;

    try {
      const teams = await fetchPlayerTeams(player.apiFootballId, apiKey);
      requestsUsed++;

      const apiClubs = apiTeamsToClubSummaries(teams);
      const comparison = compareCareerData(apiClubs, player.ourAppearances, clubIdMap);

      // Extract new club mappings from matched clubs
      for (const match of comparison.matched) {
        if (!clubIdMap.has(match.ourClubId)) {
          clubIdMap.set(match.ourClubId, match.apiClubId);
          newClubMappings.push({
            clubQid: match.ourClubId,
            clubName: match.ourClubName,
            apiFootballId: match.apiClubId,
            apiClubName: match.apiClubName,
            discoveredVia: player.playerQid,
          });
        }
      }

      const totalDiscrepancies =
        comparison.missingFromOurs.length +
        comparison.missingFromApi.length +
        comparison.matched.filter(
          (m) =>
            (m.yearDiffStart != null && Math.abs(m.yearDiffStart) > 1) ||
            (m.yearDiffEnd != null && Math.abs(m.yearDiffEnd) > 1)
        ).length;

      validated.push({
        playerQid: player.playerQid,
        playerName: player.playerName,
        apiFootballId: player.apiFootballId,
        comparison,
        totalDiscrepancies,
      });
    } catch (err) {
      requestsUsed++;
      errors.push({
        playerQid: player.playerQid,
        playerName: player.playerName,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Rate limiting delay
    if (delayMs > 0 && requestsUsed < budget) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    validated,
    errors,
    clubMappingsDiscovered: newClubMappings,
    requestsUsed,
    requestBudget: budget,
  };
}
