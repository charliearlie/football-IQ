/**
 * Content Oracle Engine
 *
 * AI-powered player suggestion system for filling schedule gaps.
 * Generates player suggestions based on game mode and ensures
 * deduplication against recently used players.
 */

import type {
  OracleOptions,
  OracleResult,
  OracleSuggestion,
  OracleTheme,
} from "@/types/ai";
import { createAdminClient } from "@/lib/supabase/server";

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o";
const OPENAI_TEMPERATURE = 0.7; // Higher temperature for creative suggestions

// Default deduplication window
const DEFAULT_EXCLUDE_RECENT_DAYS = 30;

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const CAREER_PATH_PROMPT = `You are a football trivia content curator. Your task is to suggest footballers for a "Career Path" guessing game.

For the STANDARD mode (career_path), suggest:
- High-profile players with recognizable careers
- World Cup winners, Ballon d'Or nominees, league legends
- Players from diverse leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1)
- A mix of current stars and retired legends
- Players with interesting career journeys (multiple clubs, memorable transfers)

Guidelines:
- Each player should have a Wikipedia page with detailed career information
- Prefer players with 5+ senior clubs for interesting career paths
- Include a mix of nationalities and eras
- Avoid players with very short or obscure careers

Return JSON with this structure:
{
  "suggestions": [
    {
      "name": "Player Full Name",
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Player_Name",
      "reason": "Brief reason why this player is a good choice",
      "suggestedDifficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

const CAREER_PATH_PRO_PROMPT = `You are a football trivia content curator. Your task is to suggest footballers for a "Career Path Pro" guessing game - a HARDER version for dedicated fans.

For the PRO mode (career_path_pro), suggest:
- Cult heroes and fan favorites (not global superstars)
- Journeymen with interesting career paths across many clubs
- Underrated players who were important to their clubs
- Players from less mainstream leagues (Eredivisie, Primeira Liga, Scottish Premier, MLS, J-League)
- One-season wonders or players remembered for specific moments
- Players who had surprising career moves

Guidelines:
- Each player should have a Wikipedia page with detailed career information
- The name should NOT be immediately obvious to casual fans
- Prefer players with interesting stories or unique career trajectories
- Include players from different eras (80s, 90s, 2000s, 2010s, current)
- Avoid obvious global superstars like Messi, Ronaldo, Neymar

Return JSON with this structure:
{
  "suggestions": [
    {
      "name": "Player Full Name",
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Player_Name",
      "reason": "Brief reason why this player is a good choice for Pro mode",
      "suggestedDifficulty": "medium" | "hard"
    }
  ]
}`;

// ============================================================================
// THEME PROMPTS
// ============================================================================

const THEME_PROMPTS: Partial<Record<OracleTheme, string>> = {
  premier_league_legends: `
THEME FOCUS - Premier League Legends:
- Players who are considered Premier League legends or icons
- Title winners, golden boot winners, club legends who defined eras
- Players who made significant impact in the English top flight
- Examples: Thierry Henry, Steven Gerrard, Patrick Vieira, Alan Shearer, Frank Lampard
- Can include current legends like De Bruyne, Salah if they have substantial careers
- Prioritize English top-flight history over other leagues`,

  world_cup_icons: `
THEME FOCUS - World Cup Icons:
- Players primarily remembered for World Cup performances
- World Cup winners, Golden Ball winners, iconic tournament moments
- Players whose international careers defined them
- Examples: Zinedine Zidane, Ronaldo (R9), Diego Maradona, Miroslav Klose, Paolo Rossi
- Include both winners and memorable performers from losing sides`,

  streets_wont_forget: `
THEME FOCUS - "Streets Won't Forget" Cult Heroes:
- Cult heroes and fan favorites - NOT global superstars
- Players with passionate, dedicated fanbases despite not being world-class
- Remembered for specific moments, celebrations, personality, or loyalty
- "Your dad's favorite player" or pub quiz answers
- Examples: Jimmy Bullard, Yakubu, Benjani, Roque Santa Cruz, Elano, Tuncay, Afonso Alves
- Avoid obvious superstars - focus on beloved fan favorites`,

  journeymen: `
THEME FOCUS - Journeymen:
- Well-traveled players with diverse, surprising career paths
- Players who played for 6+ different clubs across multiple leagues
- Unexpected transfers and diverse league experiences
- The type where each career reveal is a surprise
- Examples: Nicolas Anelka, Craig Bellamy, Robinho, Samuel Eto'o, Zlatan Ibrahimovic
- Focus on variety and surprise factor in career moves`,

  "90s_2000s_nostalgia": `
THEME FOCUS - 90s/2000s Nostalgia:
- Players primarily active between 1990-2010
- Childhood heroes for millennials, "the good old days" of football
- Championship Manager / early FIFA video game legends
- Players from the "golden era" of football before social media
- Examples: Gianfranco Zola, Jay-Jay Okocha, Juan Roman Riquelme, Juninho Pernambucano
- Include lesser-known gems from this era, not just obvious stars`,

  rising_stars: `
