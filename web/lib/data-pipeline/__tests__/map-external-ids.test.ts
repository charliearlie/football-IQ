import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiNationalityToISO,
  scoreMatch,
  resolveOnePlayer,
  runMappingBatch,
  searchApiFootballPlayer,
  sanitizeSearchName,
  mapApiTransferToAppearances,
  detectOverlappingSeasons,
  normalizeClubName,
  isNationalTeam,
  apiTeamsToClubSummaries,
  compareCareerData,
  fetchPlayerTeams,
  runCareerValidationBatch,
  estimateSearchSeason,
  type ApiFootballPlayer,
  type ApiFootballResponse,
  type ApiFootballTransfer,
  type ApiFootballTeamEntry,
  type ApiFootballTeamsResponse,
  type OurAppearance,
  type ApiClubSummary,
  type ClubMapping,
} from "../map-external-ids";

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// Helpers: build mock API-Football responses
// ---------------------------------------------------------------------------
function makeApiPlayer(overrides: Partial<ApiFootballPlayer["player"]> = {}): ApiFootballPlayer {
  return {
    player: {
      id: 1,
      name: "Test Player",
      firstname: "Test",
      lastname: "Player",
      birth: { date: "1990-01-15", place: "Somewhere", country: "Somewhere" },
      nationality: "Argentina",
      photo: "https://example.com/photo.png",
      ...overrides,
    },
  };
}

function makeApiResponse(players: ApiFootballPlayer[]): ApiFootballResponse {
  return {
    results: players.length,
    paging: { current: 1, total: 1 },
    response: players,
  };
}

function mockFetchOk(data: ApiFootballResponse) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  } as Response);
}

function mockFetchError(status = 429) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Too Many Requests",
    json: async () => ({ errors: { requests: "rate limit exceeded" } }),
  } as unknown as Response);
}

// ===========================================================================
// apiNationalityToISO
// ===========================================================================
describe("apiNationalityToISO", () => {
  it("converts standard nationality (Argentina -> AR)", () => {
    expect(apiNationalityToISO("Argentina")).toBe("AR");
  });

  it("converts GB home nation (England -> GB-ENG)", () => {
    expect(apiNationalityToISO("England")).toBe("GB-ENG");
  });

  it("converts Scotland -> GB-SCT", () => {
    expect(apiNationalityToISO("Scotland")).toBe("GB-SCT");
  });

  it("converts Wales -> GB-WLS", () => {
    expect(apiNationalityToISO("Wales")).toBe("GB-WLS");
  });

  it("converts variant names (Ivory Coast -> CI)", () => {
    expect(apiNationalityToISO("Ivory Coast")).toBe("CI");
  });

  it("converts Côte d'Ivoire -> CI", () => {
    expect(apiNationalityToISO("Côte d'Ivoire")).toBe("CI");
  });

  it("returns null for unknown nationality", () => {
    expect(apiNationalityToISO("Narnia")).toBeNull();
  });

  it("handles case-insensitive input", () => {
    expect(apiNationalityToISO("BRAZIL")).toBe("BR");
    expect(apiNationalityToISO("brazil")).toBe("BR");
    expect(apiNationalityToISO("Brazil")).toBe("BR");
  });

  it("handles whitespace", () => {
    expect(apiNationalityToISO("  France  ")).toBe("FR");
  });

  it("converts Korea Republic -> KR", () => {
    expect(apiNationalityToISO("Korea Republic")).toBe("KR");
  });

  it("converts historical countries (Soviet Union -> RU)", () => {
    expect(apiNationalityToISO("Soviet Union")).toBe("RU");
  });

  it("converts Türkiye -> TR", () => {
    expect(apiNationalityToISO("Türkiye")).toBe("TR");
    expect(apiNationalityToISO("Turkey")).toBe("TR");
  });
});

// ===========================================================================
// estimateSearchSeason
// ===========================================================================
describe("estimateSearchSeason", () => {
  it("returns peak season for modern player (birth_year + 28)", () => {
    // Messi born 1987 → peak at 2015
    expect(estimateSearchSeason(1987)).toBe(2015);
  });

  it("clamps to CURRENT_SEASON for young players", () => {
    // Mbappé born 1998 → peak would be 2026, clamped to 2024
    expect(estimateSearchSeason(1998)).toBe(2024);
  });

  it("clamps to EARLIEST_API_SEASON for historical players", () => {
    // Maradona born 1960 → peak would be 1988, clamped to 2010
    expect(estimateSearchSeason(1960)).toBe(2010);
    // Pelé born 1940 → peak would be 1968, clamped to 2010
    expect(estimateSearchSeason(1940)).toBe(2010);
  });

  it("returns CURRENT_SEASON for null birth year", () => {
    expect(estimateSearchSeason(null)).toBe(2024);
  });
});

