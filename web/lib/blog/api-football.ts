/**
 * API-Football Client
 *
 * Fetches today's football fixtures, events, and tournament context
 * from the API-Sports football data API. Designed to stay within the
 * 100 requests/day free tier budget.
 *
 * Budget allocation:
 *   - fetchActiveTournaments: 1 request
 *   - fetchTodayFixtures: ~7 requests (5 core leagues + 2 cups)
 *   - fetchFixtureEvents: up to ~15 requests (top matches only)
 *   Total budget per run: ~23 requests
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

const CORE_LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "La Liga" },
  { id: 78, name: "Bundesliga" },
  { id: 135, name: "Serie A" },
  { id: 61, name: "Ligue 1" },
];

const EUROPEAN_CUPS = [
  { id: 2, name: "Champions League" },
  { id: 3, name: "Europa League" },
];

// Maximum fixture event requests to stay within budget
const MAX_EVENT_FETCHES = 15;

// ============================================================================
// TYPES
// ============================================================================

export interface FixtureTeam {
  id: number;
  name: string;
  logo: string;
}

export interface FixtureScore {
  home: number | null;
  away: number | null;
}

export interface FixtureVenue {
  id: number | null;
  name: string | null;
  city: string | null;
}

export interface FixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
}

export interface FixtureLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

export interface RawFixture {
  fixture: {
    id: number;
    date: string;
    venue: FixtureVenue;
    status: FixtureStatus;
  };
  league: FixtureLeague;
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals: FixtureScore;
  score: {
    halftime: FixtureScore;
    fulltime: FixtureScore;
    extratime: FixtureScore;
    penalty: FixtureScore;
  };
}

export interface FixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id: number; name: string };
  assist: { id: number | null; name: string | null };
  type: string; // "Goal", "Card", "subst", "Var"
  detail: string; // "Normal Goal", "Penalty", "Yellow Card", "Red Card", etc.
  comments: string | null;
}

export interface MatchResult {
  fixtureId: number;
  league: string;
  leagueId: number;
  country: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  halftimeHome: number;
  halftimeAway: number;
  venue: string | null;
  events: FixtureEvent[];
  goalscorers: string[];
  redCards: string[];
  penaltyShootout: FixtureScore | null;
}

export interface ActiveTournament {
  id: number;
  name: string;
  country: string;
  type: string;
  season: number;
}

export interface DailyFootballData {
  date: string;
  totalMatches: number;
  matches: MatchResult[];
  activeTournaments: ActiveTournament[];
  requestsUsed: number;
  hasData: boolean;
}

// ============================================================================
// HTTP UTILITIES
// ============================================================================

let requestCount = 0;

/**
 * Makes an authenticated request to the API-Football API.
 * Tracks request count for budget logging.
 */
async function apiFetch<T>(path: string): Promise<T | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    console.error("[API-Football] API key not configured");
    return null;
  }

  requestCount++;
  const url = `${API_FOOTBALL_BASE}${path}`;

  console.log(`[API-Football] Request #${requestCount}: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `[API-Football] HTTP ${response.status} for ${path}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json() as { response: T; errors?: Record<string, string> };

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("[API-Football] API errors:", data.errors);
      return null;
    }

    return data.response;
  } catch (error) {
    console.error(`[API-Football] Fetch error for ${path}:`, error);
    return null;
  }
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

/**
 * Derives the football season start year from a date.
 * European seasons span two years (e.g. 2025/26 runs Aug 2025 → May 2026).
 * The API-Football `season` param is the start year.
 */
function getSeasonYear(date: string): number {
  const d = new Date(date);
  const month = d.getUTCMonth(); // 0-indexed: 0=Jan, 7=Aug
  const year = d.getUTCFullYear();
  return month >= 7 ? year : year - 1;
}

/**
 * Fetches all finished fixtures for a given date and league.
 * Status FT = Full Time (match completed).
 */
export async function fetchTodayFixtures(date: string): Promise<RawFixture[]> {
  const allFixtures: RawFixture[] = [];
  const leagues = [...CORE_LEAGUES, ...EUROPEAN_CUPS];

  for (const league of leagues) {
    const season = getSeasonYear(date);
    const fixtures = await apiFetch<RawFixture[]>(
      `/fixtures?date=${date}&league=${league.id}&season=${season}&status=FT`
    );

    if (fixtures && Array.isArray(fixtures)) {
      allFixtures.push(...fixtures);
    }
  }

  console.log(
    `[API-Football] Found ${allFixtures.length} completed fixtures for ${date}`
  );

  return allFixtures;
}

/**
 * Fetches all events (goals, cards, substitutions) for a single fixture.
 */
export async function fetchFixtureEvents(
  fixtureId: number
): Promise<FixtureEvent[]> {
  const events = await apiFetch<FixtureEvent[]>(
    `/fixtures/events?fixture=${fixtureId}`
  );

  return events ?? [];
}

/**
 * Fetches currently active cup tournaments (World Cup, Euros, etc.)
 * to provide context about whether a major tournament is running.
 */
