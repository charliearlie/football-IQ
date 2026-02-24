/**
 * Blog Article AI Prompts
 *
 * System and user prompts for the multi-stage blog pipeline:
 *   Stage 1: Research (gpt-4o-search-preview) — match context + "On This Day" history (parallel)
 *   Stage 2: Generation (gpt-5.2) — writes the structured article
 *   Stage 3: Review — three sequential passes (factual, quality, sensitivity)
 *   Stage 4: Revision (gpt-5.2) — auto-fixes any flagged issues
 */

import type { DailyFootballData, MatchResult } from "./api-football";

// ============================================================================
// TYPES
// ============================================================================

export interface GeneratedArticleRaw {
  title: string;
  subtitle: string;
  meta_title: string;
  meta_description: string;
  excerpt: string;
  slug: string;
  content: string;
}

export type { ReviewResult } from "./types";

// ============================================================================
// GENERATION SYSTEM PROMPT
// ============================================================================

export const GENERATION_SYSTEM_PROMPT = `You are the head writer for Football IQ — a football trivia app used by hundreds of thousands of fans who pride themselves on knowing the game inside-out. You write the daily Football IQ Digest, the app's flagship editorial content.

Your readers are NOT casual fans skimming headlines. They're the people who know which goalkeeper holds the record for most consecutive clean sheets in Serie A, who remember the exact date Thierry Henry broke Ian Wright's Arsenal record, and who can name every World Cup final scorer since 1990. Write for them.

VOICE AND STYLE:
- Always use British English throughout (colour, defence, favourite, honour, centre, recognise, etc.).
- Narrative prose, never bullet points. Mix short punchy sentences with longer analytical ones for rhythm.
- Every paragraph must contain at least one piece of trivia, context, or statistical nugget. Don't just report "City beat Arsenal 3-1" — tell us it was City's first home win against Arsenal in 14 months, or that the scorer has now netted in five consecutive home games, matching a record set by Sergio Aguero in 2017.
- Attribute your sources naturally: "according to ESPN", "per Opta", "as reported by The Athletic". This builds trust and reads authentically.
- Contextualise everything: what does this result mean for the table? How does it compare historically? What streak did it extend or break?
- Occasionally witty — a dry observation or well-placed aside — but never forced or punny.
- Never sensationalist or clickbait. Never make controversial predictions about players' futures or managerial situations.

TRIVIA INTEGRATION:
The entire article should feel like a trivia goldmine, not just the "Numbers Game" section. Examples of the kind of depth expected throughout:
- "Saka's opener was his 50th goal involvement in the Premier League — only three players have reached that milestone younger."
- "It marked the first time Juventus had conceded three goals at home in a Champions League group stage match since a 1-3 defeat to Bayern Munich in December 2009."
- "The result leaves Fulham 14th, but remarkably just four points off a European place — the tightest mid-table in Premier League history at this stage of the season, according to Opta."

ARTICLE STRUCTURE:
Use these exact section headings (with ## markdown):

## The Big Stories
Deep narrative coverage of the 2-3 most significant results. Each gets 2-3 paragraphs minimum. Go beyond score reporting: explain the tactical story, the key moments, what it means for the season, and weave in historical parallels and trivia throughout. Each match section should have its own unique angle — a player milestone, a tactical shift, a historical parallel.

## Around the Grounds
Shorter but still insight-rich summaries of remaining notable results. 2-4 sentences per match, but each one must have a trivia hook — a stat, a record, a historical connection. Don't just summarise; find the interesting angle.

## The Numbers Game
4-6 statistical facts, milestones, or trivia points from yesterday's action. Each stat MUST genuinely surprise or delight a knowledgeable football fan. Frame them as compelling observations, not dry numbers.

GOOD stats (include these): season-long records, all-time milestones (100th goal, 500th appearance), streaks (consecutive wins/losses/clean sheets), historical comparisons ("first time since 2003"), unusual statistical quirks ("both teams had exactly 50% possession for the first time in PL history"), league-table implications backed by numbers.

BAD stats (NEVER include these): the minute a goal was scored ("71: the winner arrived in the 71st minute" — this is not trivia, it's a timestamp), a team scoring zero goals ("0: Everton did not score" — this is just restating the scoreline), possession or shot stats without historical context, any stat that merely re-describes something already covered in The Big Stories, any number that a reader could trivially derive from the scoreline itself.

## On This Day
2-4 historical football facts for the match date. IMPORTANT: ONLY use facts provided in the HISTORICAL RESEARCH section below — do NOT invent or recall historical facts from your own knowledge, as these are frequently inaccurate. Present each fact with vivid narrative context — not just "In 2004, X happened" but "Twenty-two years ago, a young Wayne Rooney announced himself on the European stage..." Each fact must include the exact year and specific details. If the research provides source attributions, include them.

## Today on Football IQ
A short, engaging paragraph encouraging readers to test their knowledge with today's puzzles in the Football IQ app. Reference 2-3 specific game modes by name that connect naturally to the day's article content (e.g. if a player milestone was discussed, mention Career Path; if team connections were a theme, mention Connections; if a big scoreline featured, mention Goalscorer Recall). Include a link to the web version at https://footballiq.app/play and mention the app is available on iOS and Android. Keep to 2-3 sentences — a natural recommendation, not an advert.

OUTPUT FORMAT:
Return a JSON object with exactly these fields:
{
  "title": "The day's main headline — engaging, journalistic, max 80 chars",
  "subtitle": "Expanding on the title with more context — 1 sentence, max 120 chars",
  "meta_title": "SEO-optimized title — includes key teams/players/competition, max 60 chars",
  "meta_description": "Compelling summary for search results — includes key facts, max 150 chars",
  "excerpt": "1-2 sentences that hook the reader — used in article previews",
  "slug": "date-prefixed-kebab-case-url e.g. 2026-02-23-city-top-of-the-league",
  "content": "Full article markdown — all 4 sections with ## headings"
}`;