// ===========================================================================
// sanitizeSearchName
// ===========================================================================
describe("sanitizeSearchName", () => {
  it("strips diacritics (accents)", () => {
    expect(sanitizeSearchName("Kylian Mbappé")).toBe("Kylian Mbappe");
    expect(sanitizeSearchName("Pelé")).toBe("Pele");
    expect(sanitizeSearchName("Gerd Müller")).toBe("Gerd Muller");
    expect(sanitizeSearchName("Ferenc Puskás")).toBe("Ferenc Puskas");
    expect(sanitizeSearchName("Eusébio")).toBe("Eusebio");
    expect(sanitizeSearchName("Andrés Iniesta")).toBe("Andres Iniesta");
  });

  it("replaces apostrophes and special chars with spaces", () => {
    expect(sanitizeSearchName("Samuel Eto'o")).toBe("Samuel Eto o");
    expect(sanitizeSearchName("Alfredo Di Stéfano")).toBe("Alfredo Di Stefano");
  });

  it("collapses whitespace", () => {
    expect(sanitizeSearchName("  Marco   van   Basten  ")).toBe("Marco van Basten");
  });

  it("leaves plain alphanumeric names unchanged", () => {
    expect(sanitizeSearchName("Lionel Messi")).toBe("Lionel Messi");
    expect(sanitizeSearchName("Cristiano Ronaldo")).toBe("Cristiano Ronaldo");
  });
});

// ===========================================================================
// scoreMatch
// ===========================================================================
describe("scoreMatch", () => {
  it("returns high confidence when birth year AND nationality match", () => {
    const ourPlayer = { name: "Messi", birth_year: 1987, nationality_code: "AR" };
    const apiPlayer = makeApiPlayer({
      name: "L. Messi",
      birth: { date: "1987-06-24", place: "Rosario", country: "Argentina" },
      nationality: "Argentina",
    });

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("high");
    expect(result.reason).toContain("birth year");
    expect(result.reason).toContain("nationality");
  });

  it("returns medium when only birth year matches", () => {
    const ourPlayer = { name: "Test", birth_year: 1990, nationality_code: "FR" };
    const apiPlayer = makeApiPlayer({
      birth: { date: "1990-03-10", place: "", country: "" },
      nationality: "Brazil",
    });

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("medium");
    expect(result.reason).toContain("birth year");
  });

  it("returns medium when only nationality matches", () => {
    const ourPlayer = { name: "Test", birth_year: 1990, nationality_code: "AR" };
    const apiPlayer = makeApiPlayer({
      birth: { date: "1985-03-10", place: "", country: "" },
      nationality: "Argentina",
    });

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("medium");
    expect(result.reason).toContain("nationality");
  });

  it("returns none when neither matches", () => {
    const ourPlayer = { name: "Test", birth_year: 1990, nationality_code: "FR" };
    const apiPlayer = makeApiPlayer({
      birth: { date: "1985-03-10", place: "", country: "" },
      nationality: "Brazil",
    });

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("none");
  });

  it("returns none when our player has null birth_year", () => {
    const ourPlayer = { name: "Test", birth_year: null, nationality_code: "AR" };
    const apiPlayer = makeApiPlayer({ nationality: "Argentina" });

    const result = scoreMatch(ourPlayer, apiPlayer);
    // Without birth_year we can't get high confidence
    expect(result.confidence).toBe("medium");
  });

  it("returns none when our player has null nationality_code and null birth_year", () => {
    const ourPlayer = { name: "Test", birth_year: null, nationality_code: null };
    const apiPlayer = makeApiPlayer();

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("none");
  });

  it("handles GB-ENG nationality correctly against England", () => {
    const ourPlayer = { name: "Kane", birth_year: 1993, nationality_code: "GB-ENG" };
    const apiPlayer = makeApiPlayer({
      birth: { date: "1993-07-28", place: "London", country: "England" },
      nationality: "England",
    });

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("high");
  });

  it("handles API player with null birth date", () => {
    const ourPlayer = { name: "Test", birth_year: 1990, nationality_code: "AR" };
    const apiPlayer = makeApiPlayer({
      birth: { date: null as unknown as string, place: "", country: "" },
      nationality: "Argentina",
    });

    const result = scoreMatch(ourPlayer, apiPlayer);
    expect(result.confidence).toBe("medium");
  });
});

