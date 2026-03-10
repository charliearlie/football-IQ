/**
 * Prompt templates for generating Facebook ad images per game mode.
 *
 * Each template receives the puzzle content and returns:
 *   - imagePrompt: text prompt for Gemini image generation
 *   - caption: Facebook post text with play link
 */

import type { GameMode } from "@/lib/constants";

interface AdContent {
  imagePrompt: string;
  caption: string;
}

const VISUAL_PREAMBLE = `You are generating an advertisement image for a mobile football trivia app called "Football IQ".

STRICT VISUAL REQUIREMENTS:
- Background: Pure black (#000000), solid fill
- Primary accent: Bright neon green (#2EFC5D) for highlights and UI elements
- Text: Pure white (#FFFFFF), bold uppercase, clean sans-serif font
- Style: Premium, dark, minimal — like a polished mobile app screenshot
- Aspect ratio: 1:1 (square, for Facebook feed)
- No watermarks, no decorations, no gradients
- Must look like a real app screenshot, not an illustration`;

function connectionsPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const groups = (content.groups as Array<{ players: string[] }>) || [];
  const allPlayers = groups.flatMap((g) => g.players);

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Connections" game mode
- Title "CONNECTIONS" centered at top in bold white uppercase
- Below title: "OBJECTIVE" in green (#2EFC5D) with "Find groups of four" in white
- Right side: "MISTAKES LEFT" with 4 green dots
- Main area: 4x4 grid of rounded dark grey (#1a1a1a) tiles with subtle borders
- Each tile has a player name in bold white uppercase, centered
- Grid spacing is even, tiles are uniform size

The 16 player names (left to right, top to bottom):
${allPlayers.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;

  const caption = `Can you find the 4 connections? ⚽

Today's Football IQ Connections puzzle is LIVE. 16 players, 4 hidden groups — can you crack them all?

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #Connections #FootballQuiz`;

  return { imagePrompt, caption };
}

function careerPathPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const steps =
    (content.career_steps as Array<{
      year: string;
      text: string;
      type: string;
      apps: number;
      goals: number;
    }>) || [];

  const stepsText = steps
    .map((s) => {
      const loan = s.type === "loan" ? " (loan)" : "";
      return `${s.year} — ${s.text}${loan} (${s.apps} apps, ${s.goals} goals)`;
    })
    .join("\n");

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Career Path" game mode
- Title "CAREER PATH" centered at top in bold white uppercase
- Vertical timeline with green (#2EFC5D) dots connected by a thin green line
- Each step shows: club name in white, years in grey, apps/goals in smaller text
- At the bottom: "WHO IS THIS PLAYER?" in green text with a question mark
- Timeline flows top to bottom

Career steps:
${stepsText}`;

  const caption = `Can you guess the player from their career path? ⚽

Follow the clubs, the loan spells, the goals — who is it?

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #CareerPath #FootballQuiz`;

  return { imagePrompt, caption };
}

function transferGuessPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const fee = (content.fee || content.transfer_fee || "???") as string;
  const year = (content.year || content.transfer_year || "???") as string;
  const fromClub = (content.from_club || content.selling_club || "???") as string;
  const toClub = (content.to_club || content.buying_club || "???") as string;

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Transfer Guess" game mode
- Title "TRANSFER GUESS" centered at top in bold white uppercase
- Central card showing transfer details:
  - Arrow from "${fromClub}" to "${toClub}"
  - Year: ${year}
  - Fee: ${fee}
  - Large question mark silhouette where the player photo would be
- Card has dark grey background with subtle green border`;

  const caption = `Who made this transfer? ⚽

Can you name the player from the transfer details?

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #TransferGuess #FootballQuiz`;

  return { imagePrompt, caption };
}

function timelinePrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const events = (content.events || content.timeline_events || []) as Array<
    Record<string, unknown>
  >;
  const eventsText = events
    .slice(0, 6)
    .map(
      (e, i) =>
        `${i + 1}. ${e.description || e.text || e.event || "Football event"}`,
    )
    .join("\n");

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Timeline" game mode
- Title "TIMELINE" centered at top in bold white uppercase
- Horizontal timeline with event cards that need ordering
- Each card is a dark grey rounded rectangle with white text
- Green connecting line between cards
- Subtitle: "Put these events in chronological order"

Events:
${eventsText}`;

  const caption = `Can you put these football moments in order? ⚽

Test your football knowledge with today's Timeline puzzle!

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #Timeline #FootballQuiz`;

  return { imagePrompt, caption };
}

function goalscorerRecallPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const match = (content.match || content.fixture || "") as string;
  const score = (content.score || content.result || "") as string;

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Goalscorer Recall" game mode
- Title "GOALSCORER RECALL" centered at top in bold white uppercase
- Large match card in center with:
  - "${match}" in white
  - "${score}" in large green (#2EFC5D) text
  - "Can you name all the goalscorers?" below in white
- Dark grey card with subtle green accent border`;

  const caption = `Can you name every goalscorer? ⚽

${match} ${score} — how many can you recall?

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #GoalscorerRecall #FootballQuiz`;

  return { imagePrompt, caption };
}

function startingXIPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const match = (content.match || content.fixture || "") as string;
  const team = (content.team || "") as string;

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Starting XI" game mode
- Title "STARTING XI" centered at top in bold white uppercase
- Football pitch outline in dark green on black background
- 11 position markers shown as green (#2EFC5D) circles with "?" inside
- Below pitch: "${team}" and "${match}" in white text
- "Can you name the Starting XI?" as subtitle`;

  const caption = `Can you name the Starting XI? ⚽

${team} — ${match}. How many can you get?

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #StartingXI #FootballQuiz`;

  return { imagePrompt, caption };
}

function topicalQuizPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const title = (content.title || content.quiz_title || "Football Quiz") as string;

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Topical Quiz" game mode
- Title "TOPICAL QUIZ" centered at top in bold white uppercase
- Central card with quiz title "${title}" in white
- Question mark icons in green (#2EFC5D)
- "Test your knowledge!" subtitle in grey text
- Dark grey card, minimal layout`;

  const caption = `New quiz alert! ⚽

"${title}" — how well do you know your football?

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #TopicalQuiz #FootballQuiz`;

  return { imagePrompt, caption };
}

function topTensPrompt(
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const category = (content.category || content.title || "Football Top 10") as string;

  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: "Top Tens" game mode
- Title "TOP TENS" centered at top in bold white uppercase
- Leaderboard-style numbered list (1-10) with dark grey rows
- Each row has a number in green (#2EFC5D) and "???" in white
- Category "${category}" shown above the list in white
- "Can you name all 10?" subtitle`;

  const caption = `Can you name all 10? ⚽

"${category}" — test your knowledge!

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #TopTens #FootballQuiz`;

  return { imagePrompt, caption };
}

function defaultPrompt(
  displayName: string,
  playUrl: string,
): AdContent {
  const imagePrompt = `${VISUAL_PREAMBLE}

LAYOUT: Generic Football IQ ad
- Title "FOOTBALL IQ" centered in bold white uppercase
- Subtitle "Daily Football Trivia" in green (#2EFC5D)
- "Play Now" call to action at bottom
- Minimal, clean, dark layout`;

  const caption = `New daily puzzle is LIVE! ⚽

Test your football knowledge with today's ${displayName} challenge.

👉 Play now: ${playUrl}

#FootballTrivia #FootballIQ #FootballQuiz`;

  return { imagePrompt, caption };
}

const PROMPT_BUILDERS: Partial<
  Record<GameMode, (content: Record<string, unknown>, playUrl: string) => AdContent>
> = {
  connections: connectionsPrompt,
  career_path: careerPathPrompt,
  guess_the_transfer: transferGuessPrompt,
  timeline: timelinePrompt,
  guess_the_goalscorers: goalscorerRecallPrompt,
  starting_xi: startingXIPrompt,
  topical_quiz: topicalQuizPrompt,
  top_tens: topTensPrompt,
};

export function buildAdContent(
  gameMode: GameMode,
  displayName: string,
  content: Record<string, unknown>,
  playUrl: string,
): AdContent {
  const builder = PROMPT_BUILDERS[gameMode];
  if (builder) {
    return builder(content, playUrl);
  }
  return defaultPrompt(displayName, playUrl);
}