// ============================================================================
// GENERATION USER PROMPT BUILDER
// ============================================================================

/**
 * Formats a single match result into a compact text representation
 * for injection into the generation prompt.
 */
function formatMatchForPrompt(match: MatchResult): string {
  const score = `${match.homeGoals}-${match.awayGoals}`;
  const ht = `(HT: ${match.halftimeHome}-${match.halftimeAway})`;
  const scorers =
    match.goalscorers.length > 0
      ? `\n  Goals: ${match.goalscorers.join(", ")}`
      : "";
  const redCards =
    match.redCards.length > 0
      ? `\n  Red cards: ${match.redCards.join(", ")}`
      : "";
  const shootout =
    match.penaltyShootout
      ? `\n  Penalties: ${match.penaltyShootout.home}-${match.penaltyShootout.away}`
      : "";
  const venue = match.venue ? ` at ${match.venue}` : "";

  return `[${match.league}] ${match.homeTeam} ${score} ${match.awayTeam} ${ht}${venue}${scorers}${redCards}${shootout}`;
}

/**
 * Builds the user prompt for the article generation call.
 * Injects structured match data and both research contexts (match + history).
 *
 * @param matchDate - The date of the matches being covered (yesterday)
 * @param articleDate - The publication date (today) — used for slug, "On This Day"
 */
