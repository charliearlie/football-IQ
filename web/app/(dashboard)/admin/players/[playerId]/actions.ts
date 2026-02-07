"use server";

import { createAdminClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedCareerEntry {
  clubName: string;
  startYear: number | null;
  endYear: number | null;
  matchedClubId: string | null;
  matchedClubName: string | null;
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o";
const OPENAI_TEMPERATURE = 0.2;

const EXTRACTION_SYSTEM_PROMPT = `You are a football career data extraction assistant. Your task is to extract senior career history from Wikipedia wikitext.

CRITICAL RULES:
1. Extract ONLY clubs that explicitly appear in the source text
2. NEVER invent or hallucinate clubs
3. Only include SENIOR career (not youth teams)
4. Include loan spells
5. Order chronologically (earliest to most recent)
6. Use common English club names (e.g., "Manchester City" not "MCFC")

Return a valid JSON object with this exact structure:
{
  "playerName": "Full Player Name",
  "clubs": [
    {
      "name": "Club Name",
      "startYear": 2010,
      "endYear": 2015
    }
  ]
}

For years:
- Use null if the year is not stated or unclear
- For current clubs, endYear should be null
- Parse year ranges like "2010–2015" correctly`;

// ============================================================================
// WIKIPEDIA UTILITIES
// ============================================================================

function extractPageTitle(url: string): string | null {
  try {
    const urlObj = new URL(url);

    if (urlObj.pathname.startsWith("/wiki/")) {
      const title = urlObj.pathname.replace("/wiki/", "");
      return decodeURIComponent(title);
    }

    const titleParam = urlObj.searchParams.get("title");
    if (titleParam) {
      return decodeURIComponent(titleParam);
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchWikipediaWikitext(
  pageTitle: string
): Promise<{ success: true; wikitext: string; pageTitle: string } | { success: false; error: string }> {
  try {
    const apiUrl = new URL("https://en.wikipedia.org/w/api.php");
    apiUrl.searchParams.set("action", "query");
    apiUrl.searchParams.set("titles", pageTitle);
    apiUrl.searchParams.set("prop", "revisions");
    apiUrl.searchParams.set("rvprop", "content");
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("formatversion", "2");

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      return {
        success: false,
        error: `Wikipedia API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const pages = data?.query?.pages;

    if (!pages || pages.length === 0) {
      return { success: false, error: "Page not found" };
    }

    const page = pages[0];

    if (page.missing) {
      return { success: false, error: `Wikipedia page not found: ${pageTitle}` };
    }

    const wikitext = page.revisions?.[0]?.content;
    if (!wikitext) {
      return { success: false, error: "No content found on page" };
    }

    return { success: true, wikitext, pageTitle: page.title };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch Wikipedia",
    };
  }
}

// ============================================================================
// OPENAI EXTRACTION
// ============================================================================

interface AIExtractionResult {
  playerName: string;
  clubs: Array<{
    name: string;
    startYear: number | null;
    endYear: number | null;
  }>;
}

async function extractCareerWithAI(
  wikitext: string,
  pageTitle: string
): Promise<ActionResult<AIExtractionResult>> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { success: false, error: "OpenAI API key not configured" };
  }

  try {
    const userPrompt = `Extract the senior career history from this Wikipedia article about "${pageTitle}".

Here is the wikitext:

${wikitext.substring(0, 15000)}`;

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
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
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

    const parsed = JSON.parse(content) as AIExtractionResult;

    if (!parsed.playerName || !Array.isArray(parsed.clubs)) {
      return { success: false, error: "Invalid response structure from AI" };
    }

    // Basic validation - filter clubs that aren't mentioned in source
    const wikitextLower = wikitext.toLowerCase();
    const validatedClubs = parsed.clubs.filter((club) => {
      const clubLower = club.name.toLowerCase();
      const variations = [
        clubLower,
        clubLower.replace(" fc", "").trim(),
        clubLower.replace(" cf", "").trim(),
        clubLower.split(" ")[0],
      ];
      return variations.some((v) => v.length > 2 && wikitextLower.includes(v));
    });

    return {
      success: true,
      data: {
        playerName: parsed.playerName,
        clubs: validatedClubs,
      },
    };
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract career",
    };
  }
}

// ============================================================================
// CLUB MATCHING
// ============================================================================

async function matchClubsToDatabase(
  clubs: Array<{ name: string; startYear: number | null; endYear: number | null }>,
  playerCountryCode?: string
): Promise<ExtractedCareerEntry[]> {
  const supabase = await createAdminClient();

  const entries: ExtractedCareerEntry[] = [];

  for (const club of clubs) {
    // Use the smart matching RPC that orders by:
    // 1. Exact name match
    // 2. Country match (if player country provided)
    // 3. Top 5 league bonus
    // 4. Number of players (popularity)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: matches, error } = await (supabase.rpc as any)("match_club_by_name", {
      club_name_input: club.name,
      player_country_code: playerCountryCode ?? null,
    });

    if (error) {
      console.error("Club matching RPC error:", error);
    }

    const bestMatch = matches?.[0];

    entries.push({
      clubName: club.name,
      startYear: club.startYear,
      endYear: club.endYear,
      matchedClubId: bestMatch?.club_id ?? null,
      matchedClubName: bestMatch?.club_name ?? null,
    });
  }

  return entries;
}

// ============================================================================
// PUBLIC SERVER ACTIONS
// ============================================================================

/**
 * Extract career data from a Wikipedia article URL.
 * @param url - Wikipedia article URL
 * @param playerCountryCode - Optional player nationality (e.g., "ES") to improve club matching
 */
export async function extractCareerFromWikipediaArticle(
  url: string,
  playerCountryCode?: string
): Promise<ActionResult<{ entries: ExtractedCareerEntry[]; playerName: string }>> {
  // Validate URL
  if (!url.includes("wikipedia.org")) {
    return { success: false, error: "Please provide a valid Wikipedia URL" };
  }

  // Extract page title
  const pageTitle = extractPageTitle(url);
  if (!pageTitle) {
    return { success: false, error: "Could not extract page title from URL" };
  }

  // Fetch wikitext
  const wikitextResult = await fetchWikipediaWikitext(pageTitle);
  if (!wikitextResult.success) {
    return { success: false, error: wikitextResult.error };
  }

  // Extract career with AI
  const extractionResult = await extractCareerWithAI(wikitextResult.wikitext, wikitextResult.pageTitle);
  if (!extractionResult.success || !extractionResult.data) {
    return { success: false, error: extractionResult.error ?? "Extraction failed" };
  }

  // Match clubs to database (pass player country to improve matching)
  const entries = await matchClubsToDatabase(extractionResult.data.clubs, playerCountryCode);

  return {
    success: true,
    data: {
      entries,
      playerName: extractionResult.data.playerName,
    },
  };
}

/**
 * Replace a player's career with extracted Wikipedia data.
 */
export async function replacePlayerCareerFromWikipedia(
  playerQid: string,
  entries: ExtractedCareerEntry[]
): Promise<ActionResult<{ count: number }>> {
  if (!playerQid || !playerQid.startsWith("Q")) {
    return { success: false, error: "Invalid player QID" };
  }

  if (entries.length === 0) {
    return { success: false, error: "No career entries to save" };
  }

  const supabase = await createAdminClient();

  try {
    // For entries without matched clubs, create new club entries
    const clubsToCreate: Array<{
      id: string;
      name: string;
      search_name: string;
    }> = [];

    const processedEntries = entries.map((entry, index) => {
      if (entry.matchedClubId) {
        return {
          clubId: entry.matchedClubId,
          startYear: entry.startYear,
          endYear: entry.endYear,
        };
      }

      // Generate a temporary QID for unmatched clubs
      const tempQid = `Q_NEW_${Date.now()}_${index}`;
      clubsToCreate.push({
        id: tempQid,
        name: entry.clubName,
        search_name: entry.clubName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim(),
      });

      return {
        clubId: tempQid,
        startYear: entry.startYear,
        endYear: entry.endYear,
      };
    });

    // Create new clubs if needed
    if (clubsToCreate.length > 0) {
      const { error: clubError } = await supabase.from("clubs").upsert(clubsToCreate, {
        onConflict: "id",
      });

      if (clubError) {
        return { success: false, error: `Failed to create clubs: ${clubError.message}` };
      }
    }

    // Delete existing career entries
    const { error: deleteError } = await supabase
      .from("player_appearances")
      .delete()
      .eq("player_id", playerQid);

    if (deleteError) {
      return { success: false, error: `Failed to delete old career: ${deleteError.message}` };
    }

    // Insert new career entries
    const appearanceRows = processedEntries.map((entry) => ({
      player_id: playerQid,
      club_id: entry.clubId,
      start_year: entry.startYear,
      end_year: entry.endYear,
    }));

    const { error: insertError } = await supabase
      .from("player_appearances")
      .insert(appearanceRows);

    if (insertError) {
      return { success: false, error: `Failed to save career: ${insertError.message}` };
    }

    return { success: true, data: { count: entries.length } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save career",
    };
  }
}