THEME FOCUS - Rising Stars:
- Current young talent (under 28) with established careers
- Breakthrough players from recent seasons
- Future legends in the making with enough career history to be interesting
- Players who have already made notable moves between clubs
- Examples: Jude Bellingham, Florian Wirtz, Pedri, Jamal Musiala
- Only include if they have enough career substance (3+ clubs or significant history)`,
};

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Fetches recently used player names from daily_puzzles.
 * Used for deduplication to avoid repetition.
 */
export async function getRecentlyUsedPlayers(
  gameMode: string,
  days: number = DEFAULT_EXCLUDE_RECENT_DAYS
): Promise<string[]> {
  const supabase = await createAdminClient();

  // Calculate the date cutoff
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  // Query for recent puzzles of this game mode
  const { data, error } = await supabase
    .from("daily_puzzles")
    .select("content")
    .eq("game_mode", gameMode)
    .gte("puzzle_date", cutoffStr)
    .not("content", "is", null);

  if (error) {
    console.error("[Oracle] Error fetching recent players:", error);
    return [];
  }

  // Extract answer field from content JSON
  const players: string[] = [];
  for (const puzzle of data || []) {
    const content = puzzle.content as { answer?: string };
    if (content?.answer) {
      players.push(content.answer.toLowerCase().trim());
    }
  }

  return players;
}

// ============================================================================
// OPENAI INTEGRATION
// ============================================================================

/**
 * Calls OpenAI to generate player suggestions.
 */
async function generateSuggestions(
  gameMode: "career_path" | "career_path_pro",
  count: number,
  excludeNames: string[],
  theme: OracleTheme = "default",
  customPrompt?: string
): Promise<OracleResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not configured",
    };
  }

  // Build system prompt with optional theme
  const basePrompt = gameMode === "career_path_pro"
    ? CAREER_PATH_PRO_PROMPT
    : CAREER_PATH_PROMPT;

  let themeAddition = "";
  if (theme === "custom" && customPrompt) {
    themeAddition = `\n\nSPECIFIC FOCUS: ${customPrompt}`;
  } else if (theme !== "default" && THEME_PROMPTS[theme]) {
    themeAddition = `\n${THEME_PROMPTS[theme]}`;
  }

  const systemPrompt = basePrompt + themeAddition;

  const exclusionNote = excludeNames.length > 0
    ? `\n\nIMPORTANT: Do NOT suggest any of these recently used players: ${excludeNames.slice(0, 50).join(", ")}`
    : "";

  const userPrompt = `Please suggest ${count} footballers for the ${gameMode === "career_path_pro" ? "Career Path Pro" : "Career Path"} game.${exclusionNote}

Provide ${count} diverse suggestions with their Wikipedia URLs.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: OPENAI_TEMPERATURE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `OpenAI API error: ${response.status} - ${errorData?.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: "No response from OpenAI" };
    }

    // Parse the JSON response
    const parsed = JSON.parse(content) as { suggestions: OracleSuggestion[] };

    if (!Array.isArray(parsed.suggestions)) {
      return {
        success: false,
        error: "Invalid response structure from AI",
      };
    }

    // Validate each suggestion
    const validSuggestions = parsed.suggestions.filter((s) => {
      return (
        typeof s.name === "string" &&
        typeof s.wikipediaUrl === "string" &&
        s.wikipediaUrl.includes("wikipedia.org")
      );
    });

    return {
      success: true,
      suggestions: validSuggestions,
    };
  } catch (error) {
    console.error("[Oracle] Generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate suggestions",
    };
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Suggests players for filling schedule gaps.
 *
 * @param options - Oracle options including game mode and count
 * @returns OracleResult with suggestions or error
 */
export async function suggestPlayersForGaps(
  options: OracleOptions
): Promise<OracleResult> {
  const {
    gameMode,
    count,
    excludeRecentDays = DEFAULT_EXCLUDE_RECENT_DAYS,
    theme = "default",
    customPrompt,
  } = options;

  // Validate game mode
  if (gameMode !== "career_path" && gameMode !== "career_path_pro") {
    return {
      success: false,
      error: `Oracle only supports career_path and career_path_pro modes. Got: ${gameMode}`,
    };
  }

  // Fetch recently used players for deduplication
  const recentPlayers = await getRecentlyUsedPlayers(gameMode, excludeRecentDays);

  // Request more suggestions than needed to account for filtering
  const requestCount = Math.min(count + 5, 20);

  // Generate suggestions from AI with theme
  const result = await generateSuggestions(gameMode, requestCount, recentPlayers, theme, customPrompt);

  if (!result.success || !result.suggestions) {
    return result;
  }

  // Filter out any suggestions that match recent players
  const filteredOut: string[] = [];
  const filteredSuggestions = result.suggestions.filter((s) => {
    const nameLower = s.name.toLowerCase().trim();
    const isRecent = recentPlayers.some(
      (recent) => recent.includes(nameLower) || nameLower.includes(recent)
    );

    if (isRecent) {
      filteredOut.push(s.name);
      return false;
    }
    return true;
  });

  // Return the requested number of suggestions
  return {
    success: true,
    suggestions: filteredSuggestions.slice(0, count),
    filteredOut: filteredOut.length > 0 ? filteredOut : undefined,
  };
}

/**
 * Validates that a Wikipedia URL is accessible before scouting.
 */
export async function validateWikipediaUrl(url: string): Promise<boolean> {
  try {
    // Extract the title and check if the page exists
    const urlObj = new URL(url);
    let title: string | null = null;

    if (urlObj.pathname.startsWith("/wiki/")) {
      title = urlObj.pathname.replace("/wiki/", "");
    }

    if (!title) return false;

    // Use MediaWiki API to check page existence
    const apiUrl = new URL("https://en.wikipedia.org/w/api.php");
    apiUrl.searchParams.set("action", "query");
    apiUrl.searchParams.set("titles", decodeURIComponent(title));
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("formatversion", "2");

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    const page = data?.query?.pages?.[0];
    return page && !page.missing;
  } catch {
    return false;
  }
}