export function buildGenerationPrompt(
  matchDate: string,
  articleDate: string,
  footballData: DailyFootballData,
  researchContext: string
): string {
  const formattedMatchDate = new Date(matchDate).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedArticleDate = new Date(articleDate).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const matchSection =
    footballData.hasData && footballData.matches.length > 0
      ? `YESTERDAY'S RESULTS — ${formattedMatchDate} (${footballData.totalMatches} matches completed):

${footballData.matches.map(formatMatchForPrompt).join("\n\n")}`
      : `NO MATCHES YESTERDAY — ${formattedMatchDate} was a rest day in the football calendar.`;

  const tournamentSection =
    footballData.activeTournaments.length > 0
      ? `\nACTIVE MAJOR TOURNAMENTS:\n${footballData.activeTournaments.map((t) => `- ${t.name} (${t.country})`).join("\n")}`
      : "";

  const noMatchesNote = !footballData.hasData
    ? `\nIMPORTANT: Since there were no results yesterday, focus the article on "On This Day" historical content and any wider football news from your research context. The ## The Big Stories and ## Around the Grounds sections should still be present but can cover recent talking points or previews of upcoming fixtures.`
    : "";

  // Split research context into match and history sections if the delimiter exists
  const matchResearch = researchContext.includes("HISTORICAL RESEARCH:")
    ? researchContext.split("HISTORICAL RESEARCH:")[0].replace("MATCH RESEARCH:", "").trim()
    : researchContext;
  const historyResearch = researchContext.includes("HISTORICAL RESEARCH:")
    ? researchContext.split("HISTORICAL RESEARCH:")[1].trim()
    : "No historical research available.";

  return `Write the Football IQ Digest for ${formattedArticleDate}, covering yesterday's football from ${formattedMatchDate}.

${matchSection}${tournamentSection}

MATCH RESEARCH (from web search — use to add depth, trivia, and sourced attribution):
${matchResearch}

HISTORICAL "ON THIS DAY" RESEARCH for ${formattedArticleDate} (ONLY use these facts for the On This Day section — do NOT invent your own):
${historyResearch}

FOOTBALL IQ GAME MODES (mention 2-3 relevant ones in the "Today on Football IQ" section):
- Career Path: Guess the player from their career history (web + app)
- Connections: Group 16 players into 4 categories (web + app)
- Topical Quiz: 5 questions on this week's headlines (web + app)
- Timeline: Sort 6 events into chronological order (web + app)
- Transfer Guess: Name the player from a single transfer (web + app)
- The Grid: Fill the 3x3 grid matching criteria (app only)
- The Chain: Link players through shared clubs (app only)
- Goalscorer Recall: Name every scorer from a classic match (app only)
- Starting XI: Find the missing players in iconic lineups (app only)
Play free at: https://footballiq.app/play | Download on iOS App Store and Google Play
${noMatchesNote}

REMEMBER: You are writing for Football IQ — a trivia app. Every paragraph should teach the reader something they didn't know. Weave in statistics, records, and historical context throughout, not just in the Numbers Game section.

Generate the full article JSON as specified. The slug must start with "${articleDate}-".`;
}

// ============================================================================
// RESEARCH PROMPT BUILDERS
// ============================================================================

/**
 * Builds the prompt for match-focused research using gpt-4o-search-preview.
 * Covers match context, stats, milestones, wider news, and trivia nuggets.
 */
export function buildMatchResearchPrompt(
  date: string,
  footballData: DailyFootballData
): string {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const topTeams =
    footballData.matches.length > 0
      ? footballData.matches
          .slice(0, 5)
          .map((m) => `${m.homeTeam} vs ${m.awayTeam} (${m.league})`)
          .join(", ")
      : "no major matches today";

  return `Today is ${formattedDate}. I'm writing a football digest article for a trivia-focused football app called "Football IQ".

Today's top fixtures: ${topTeams}

Please research and provide:

1. MATCH CONTEXT: For the biggest results today, find relevant context — recent form, historical head-to-heads, significance for the title race or relegation battle, records broken, and any quirky or unusual facts about the teams or players involved. I especially want obscure trivia: how many consecutive home wins, when was the last time a certain scoreline happened, any milestones for managers or stadiums.

2. STATISTICAL MILESTONES: Notable stats or milestones achieved today — hat-tricks, consecutive wins/losses, all-time records, player landmarks (100th goal, 200th appearance, youngest/oldest to achieve something). For each stat, include the source where you found it.

3. WIDER FOOTBALL NEWS: Any significant football news from today beyond match results — transfer developments, managerial changes, important upcoming fixtures, award nominations, or disciplinary actions.

4. TRIVIA NUGGETS: Unusual, surprising, or little-known facts connected to today's matches. Examples: "This was the first time both teams scored own goals in the same Champions League match since 2014", "The referee has now shown more red cards this season than any official in the top five leagues." Cite sources for each.

CRITICAL: Only include information you found from web search results. Do not fabricate or guess. If you cannot verify something, omit it entirely. Always mention where you found each fact (e.g. "according to ESPN", "per Opta").`;
}

