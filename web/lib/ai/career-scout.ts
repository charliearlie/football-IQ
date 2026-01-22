/**
 * AI Scout Service
 *
 * Extracts career data from Wikipedia articles using the MediaWiki API
 * and OpenAI gpt-4o for structured data extraction.
 */

import type {
  CareerScoutResult,
  CareerScoutData,
  ScoutedCareerStep,
  WikitextResult,
  ConfidenceLevel,
} from "@/types/ai";

// ============================================================================
// CONSTANTS
// ============================================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o";
const OPENAI_TEMPERATURE = 0.2; // Low temperature for factual accuracy

// ============================================================================
// WIKIPEDIA UTILITIES
// ============================================================================

/**
 * Extracts the Wikipedia page title from a URL.
 * Handles both /wiki/ and /w/index.php?title= formats.
 */
function extractPageTitle(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle /wiki/Title format
    if (urlObj.pathname.startsWith("/wiki/")) {
      const title = urlObj.pathname.replace("/wiki/", "");
      return decodeURIComponent(title);
    }

    // Handle /w/index.php?title=Title format
    const titleParam = urlObj.searchParams.get("title");
    if (titleParam) {
      return decodeURIComponent(titleParam);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches the wikitext content of a Wikipedia article using the MediaWiki API.
 */
async function fetchWikipediaWikitext(pageTitle: string): Promise<WikitextResult> {
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
        error: `Wikipedia API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Check for valid page
    const pages = data?.query?.pages;
    if (!pages || pages.length === 0) {
      return { success: false, error: "Page not found" };
    }

    const page = pages[0];

    // Check for missing page
    if (page.missing) {
      return { success: false, error: `Wikipedia page not found: ${pageTitle}` };
    }

    // Extract wikitext
    const wikitext = page.revisions?.[0]?.content;
    if (!wikitext) {
      return { success: false, error: "No content found on page" };
    }

    return {
      success: true,
      wikitext,
      pageTitle: page.title,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch Wikipedia content",
    };
  }
}

// ============================================================================
// OPENAI INTEGRATION
// ============================================================================

/**
 * System prompt for the career extraction task.
 */
const SYSTEM_PROMPT = `You are a football career data extraction assistant. Your task is to extract ONLY factual senior career data from Wikipedia wikitext.

CRITICAL RULES:
1. Extract ONLY clubs that explicitly appear in the source text
2. NEVER invent or hallucinate clubs, stats, or achievements
3. Mark confidence as "low" if data is incomplete or ambiguous
4. Generate trivia ONLY from facts mentioned in the source
5. For trivia, anonymize the player's name by replacing it with "[The Player]"

For each career step, extract:
- type: "club" or "loan" (use "loan" only when explicitly stated as a loan)
- text: Club name (exactly as appears in source, use common English names)
- year: Year or year range (e.g., "2011-2015" or "2011")
- apps: Number of league appearances (null if not clearly stated)
- goals: Number of league goals (null if not clearly stated)
- trivia: One factual achievement/trivia insight for significant clubs (null for short stints or if no notable achievements). Always anonymize with "[The Player]"
- confidence: "high" | "medium" | "low"

Confidence scoring:
- "high": All data (years, apps, goals) clearly stated in source
- "medium": Some data inferred or partially stated (e.g., total apps but not per-season)
- "low": Data is ambiguous, incomplete, estimated, or could not be verified

IMPORTANT:
- Only include SENIOR career (not youth teams)
- Order chronologically (earliest to most recent)
- Use common English club names (e.g., "AC Milan" not "Associazione Calcio Milan")
- If a player returned to a club for a second spell, include it as a separate entry

Return a valid JSON object with this exact structure:
{
  "answer": "Full Player Name",
  "career_steps": [
    {
      "type": "club",
      "text": "Club Name",
      "year": "2011-2015",
      "apps": 123,
      "goals": 45,
      "trivia": "[The Player] won two league titles during this spell",
      "confidence": "high"
    }
  ]
}`;

/**
 * Calls OpenAI to extract career data from wikitext.
 */
async function extractCareerWithAI(
  wikitext: string,
  playerName: string
): Promise<CareerScoutResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "OpenAI API key not configured",
    };
  }

  try {
    const userPrompt = `Extract the senior career history from this Wikipedia article about ${playerName}.

Here is the wikitext:

${wikitext.substring(0, 15000)}`; // Limit to avoid token limits

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
          { role: "system", content: SYSTEM_PROMPT },
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
    const parsed = JSON.parse(content) as CareerScoutData;

    // Validate the response structure
    if (!parsed.answer || !Array.isArray(parsed.career_steps)) {
      return {
        success: false,
        error: "Invalid response structure from AI",
      };
    }

    // Validate and filter career steps against source
    const validatedSteps = validateAgainstSource(parsed.career_steps, wikitext);

    if (validatedSteps.length === 0) {
      return {
        success: false,
        error: "No valid career data could be extracted",
      };
    }

    return {
      success: true,
      data: {
        answer: parsed.answer,
        career_steps: validatedSteps,
      },
    };
  } catch (error) {
    console.error("OpenAI extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract career data",
    };
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates extracted career steps against the source wikitext.
 * Filters out potential hallucinations and flags low-confidence items.
 */
function validateAgainstSource(
  steps: ScoutedCareerStep[],
  wikitext: string
): ScoutedCareerStep[] {
  const wikitextLower = wikitext.toLowerCase();

  return steps
    .filter((step) => {
      // Check if club name appears in source (basic anti-hallucination)
      const clubName = step.text.toLowerCase();

      // Try different variations of the club name
      const variations = [
        clubName,
        clubName.replace("fc", "").trim(),
        clubName.replace("cf", "").trim(),
        clubName.split(" ")[0], // First word (e.g., "Manchester" from "Manchester United")
      ];

      const foundInSource = variations.some((v) => v.length > 2 && wikitextLower.includes(v));

      if (!foundInSource) {
        console.warn(`[AI Scout] Potential hallucination filtered: ${step.text}`);
        return false;
      }

      return true;
    })
    .map((step) => {
      // Ensure confidence is properly typed
      const validConfidence: ConfidenceLevel =
        step.confidence === "high" || step.confidence === "medium" || step.confidence === "low"
          ? step.confidence
          : "low";

      // Ensure nulls are properly set
      return {
        ...step,
        apps: typeof step.apps === "number" ? step.apps : null,
        goals: typeof step.goals === "number" ? step.goals : null,
        trivia: typeof step.trivia === "string" && step.trivia.length > 0 ? step.trivia : null,
        confidence: validConfidence,
      };
    });
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Scouts a player's career from their Wikipedia page.
 *
 * @param wikipediaUrl - The full Wikipedia URL for the player
 * @returns CareerScoutResult with extracted career data or error
 */
export async function scoutPlayerCareer(
  wikipediaUrl: string
): Promise<CareerScoutResult> {
  // Extract page title from URL
  const pageTitle = extractPageTitle(wikipediaUrl);

  if (!pageTitle) {
    return {
      success: false,
      error: "Invalid Wikipedia URL. Could not extract page title.",
    };
  }

  // Fetch wikitext from Wikipedia
  const wikitextResult = await fetchWikipediaWikitext(pageTitle);

  if (!wikitextResult.success || !wikitextResult.wikitext) {
    return {
      success: false,
      error: wikitextResult.error || "Failed to fetch Wikipedia content",
    };
  }

  // Use the page title as the player name (Wikipedia normalizes titles)
  const playerName = wikitextResult.pageTitle || pageTitle.replace(/_/g, " ");

  // Extract career data using AI
  const result = await extractCareerWithAI(wikitextResult.wikitext, playerName);

  return result;
}