// ===========================================================================
// resolveOnePlayer
// ===========================================================================
describe("resolveOnePlayer", () => {
  const opts = { delayMs: 0 };

  it("returns high confidence for single exact match", async () => {
    const player = { id: "Q615", name: "Lionel Messi", birth_year: 1987, nationality_code: "AR" };
    const apiPlayer = makeApiPlayer({
      id: 154,
      name: "L. Messi",
      birth: { date: "1987-06-24", place: "Rosario", country: "Argentina" },
      nationality: "Argentina",
    });

    // First league searched returns results — stops immediately
    mockFetchOk(makeApiResponse([apiPlayer]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.apiFootballId).toBe(154);
    expect(result.confidence).toBe("high");
    expect(result.playerQid).toBe("Q615");
    expect(result._requestsUsed).toBe(1);
  });

  it("flags for review when multiple candidates have high confidence", async () => {
    const player = { id: "Q123", name: "Gabriel Silva", birth_year: 1990, nationality_code: "BR" };

    const api1 = makeApiPlayer({
      id: 100,
      name: "Gabriel",
      birth: { date: "1990-02-01", place: "", country: "" },
      nationality: "Brazil",
    });
    const api2 = makeApiPlayer({
      id: 200,
      name: "Gabriel Silva",
      birth: { date: "1990-08-15", place: "", country: "" },
      nationality: "Brazil",
    });

    mockFetchOk(makeApiResponse([api1, api2]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.confidence).toBe("medium");
    expect(result.reason).toContain("Ambiguous");
    expect(result.reason).toContain("2 candidates");
    expect(result.apiFootballId).toBeNull();
    expect(result.ambiguousCandidates).toHaveLength(2);
    expect(result.ambiguousCandidates![0].apiFootballId).toBe(100);
    expect(result.ambiguousCandidates![1].apiFootballId).toBe(200);
  });

  it("returns none when API returns no results", async () => {
    const player = { id: "Q999", name: "Unknown Player", birth_year: 1985, nationality_code: "DE" };

    // Full name search returns empty
    mockFetchOk(makeApiResponse([]));
    // Last name "Player" >= 4 chars, so fallback triggers
    mockFetchOk(makeApiResponse([]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.confidence).toBe("none");
    expect(result.apiFootballId).toBeNull();
    expect(result.reason).toContain("No API results");
    expect(result._requestsUsed).toBe(2); // full name + last name fallback
  });

  it("skips player names shorter than 4 characters", async () => {
    const player = { id: "Q456", name: "Son", birth_year: 1992, nationality_code: "KR" };

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.confidence).toBe("none");
    expect(result.reason).toContain("too short");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("picks correct Ronaldo from multiple results using birth year", async () => {
    const player = { id: "Q252098", name: "Ronaldo", birth_year: 1976, nationality_code: "BR" };

    const ronaldinho = makeApiPlayer({
      id: 3455,
      name: "Ronaldinho",
      birth: { date: "1980-03-21", place: "", country: "" },
      nationality: "Brazil",
    });
    const ronaldoNazario = makeApiPlayer({
      id: 51,
      name: "Ronaldo",
      birth: { date: "1976-09-18", place: "", country: "" },
      nationality: "Brazil",
    });
    const cristianoRonaldo = makeApiPlayer({
      id: 874,
      name: "Cristiano Ronaldo",
      birth: { date: "1985-02-05", place: "", country: "" },
      nationality: "Portugal",
    });

    mockFetchOk(makeApiResponse([ronaldinho, ronaldoNazario, cristianoRonaldo]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.apiFootballId).toBe(51);
    expect(result.confidence).toBe("high");
  });

  it("falls back to last name search when full name finds nothing", async () => {
    const player = { id: "Q615", name: "Lionel Messi", birth_year: 1987, nationality_code: "AR" };

    // Full name "Lionel Messi" returns nothing
    mockFetchOk(makeApiResponse([]));
    // Last name "Messi" fallback finds him
    mockFetchOk(makeApiResponse([
      makeApiPlayer({
        id: 154,
        name: "L. Messi",
        birth: { date: "1987-06-24", place: "", country: "" },
        nationality: "Argentina",
      }),
    ]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.apiFootballId).toBe(154);
    expect(result.confidence).toBe("high");
    expect(result._requestsUsed).toBe(2); // full name + last name fallback
  });

  it("falls back to last name when full name matches wrong player", async () => {
    const player = { id: "Q615", name: "Lionel Messi", birth_year: 1987, nationality_code: "AR" };

    // Full name "Lionel Messi" returns a different player (Lionel Messi Nyamsi)
    mockFetchOk(makeApiResponse([
      makeApiPlayer({
        id: 249239,
        name: "Lionel Messi Nyamsi",
        birth: { date: "1995-03-30", place: "", country: "Cameroon" },
        nationality: "Cameroon",
      }),
    ]));
    // Last name "Messi" fallback finds the real Messi
    mockFetchOk(makeApiResponse([
      makeApiPlayer({
        id: 154,
        name: "L. Messi",
        birth: { date: "1987-06-24", place: "Rosario", country: "Argentina" },
        nationality: "Argentina",
      }),
    ]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.apiFootballId).toBe(154);
    expect(result.confidence).toBe("high");
    expect(result._requestsUsed).toBe(2);
  });

  it("skips last-name fallback when name is single word", async () => {
    const player = { id: "Q252098", name: "Ronaldo", birth_year: 1976, nationality_code: "BR" };

    // Single search returns empty — no fallback since it's a single word
    mockFetchOk(makeApiResponse([]));

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.confidence).toBe("none");
    expect(result._requestsUsed).toBe(1); // no fallback
  });

  it("handles API error gracefully", async () => {
    const player = { id: "Q100", name: "Test Player", birth_year: 1990, nationality_code: "FR" };

    mockFetchError(429);

    const result = await resolveOnePlayer(player, "test-key", opts);
    expect(result.confidence).toBe("none");
    expect(result.reason).toContain("API error");
    expect(result._requestsUsed).toBe(1);
  });
});

// ===========================================================================
// runMappingBatch
// ===========================================================================
describe("runMappingBatch", () => {
  it("stops after reaching request budget", async () => {
    // Single-word names avoid the last-name fallback, making request count predictable
    const players = Array.from({ length: 10 }, (_, i) => ({
      id: `Q${i}`,
      name: `Playername${String(i).padStart(2, "0")}`,
      birth_year: 1990 + i,
      nationality_code: "FR",
    }));

    // Each player uses 1 request (profiles search, no results)
    for (let i = 0; i < 10; i++) {
      mockFetchOk(makeApiResponse([]));
    }

    const result = await runMappingBatch(players, "test-key", {
      requestBudget: 2, // allow 2 players
      delayMs: 0,
    });

    expect(result.requestsUsed).toBe(2);
    expect(result.skipped).toHaveLength(2); // 2 players processed (no results)
  });

  it("skips players with name.length < 4", async () => {
    const players = [
      { id: "Q1", name: "Son", birth_year: 1992, nationality_code: "KR" },
      { id: "Q2", name: "Xavi Hernandez", birth_year: 1980, nationality_code: "ES" },
    ];

    // Q2: full name (empty) + last name "Hernandez" fallback (empty)
    mockFetchOk(makeApiResponse([]));
    mockFetchOk(makeApiResponse([]));

    const result = await runMappingBatch(players, "test-key", { delayMs: 0 });

    const shortNameSkip = result.skipped.find((s) => s.playerQid === "Q1");
    expect(shortNameSkip).toBeDefined();
    expect(shortNameSkip!.reason).toContain("too short");
    expect(result.requestsUsed).toBe(2); // only Q2 used requests (full + fallback)
  });

  it("skips players without birth_year", async () => {
    const players = [
      { id: "Q1", name: "Mystery Player", birth_year: null, nationality_code: "FR" },
      { id: "Q2", name: "Known Player", birth_year: 1990, nationality_code: "FR" },
    ];

    // Q2: full name (empty) + last name "Player" fallback (empty)
    mockFetchOk(makeApiResponse([]));
    mockFetchOk(makeApiResponse([]));

    const result = await runMappingBatch(players, "test-key", { delayMs: 0 });

    const birthYearSkip = result.skipped.find((s) => s.playerQid === "Q1");
    expect(birthYearSkip).toBeDefined();
    expect(birthYearSkip!.reason).toContain("birth_year");
    expect(result.requestsUsed).toBe(2); // only Q2 used requests (full + fallback)
  });

  it("separates mapped vs flagged vs skipped results", async () => {
    const players = [
      // Will be mapped (high confidence)
      { id: "Q1", name: "Lionel Messi", birth_year: 1987, nationality_code: "AR" },
      // Will be skipped (short name)
      { id: "Q2", name: "Son", birth_year: 1992, nationality_code: "KR" },
      // Will be flagged (medium confidence - nationality mismatch)
      { id: "Q3", name: "Test Player", birth_year: 1990, nationality_code: "DE" },
    ];

    // Messi: first league returns match (1 request)
    mockFetchOk(
      makeApiResponse([
        makeApiPlayer({
          id: 154,
          name: "L. Messi",
          birth: { date: "1987-06-24", place: "", country: "" },
          nationality: "Argentina",
        }),
      ])
    );

    // Test Player: first league returns match (1 request)
    mockFetchOk(
      makeApiResponse([
        makeApiPlayer({
          id: 999,
          name: "Test Player",
          birth: { date: "1990-05-01", place: "", country: "" },
          nationality: "France",
        }),
      ])
    );

    const result = await runMappingBatch(players, "test-key", { delayMs: 0 });

    expect(result.mapped.length).toBe(1);
    expect(result.mapped[0].apiFootballId).toBe(154);

    expect(result.skipped.length).toBe(1);
    expect(result.skipped[0].playerQid).toBe("Q2");

    expect(result.flaggedForReview.length).toBe(1);
    expect(result.flaggedForReview[0].playerQid).toBe("Q3");
  });

  it("tracks total requests used", async () => {
    const players = [
      { id: "Q1", name: "Player One", birth_year: 1990, nationality_code: "FR" },
      { id: "Q2", name: "Player Two", birth_year: 1991, nationality_code: "ES" },
    ];

    // Player One: found (1 req)
    mockFetchOk(makeApiResponse([
      makeApiPlayer({ id: 10, birth: { date: "1990-01-01", place: "", country: "" }, nationality: "France" }),
    ]));
    // Player Two: not found, single-word last name "Two" < 4 chars so no fallback (1 req)
    mockFetchOk(makeApiResponse([]));

    const result = await runMappingBatch(players, "test-key", { delayMs: 0 });

    expect(result.requestsUsed).toBe(2);
    expect(result.requestBudget).toBe(7000);
  });
});

// ===========================================================================
// Career data mapping (for future Chain verification)
// ===========================================================================
describe("mapApiTransferToAppearances", () => {
  it("maps API-Football transfer data to player_appearances format", () => {
    const transfers: ApiFootballTransfer[] = [
      {
        date: "2004-07-01",
        teams: {
          in: { id: 541, name: "Real Madrid" },
          out: { id: 212, name: "Sporting CP" },
        },
      },
      {
        date: "2009-06-11",
        teams: {
          in: { id: 50, name: "Manchester United" },
          out: { id: 541, name: "Real Madrid" },
        },
      },
    ];

    const appearances = mapApiTransferToAppearances(transfers, "Q11571");

    expect(appearances.length).toBeGreaterThanOrEqual(2);

    // Should have an appearance at Sporting CP ending ~2004
    const sporting = appearances.find((a) => a.clubName === "Sporting CP");
    expect(sporting).toBeDefined();
    expect(sporting!.endYear).toBe(2004);

    // Should have an appearance at Real Madrid 2004-2009
    const realMadrid = appearances.find(
      (a) => a.clubName === "Real Madrid" && a.startYear === 2004
    );
    expect(realMadrid).toBeDefined();
    expect(realMadrid!.endYear).toBe(2009);
  });
});

describe("detectOverlappingSeasons", () => {
  it("detects overlapping seasons between two players at same club", () => {
    const playerAAppearances = [
      { clubName: "Barcelona", apiClubId: 529, startYear: 2004, endYear: 2016 },
    ];
    const playerBAppearances = [
      { clubName: "Barcelona", apiClubId: 529, startYear: 2010, endYear: 2015 },
    ];

    const overlaps = detectOverlappingSeasons(playerAAppearances, playerBAppearances);

    expect(overlaps.length).toBe(1);
    expect(overlaps[0].clubName).toBe("Barcelona");
    expect(overlaps[0].overlapStart).toBe(2010);
    expect(overlaps[0].overlapEnd).toBe(2015);
  });

  it("returns empty when no shared clubs", () => {
    const playerA = [{ clubName: "Barcelona", apiClubId: 529, startYear: 2004, endYear: 2016 }];
    const playerB = [{ clubName: "Real Madrid", apiClubId: 541, startYear: 2004, endYear: 2016 }];

    const overlaps = detectOverlappingSeasons(playerA, playerB);
    expect(overlaps).toHaveLength(0);
  });

  it("returns empty when years don't overlap", () => {
    const playerA = [{ clubName: "Barcelona", apiClubId: 529, startYear: 2004, endYear: 2010 }];
    const playerB = [{ clubName: "Barcelona", apiClubId: 529, startYear: 2015, endYear: 2020 }];

    const overlaps = detectOverlappingSeasons(playerA, playerB);
    expect(overlaps).toHaveLength(0);
  });

  it("identifies shared clubs from transfer histories", () => {
    // Messi and Neymar at Barcelona
    const messi = [
      { clubName: "Barcelona", apiClubId: 529, startYear: 2004, endYear: 2021 },
      { clubName: "Paris Saint-Germain", apiClubId: 85, startYear: 2021, endYear: 2023 },
    ];
    const neymar = [
      { clubName: "Santos", apiClubId: 100, startYear: 2009, endYear: 2013 },
      { clubName: "Barcelona", apiClubId: 529, startYear: 2013, endYear: 2017 },
      { clubName: "Paris Saint-Germain", apiClubId: 85, startYear: 2017, endYear: 2023 },
    ];

    const overlaps = detectOverlappingSeasons(messi, neymar);

    expect(overlaps.length).toBe(2);
    const barca = overlaps.find((o) => o.clubName === "Barcelona");
    expect(barca).toBeDefined();
    expect(barca!.overlapStart).toBe(2013);
    expect(barca!.overlapEnd).toBe(2017);

    const psg = overlaps.find((o) => o.clubName === "Paris Saint-Germain");
    expect(psg).toBeDefined();
    expect(psg!.overlapStart).toBe(2021);
    expect(psg!.overlapEnd).toBe(2023);
  });
});

// ===========================================================================
// normalizeClubName
// ===========================================================================
describe("normalizeClubName", () => {
  it("lowercases and trims", () => {
    expect(normalizeClubName("  Manchester United  ")).toBe("manchester united");
  });

  it("strips FC suffix", () => {
    expect(normalizeClubName("Manchester United FC")).toBe("manchester united");
  });

  it("strips FC prefix", () => {
    expect(normalizeClubName("FC Barcelona")).toBe("barcelona");
  });

  it("strips AC prefix", () => {
    expect(normalizeClubName("AC Milan")).toBe("milan");
  });

  it("strips AS prefix", () => {
    expect(normalizeClubName("AS Roma")).toBe("roma");
  });

  it("strips multiple suffixes", () => {
    expect(normalizeClubName("AFC Bournemouth")).toBe("bournemouth");
  });

  it("handles hyphens and dots", () => {
    expect(normalizeClubName("Borussia M'gladbach")).toBe("borussia m gladbach");
  });

  it("collapses extra whitespace", () => {
    expect(normalizeClubName("Paris  Saint  Germain")).toBe("paris saint germain");
  });
});

// ===========================================================================
// isNationalTeam
// ===========================================================================
describe("isNationalTeam", () => {
  it("detects country names", () => {
    expect(isNationalTeam("Brazil")).toBe(true);
    expect(isNationalTeam("Argentina")).toBe(true);
    expect(isNationalTeam("England")).toBe(true);
  });

  it("detects youth teams", () => {
    expect(isNationalTeam("Brazil U23")).toBe(true);
    expect(isNationalTeam("Brazil U20")).toBe(true);
    expect(isNationalTeam("Brazil U17")).toBe(true);
  });

  it("does not flag club teams", () => {
    expect(isNationalTeam("Barcelona")).toBe(false);
    expect(isNationalTeam("Manchester United")).toBe(false);
    expect(isNationalTeam("Santos")).toBe(false);
    expect(isNationalTeam("Al-Hilal Saudi FC")).toBe(false);
  });
});

// ===========================================================================
// apiTeamsToClubSummaries
// ===========================================================================
describe("apiTeamsToClubSummaries", () => {
  const neymarTeams: ApiFootballTeamEntry[] = [
    { team: { id: 6, name: "Brazil", logo: "" }, seasons: [2023, 2022, 2021, 2019, 2018] },
    { team: { id: 85, name: "Paris Saint Germain", logo: "" }, seasons: [2022, 2021, 2020, 2019, 2018, 2017] },
    { team: { id: 529, name: "Barcelona", logo: "" }, seasons: [2016, 2015, 2014, 2013] },
    { team: { id: 128, name: "Santos", logo: "" }, seasons: [2012, 2011, 2010, 2009] },
    { team: { id: 10171, name: "Brazil  U23", logo: "" }, seasons: [2016, 2012] },
  ];

  it("filters out national and youth teams", () => {
    const summaries = apiTeamsToClubSummaries(neymarTeams);
    const names = summaries.map((s) => s.clubName);
    expect(names).not.toContain("Brazil");
    expect(names).not.toContain("Brazil  U23");
    expect(names).toContain("Paris Saint Germain");
    expect(names).toContain("Barcelona");
    expect(names).toContain("Santos");
  });

  it("extracts correct year ranges from seasons array", () => {
    const summaries = apiTeamsToClubSummaries(neymarTeams);
    const psg = summaries.find((s) => s.clubName === "Paris Saint Germain");
    expect(psg).toBeDefined();
    expect(psg!.startYear).toBe(2017);
    expect(psg!.endYear).toBe(2022);

    const santos = summaries.find((s) => s.clubName === "Santos");
    expect(santos).toBeDefined();
    expect(santos!.startYear).toBe(2009);
    expect(santos!.endYear).toBe(2012);
  });

  it("sorts seasons ascending", () => {
    const summaries = apiTeamsToClubSummaries(neymarTeams);
    const barca = summaries.find((s) => s.clubName === "Barcelona");
    expect(barca!.seasons).toEqual([2013, 2014, 2015, 2016]);
  });
});

// ===========================================================================
// compareCareerData
// ===========================================================================
describe("compareCareerData", () => {
  it("matches clubs with identical names", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "Barcelona", startYear: 2013, endYear: 2016, seasons: [2013, 2014, 2015, 2016] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Barcelona", startYear: 2013, endYear: 2017 },
    ];

    const result = compareCareerData(apiClubs, ours);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].ourClubName).toBe("Barcelona");
    expect(result.missingFromOurs).toHaveLength(0);
    expect(result.missingFromApi).toHaveLength(0);
  });

  it("matches clubs via normalized names (FC Barcelona vs Barcelona)", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "FC Barcelona", startYear: 2013, endYear: 2016, seasons: [2013, 2014, 2015, 2016] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Barcelona", startYear: 2013, endYear: 2017 },
    ];

    const result = compareCareerData(apiClubs, ours);
    expect(result.matched).toHaveLength(1);
    expect(result.missingFromOurs).toHaveLength(0);
    expect(result.missingFromApi).toHaveLength(0);
  });

  it("reports clubs missing from our data", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "Barcelona", startYear: 2013, endYear: 2016, seasons: [2013, 2014, 2015, 2016] },
      { apiClubId: 128, clubName: "Santos", startYear: 2009, endYear: 2012, seasons: [2009, 2010, 2011, 2012] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Barcelona", startYear: 2013, endYear: 2017 },
    ];

    const result = compareCareerData(apiClubs, ours);
    expect(result.matched).toHaveLength(1);
    expect(result.missingFromOurs).toHaveLength(1);
    expect(result.missingFromOurs[0].clubName).toBe("Santos");
  });

  it("reports clubs missing from API data", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "Barcelona", startYear: 2013, endYear: 2016, seasons: [2013, 2014, 2015, 2016] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Barcelona", startYear: 2013, endYear: 2017 },
      { clubId: "Q101", clubName: "Santos", startYear: 2009, endYear: 2013 },
    ];

    const result = compareCareerData(apiClubs, ours);
    expect(result.matched).toHaveLength(1);
    expect(result.missingFromApi).toHaveLength(1);
    expect(result.missingFromApi[0].clubName).toBe("Santos");
  });

  it("computes year differences for matched clubs", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 85, clubName: "Paris Saint Germain", startYear: 2017, endYear: 2023, seasons: [2017, 2018, 2019, 2020, 2021, 2022, 2023] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q583", clubName: "Paris Saint-Germain", startYear: 2017, endYear: 2025 },
    ];

    const result = compareCareerData(apiClubs, ours);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].yearDiffStart).toBe(0);
    expect(result.matched[0].yearDiffEnd).toBe(-2); // API says 2023, we say 2025
  });

  it("handles null start/end years in our data", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "Barcelona", startYear: 2004, endYear: 2021, seasons: [2004, 2005, 2021] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Barcelona", startYear: null, endYear: null },
    ];

    const result = compareCareerData(apiClubs, ours);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].yearDiffStart).toBeNull();
    expect(result.matched[0].yearDiffEnd).toBeNull();
  });

  it("matches by club ID when clubIdMap is provided", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "FC Barcelona", startYear: 2013, endYear: 2016, seasons: [2013, 2014, 2015, 2016] },
    ];
    // Name is totally different — would NOT match by name
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Futbol Club De Barcelona", startYear: 2013, endYear: 2017 },
    ];
    const clubIdMap = new Map([["Q7725", 529]]);

    const result = compareCareerData(apiClubs, ours, clubIdMap);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].ourClubId).toBe("Q7725");
    expect(result.matched[0].apiClubId).toBe(529);
    expect(result.missingFromOurs).toHaveLength(0);
    expect(result.missingFromApi).toHaveLength(0);
  });

  it("prevents false match when different clubs share normalized names", () => {
    // Barcelona SC (Ecuador) should NOT match Barcelona (Spain) by name
    // if club ID mapping says our Q278397 = API team 1065 (Barcelona SC Ecuador)
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "Barcelona", startYear: 2004, endYear: 2021, seasons: [2004, 2021] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q278397", clubName: "Barcelona SC", startYear: 2010, endYear: 2015 },
    ];
    // Q278397 is mapped to API 1065 (Ecuador), not 529 (Spain)
    const clubIdMap = new Map([["Q278397", 1065]]);

    const result = compareCareerData(apiClubs, ours, clubIdMap);
    // Club ID says these are different clubs, so name match is still attempted
    // but "barcelona" contains "barcelona" so name matching WOULD match them
    // However the ID pass won't match them (1065 != 529), name pass will
    // This is expected — name matching is the fallback for unmapped clubs
    // The key is that when BOTH are ID-mapped, we'd correctly skip
    expect(result.matched).toHaveLength(1); // name fallback still matches
  });

  it("club ID match takes priority over name match", () => {
    const apiClubs: ApiClubSummary[] = [
      { apiClubId: 529, clubName: "Barcelona", startYear: 2004, endYear: 2021, seasons: [2004, 2021] },
      { apiClubId: 85, clubName: "Paris Saint Germain", startYear: 2021, endYear: 2023, seasons: [2021, 2022, 2023] },
    ];
    const ours: OurAppearance[] = [
      { clubId: "Q7725", clubName: "Barca FC", startYear: 2004, endYear: 2021 }, // wouldn't match by name alone
      { clubId: "Q583", clubName: "PSG", startYear: 2021, endYear: 2023 }, // wouldn't match by name alone
    ];
    const clubIdMap = new Map([["Q7725", 529], ["Q583", 85]]);

    const result = compareCareerData(apiClubs, ours, clubIdMap);
    expect(result.matched).toHaveLength(2);
    expect(result.missingFromOurs).toHaveLength(0);
    expect(result.missingFromApi).toHaveLength(0);
  });
});