export async function fetchActiveTournaments(): Promise<ActiveTournament[]> {
  const leagues = await apiFetch<
    Array<{
      league: { id: number; name: string; type: string };
      country: { name: string };
      seasons: Array<{ year: number; current: boolean }>;
    }>
  >("/leagues?current=true&type=cup");

  if (!leagues || !Array.isArray(leagues)) {
    return [];
  }

  // Filter to major international and continental tournaments
  const majorTournamentKeywords = [
    "world cup",
    "euro",
    "copa america",
    "africa cup",
    "asian cup",
    "gold cup",
    "nations league",
    "champions league",
    "europa league",
    "conference league",
    "copa libertadores",
  ];

  const activeTournaments: ActiveTournament[] = leagues
    .filter((entry) => {
      const name = entry.league.name.toLowerCase();
      return majorTournamentKeywords.some((keyword) => name.includes(keyword));
    })
    .map((entry) => {
      const currentSeason = entry.seasons.find((s) => s.current);
      return {
        id: entry.league.id,
        name: entry.league.name,
        country: entry.country.name,
        type: entry.league.type,
        season: currentSeason?.year ?? new Date().getFullYear(),
      };
    });

  return activeTournaments;
}

// ============================================================================
// EVENT PARSING UTILITIES
// ============================================================================

/**
 * Extracts goalscorer names from fixture events.
 */
function extractGoalscorers(events: FixtureEvent[]): string[] {
  return events
    .filter(
      (e) =>
        e.type === "Goal" &&
        e.detail !== "Missed Penalty" &&
        e.player.name
    )
    .map((e) => {
      const suffix =
        e.detail === "Penalty"
          ? " (pen)"
          : e.detail === "Own Goal"
          ? " (og)"
          : "";
      return `${e.player.name}${suffix}`;
    });
}

/**
 * Extracts red card recipients from fixture events.
 */
function extractRedCards(events: FixtureEvent[]): string[] {
  return events
    .filter(
      (e) =>
        e.type === "Card" &&
        (e.detail === "Red Card" || e.detail === "Second Yellow Card") &&
        e.player.name
    )
    .map((e) => `${e.player.name} (${e.team.name})`);
}

/**
 * Determines if the match went to a penalty shootout.
 */
function getPenaltyShootout(fixture: RawFixture): FixtureScore | null {
  const { home, away } = fixture.score.penalty;
  if (home !== null && away !== null) {
    return { home, away };
  }
  return null;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Main entry point. Collects all football data for a given date:
 * fixtures, events for top matches, and active tournament context.
 *
 * Designed to respect the 100 requests/day API budget.
 */
export async function collectDailyFootballData(
  date: string
): Promise<DailyFootballData> {
  requestCount = 0;

  const empty: DailyFootballData = {
    date,
    totalMatches: 0,
    matches: [],
    activeTournaments: [],
    requestsUsed: 0,
    hasData: false,
  };

  try {
    // 1. Fetch active tournaments (1 request)
    const activeTournaments = await fetchActiveTournaments();

    // 2. Fetch today's completed fixtures across all tracked leagues (~7 requests)
    const rawFixtures = await fetchTodayFixtures(date);

    if (rawFixtures.length === 0) {
      console.log(`[API-Football] No completed matches found for ${date}`);
      return {
        ...empty,
        activeTournaments,
        requestsUsed: requestCount,
      };
    }

    // 3. Sort fixtures by league priority to fetch events for the most important matches first
    const leaguePriority: Record<number, number> = {
      2: 1,   // Champions League
      3: 2,   // Europa League
      39: 3,  // Premier League
      140: 4, // La Liga
      78: 5,  // Bundesliga
      135: 6, // Serie A
      61: 7,  // Ligue 1
    };

    const sortedFixtures = [...rawFixtures].sort((a, b) => {
      const priorityA = leaguePriority[a.league.id] ?? 99;
      const priorityB = leaguePriority[b.league.id] ?? 99;
      return priorityA - priorityB;
    });

    // 4. Fetch events for top matches (up to budget limit)
    const fixturesWithEvents = sortedFixtures.slice(0, MAX_EVENT_FETCHES);
    const eventMap = new Map<number, FixtureEvent[]>();

    for (const fixture of fixturesWithEvents) {
      const events = await fetchFixtureEvents(fixture.fixture.id);
      eventMap.set(fixture.fixture.id, events);
    }

    // 5. Build structured MatchResult objects
    const matches: MatchResult[] = rawFixtures.map((fixture) => {
      const events = eventMap.get(fixture.fixture.id) ?? [];
      const penaltyShootout = getPenaltyShootout(fixture);

      return {
        fixtureId: fixture.fixture.id,
        league: fixture.league.name,
        leagueId: fixture.league.id,
        country: fixture.league.country,
        round: fixture.league.round,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeGoals: fixture.goals.home ?? 0,
        awayGoals: fixture.goals.away ?? 0,
        halftimeHome: fixture.score.halftime.home ?? 0,
        halftimeAway: fixture.score.halftime.away ?? 0,
        venue: fixture.fixture.venue.name ?? null,
        events,
        goalscorers: extractGoalscorers(events),
        redCards: extractRedCards(events),
        penaltyShootout,
      };
    });

    console.log(
      `[API-Football] Collected ${matches.length} matches using ${requestCount} API requests`
    );

    return {
      date,
      totalMatches: matches.length,
      matches,
      activeTournaments,
      requestsUsed: requestCount,
      hasData: true,
    };
  } catch (error) {
    console.error("[API-Football] Fatal error in collectDailyFootballData:", error);
    return {
      ...empty,
      requestsUsed: requestCount,
    };
  }
}