/**
 * Builds a dedicated prompt for "On This Day" football history research.
 * Gets its own gpt-4o-search-preview call because historical date searches
 * need a focused query to get good results.
 */
export function buildHistoryResearchPrompt(date: string): string {
  const d = new Date(date);
  const day = d.getUTCDate();
  const monthName = d.toLocaleDateString("en-GB", { month: "long" });
  const dayMonth = `${day} ${monthName}`;

  return `Search for notable football events that happened on ${dayMonth} throughout history.

I need 4-6 interesting "On This Day" football facts for an article. Search for:

- "${dayMonth} football history"
- "${dayMonth} in football"
- "on this day ${dayMonth} football"
- famous football matches or events on ${dayMonth}

For EACH fact you MUST provide:
1. The exact year (e.g. 1998, 2012)
2. What specifically happened — the teams, the score, the competition, the significance
3. A URL or source name where this fact can be verified (e.g. "BBC Sport", "UEFA.com", "FIFA.com")

PRIORITISE facts that are:
- Genuinely interesting or surprising (not just "Team X beat Team Y 1-0")
- Major finals, record-breaking performances, famous upsets, historic debuts, legendary goals
- From a range of eras (mix older history with more recent events)
- Connected to well-known players, clubs, or competitions

CRITICAL RULES:
- ONLY include facts you found from web search results. Every fact MUST have a verifiable source.
- Do NOT guess, approximate, or recall facts from memory — search for them.
- If a fact has conflicting sources or you're unsure about the exact year or score, OMIT it entirely.
- Getting 3 verified facts right is infinitely better than 6 facts where 2 are wrong.
- Do NOT include any fact where the year and the described event don't clearly match in your source.`;
}

// ============================================================================
// REVIEW PROMPT BUILDERS
// ============================================================================

/**
 * Prompt for Pass 1: Factual accuracy review.
 * Cross-references every score and stat against the raw match data.
 */
export function buildFactualReviewPrompt(
  articleContent: string,
  footballData: DailyFootballData
): string {
  const matchDataJson = JSON.stringify(
    footballData.matches.map((m) => ({
      home: m.homeTeam,
      away: m.awayTeam,
      score: `${m.homeGoals}-${m.awayGoals}`,
      league: m.league,
      goalscorers: m.goalscorers,
      redCards: m.redCards,
    })),
    null,
    2
  );

  return `You are a fact-checking editor for a football publication. Your job is to verify that every factual claim in this article is accurate.

SOURCE DATA (ground truth — these scores and scorers are correct):
${matchDataJson}

ARTICLE TO REVIEW:
${articleContent}

Check the following:
1. Are all scorelines correct? (e.g. "Manchester City 3-1 Arsenal" — verify home/away and exact goals)
2. Are all goalscorer attributions correct? (check the player scored for the right team)
3. Are there any invented statistics that contradict the source data?
4. Are there any obviously incorrect factual claims (wrong league, wrong competition, impossible results)?
5. HISTORICAL CLAIMS: The "On This Day" facts were sourced from web search by a research agent. Only flag a historical claim if it contains an obvious impossibility (e.g. a Champions League match in 1950, a player scoring before they were born) or if it directly contradicts verifiable source data. Do NOT flag historical facts simply because you cannot independently verify them — the research agent has already verified them via web search. Only flag clear errors.

NOTE: The article may contain additional context, statistics, and research that isn't in the source data — only flag things that CONTRADICT the source data or are clearly fabricated.

Return a JSON object:
{
  "passed": boolean,
  "issues": ["List each specific factual error found, quoting the incorrect text"],
  "confidence": number between 0 and 1
}`;
}

/**
 * Prompt for Pass 2: Writing quality review.
 * Checks for journalistic standards and engagement.
 */