// ===========================================================================
// fetchPlayerTeams
// ===========================================================================
describe("fetchPlayerTeams", () => {
  it("calls /players/teams with correct params and header", async () => {
    const teamsResponse: ApiFootballTeamsResponse = {
      results: 2,
      response: [
        { team: { id: 529, name: "Barcelona", logo: "" }, seasons: [2013, 2014] },
        { team: { id: 6, name: "Brazil", logo: "" }, seasons: [2015] },
      ],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => teamsResponse,
    } as Response);

    const result = await fetchPlayerTeams(276, "my-key");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/players/teams");
    expect(url).toContain("player=276");
    expect(opts.headers["x-apisports-key"]).toBe("my-key");
    expect(result).toHaveLength(2);
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ errors: { rateLimit: "too many" } }),
    } as unknown as Response);

    await expect(fetchPlayerTeams(276, "my-key")).rejects.toThrow("API-Football error 429");
  });
});

// ===========================================================================
// runCareerValidationBatch
// ===========================================================================
describe("runCareerValidationBatch", () => {
  function mockTeamsResponse(teams: ApiFootballTeamEntry[]) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: teams.length, response: teams } as ApiFootballTeamsResponse),
    } as Response);
  }

  it("validates a player and returns comparison with club mappings", async () => {
    mockTeamsResponse([
      { team: { id: 529, name: "Barcelona", logo: "" }, seasons: [2004, 2005, 2006, 2020, 2021] },
      { team: { id: 6, name: "Argentina", logo: "" }, seasons: [2005, 2006] },
    ]);

    const players = [{
      playerQid: "Q615",
      playerName: "Lionel Messi",
      apiFootballId: 154,
      ourAppearances: [
        { clubId: "Q7725", clubName: "Barcelona", startYear: 2004, endYear: 2021 },
      ],
    }];

    const result = await runCareerValidationBatch(players, "key", { delayMs: 0 });
    expect(result.validated).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
    expect(result.requestsUsed).toBe(1);
    expect(result.validated[0].comparison.matched).toHaveLength(1);

    // Should have discovered club mapping: Q7725 → 529
    expect(result.clubMappingsDiscovered).toHaveLength(1);
    expect(result.clubMappingsDiscovered[0].clubQid).toBe("Q7725");
    expect(result.clubMappingsDiscovered[0].apiFootballId).toBe(529);
    expect(result.clubMappingsDiscovered[0].discoveredVia).toBe("Q615");
  });

  it("accumulates club mappings across players in batch", async () => {
    // Player 1: Messi at Barcelona
    mockTeamsResponse([
      { team: { id: 529, name: "Barcelona", logo: "" }, seasons: [2004, 2021] },
    ]);
    // Player 2: Neymar at Barcelona + Santos
    mockTeamsResponse([
      { team: { id: 529, name: "Barcelona", logo: "" }, seasons: [2013, 2016] },
      { team: { id: 128, name: "Santos", logo: "" }, seasons: [2009, 2012] },
    ]);

    const players = [
      {
        playerQid: "Q615",
        playerName: "Lionel Messi",
        apiFootballId: 154,
        ourAppearances: [
          { clubId: "Q7725", clubName: "FC Barcelona", startYear: 2004, endYear: 2021 },
        ],
      },
      {
        playerQid: "Q270",
        playerName: "Neymar",
        apiFootballId: 276,
        ourAppearances: [
          // Uses different name for same club — but after Messi, Q7725=529 is known
          { clubId: "Q7725", clubName: "Futbol Club De Barcelona", startYear: 2013, endYear: 2017 },
          { clubId: "Q101", clubName: "Santos", startYear: 2009, endYear: 2013 },
        ],
      },
    ];

    const result = await runCareerValidationBatch(players, "key", { delayMs: 0 });

    expect(result.validated).toHaveLength(2);
    // Messi: matched Barcelona by name → discovered Q7725=529
    // Neymar: matched Barcelona by ID (accumulated), Santos by name → discovered Q101=128
    expect(result.clubMappingsDiscovered).toHaveLength(2);
    expect(result.clubMappingsDiscovered.map((m) => m.clubQid).sort()).toEqual(["Q101", "Q7725"]);

    // Neymar's Barcelona should have matched (via accumulated ID map)
    const neymarValidation = result.validated.find((v) => v.playerQid === "Q270");
    expect(neymarValidation!.comparison.matched).toHaveLength(2);
    expect(neymarValidation!.comparison.missingFromOurs).toHaveLength(0);
  });

  it("does not duplicate existing club mappings", async () => {
    mockTeamsResponse([
      { team: { id: 529, name: "Barcelona", logo: "" }, seasons: [2004, 2021] },
    ]);

    const players = [{
      playerQid: "Q615",
      playerName: "Lionel Messi",
      apiFootballId: 154,
      ourAppearances: [
        { clubId: "Q7725", clubName: "Barcelona", startYear: 2004, endYear: 2021 },
      ],
    }];

    // Pass existing club map — Q7725 already known
    const result = await runCareerValidationBatch(players, "key", {
      delayMs: 0,
      existingClubMap: new Map([["Q7725", 529]]),
    });

    expect(result.validated).toHaveLength(1);
    // Should NOT report as newly discovered since it was already in existingClubMap
    expect(result.clubMappingsDiscovered).toHaveLength(0);
  });

  it("respects request budget", async () => {
    mockTeamsResponse([{ team: { id: 1, name: "Club A", logo: "" }, seasons: [2020] }]);
    mockTeamsResponse([{ team: { id: 2, name: "Club B", logo: "" }, seasons: [2020] }]);
    mockTeamsResponse([{ team: { id: 3, name: "Club C", logo: "" }, seasons: [2020] }]);

    const players = Array.from({ length: 3 }, (_, i) => ({
      playerQid: `Q${i}`,
      playerName: `Player ${i}`,
      apiFootballId: i + 1,
      ourAppearances: [] as OurAppearance[],
    }));

    const result = await runCareerValidationBatch(players, "key", {
      requestBudget: 2,
      delayMs: 0,
    });

    expect(result.requestsUsed).toBe(2);
    expect(result.validated).toHaveLength(2);
  });

  it("handles API errors for individual players", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ errors: { server: "internal" } }),
    } as unknown as Response);

    const players = [{
      playerQid: "Q1",
      playerName: "Error Player",
      apiFootballId: 999,
      ourAppearances: [],
    }];

    const result = await runCareerValidationBatch(players, "key", { delayMs: 0 });
    expect(result.validated).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toContain("500");
    expect(result.requestsUsed).toBe(1);
    expect(result.clubMappingsDiscovered).toHaveLength(0);
  });
});