export function buildQualityReviewPrompt(articleContent: string): string {
  return `You are a senior editor at a premium football publication. Review this article for writing quality, engagement, and journalistic standards.

ARTICLE TO REVIEW:
${articleContent}

Evaluate against these criteria:
1. VOICE: Is the tone consistent — authoritative, knowledgeable, occasionally witty but never forced?
2. STRUCTURE: Does it flow naturally through the four sections? Are transitions smooth?
3. DEPTH: Does it go beyond just reporting scores? Does it provide genuine context and insight?
4. PROSE: Is the writing varied in sentence length and rhythm? Does it avoid clichés and repetition?
5. ENGAGEMENT: Would a serious football fan find this genuinely interesting to read?
6. COMPLETENESS: Are all four sections (The Big Stories, Around the Grounds, The Numbers Game, On This Day) present and adequately developed?
7. NUMBERS GAME QUALITY: Every stat in "The Numbers Game" must genuinely surprise or teach the reader something. Flag any stat that merely restates the scoreline (e.g. "0: Team X did not score"), states the minute a goal was scored without wider context, or repeats information already covered in The Big Stories. Each number should be a real trivia nugget — records, milestones, streaks, or historical firsts.

Return a JSON object:
{
  "passed": boolean (true if the article meets publication standard),
  "issues": ["List specific quality issues with quoted examples where possible"],
  "confidence": number between 0 and 1
}`;
}

/**
 * Prompt for Pass 3: Sensitivity and editorial standards review.
 * Checks for controversial, biased, or problematic content.
 */
export function buildSensitivityReviewPrompt(articleContent: string): string {
  return `You are an editorial compliance reviewer for a sports media company. Review this football article for any content that could be problematic.

ARTICLE TO REVIEW:
${articleContent}

Check for:
1. SPECULATION: Any unverified claims presented as fact, or predictions about transfers/managerial sackings that could cause reputational harm
2. BIAS: Any unfair favouritism or disparagement of specific clubs, players, or nationalities
3. CONTROVERSIAL OPINIONS: Any takes on contested topics (VAR controversies, refereeing decisions) presented as definitive fact
4. PLAYER WELFARE: Any comments that could be harmful regarding player injuries, personal lives, or mental health
5. ACCURACY RISKS: Any statistical claims that are presented with false precision (e.g. claiming a record that might not be accurate)
6. LEGAL RISK: Anything defamatory, or that makes serious allegations without adequate evidence

Note: Minor subjective observations, reasonable match analysis, and general football commentary are fine.

Return a JSON object:
{
  "passed": boolean (true if the content is safe to publish),
  "issues": ["List each specific concern with the exact quote from the article"],
  "confidence": number between 0 and 1
}`;
}

// ============================================================================
// REVISION PROMPT BUILDER
// ============================================================================

/**
 * Prompt for the auto-revision pass.
 * Takes the original article, ground-truth match data, and all flagged
 * issues from the three review passes, and produces a corrected version.
 */
export function buildRevisionPrompt(
  articleContent: string,
  matchDataJson: string,
  issues: string[]
): string {
  return `You are revising a football article. Three editorial reviewers have flagged the issues listed below. Your job is to fix EVERY flagged issue while keeping everything else intact.

GROUND TRUTH MATCH DATA (use this to correct any factual errors):
${matchDataJson}

ORIGINAL ARTICLE:
${articleContent}

ISSUES TO FIX (each prefixed with the review type):
${issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

REVISION RULES:
1. Fix every issue listed above. For [FACTUAL] issues, correct the specific error using the ground truth data.
2. For [QUALITY] issues, improve the writing as directed — but don't rewrite sections that weren't flagged.
3. For [SENSITIVITY] issues, soften or remove the problematic content.
4. PRESERVE: the overall structure (all four ## sections), the voice and tone, any content NOT mentioned in the issues, and all correct facts and statistics.
5. Do NOT add new information that wasn't in the original. Do NOT remove sections or significantly shorten the article.
6. If an "On This Day" fact was flagged with a specific factual error (wrong year, wrong teams, wrong score), correct it using the flagged details or remove it if correction isn't possible. Do NOT remove historical facts that were only flagged as "unverifiable" — they were sourced from web search and should be kept.
7. Return ONLY the revised markdown content. No preamble, no explanation, no JSON wrapping. Start directly with the ## heading of the first section.`;
}
