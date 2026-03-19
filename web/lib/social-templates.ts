/**
 * Social media post templates for automated daily posting.
 *
 * Templates rotate across web-playable game modes.
 * Tone: cheeky football banter — "pub quiz host" energy.
 * Rules: never reveal answers, always include play link, vary copy.
 */

const BASE_URL = "https://football-iq.app";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocialTemplate {
  mode: string;
  slug: string;
  text: string;
}

export interface EngagementTemplate {
  type: "stats" | "streak" | "leaderboard" | "general";
  text: string;
}

// ---------------------------------------------------------------------------
// Daily puzzle teaser templates (5 modes × 4 templates each = 20)
// ---------------------------------------------------------------------------

export const PUZZLE_TEMPLATES: SocialTemplate[] = [
  // --- Career Path ---
  {
    mode: "career_path",
    slug: "career-path",
    text: `Who had this career path? 👀

One player. Multiple clubs. Can you name them from the clues?

Most people need at least 4 hints. How many will you need?

${BASE_URL}/play/career-path?ref=twitter`,
  },
  {
    mode: "career_path",
    slug: "career-path",
    text: `Today's Career Path is a tricky one.

You get up to 8 clues. The fewer you need, the higher your IQ.

Good luck — you'll need it.

${BASE_URL}/play/career-path?ref=twitter`,
  },
  {
    mode: "career_path",
    slug: "career-path",
    text: `"I definitely know this player"

— everyone, right before using all 8 clues

Today's Career Path is live. Prove us wrong.

${BASE_URL}/play/career-path?ref=twitter`,
  },
  {
    mode: "career_path",
    slug: "career-path",
    text: `Barcelona → ??? → Premier League → ???

Can you fill in the gaps? Today's Career Path is waiting.

${BASE_URL}/play/career-path?ref=twitter`,
  },

  // --- Connections ---
  {
    mode: "connections",
    slug: "connections",
    text: `16 players. 4 hidden groups. 0 room for error.

Today's Connections puzzle is live. Find the link before your mistakes run out.

${BASE_URL}/play/connections?ref=twitter`,
  },
  {
    mode: "connections",
    slug: "connections",
    text: `What do these players have in common?

Today's Connections will test your football knowledge in ways you don't expect.

${BASE_URL}/play/connections?ref=twitter`,
  },
  {
    mode: "connections",
    slug: "connections",
    text: `The purple group in today's Connections is absolutely evil.

Don't say we didn't warn you. 😈

${BASE_URL}/play/connections?ref=twitter`,
  },
  {
    mode: "connections",
    slug: "connections",
    text: `"Oh this is easy—"

Famous last words before getting today's Connections completely wrong.

4 groups. 4 chances to mess up. Go.

${BASE_URL}/play/connections?ref=twitter`,
  },

  // --- Transfer Guess ---
  {
    mode: "guess_the_transfer",
    slug: "transfer-guess",
    text: `How much did this transfer cost? 💰

You get hints. You get multiple guesses. You still won't get it right.

Prove us wrong.

${BASE_URL}/play/transfer-guess?ref=twitter`,
  },
  {
    mode: "guess_the_transfer",
    slug: "transfer-guess",
    text: `Today's Transfer Guess: a move that shocked the football world.

Were you paying attention when it happened? Let's find out.

${BASE_URL}/play/transfer-guess?ref=twitter`,
  },
  {
    mode: "guess_the_transfer",
    slug: "transfer-guess",
    text: `Think you know your transfer fees?

Today's puzzle says otherwise. Most people are off by at least 50%.

${BASE_URL}/play/transfer-guess?ref=twitter`,
  },
  {
    mode: "guess_the_transfer",
    slug: "transfer-guess",
    text: `Free transfer or record breaker?

Today's Transfer Guess is live. Your wallet knowledge is being tested.

${BASE_URL}/play/transfer-guess?ref=twitter`,
  },

  // --- Timeline ---
  {
    mode: "timeline",
    slug: "timeline",
    text: `Put this career in the right order. ⏱️

6 events. Sounds easy. It's not.

${BASE_URL}/play/timeline?ref=twitter`,
  },
  {
    mode: "timeline",
    slug: "timeline",
    text: `Which came first — the World Cup or the transfer?

Today's Timeline puzzle will mess with your memory.

${BASE_URL}/play/timeline?ref=twitter`,
  },
  {
    mode: "timeline",
    slug: "timeline",
    text: `"Obviously that happened before..."

Narrator: it did not happen before.

Today's Timeline is live. Sort the career events.

${BASE_URL}/play/timeline?ref=twitter`,
  },
  {
    mode: "timeline",
    slug: "timeline",
    text: `Your football timeline knowledge vs the actual timeline.

Spoiler: they rarely match. Today's puzzle is live.

${BASE_URL}/play/timeline?ref=twitter`,
  },

  // --- Topical Quiz ---
  {
    mode: "topical_quiz",
    slug: "topical-quiz",
    text: `5 questions on this week's football. No looking it up.

Today's Topical Quiz is live. How closely were you paying attention?

${BASE_URL}/play/topical-quiz?ref=twitter`,
  },
  {
    mode: "topical_quiz",
    slug: "topical-quiz",
    text: `Quick — who scored that goal on the weekend?

5 questions. Current football. No excuses.

${BASE_URL}/play/topical-quiz?ref=twitter`,
  },
  {
    mode: "topical_quiz",
    slug: "topical-quiz",
    text: `"I watch every game, I'll ace this"

Today's Topical Quiz has humbled many. Your turn.

${BASE_URL}/play/topical-quiz?ref=twitter`,
  },
  {
    mode: "topical_quiz",
    slug: "topical-quiz",
    text: `The weekend's football — distilled into 5 questions.

Were you watching or just checking your phone?

${BASE_URL}/play/topical-quiz?ref=twitter`,
  },
];

// ---------------------------------------------------------------------------
// Engagement templates (for stats/streak/leaderboard posts, 2-3x per week)
// ---------------------------------------------------------------------------

export const ENGAGEMENT_TEMPLATES: EngagementTemplate[] = [
  {
    type: "stats",
    text: `📊 Yesterday's stats:

Only {{completionRate}}% of players completed yesterday's {{modeName}}.

Think you're above average?

${BASE_URL}/play/{{slug}}?ref=twitter`,
  },
  {
    type: "stats",
    text: `Yesterday's {{modeName}} had a {{completionRate}}% completion rate.

The average score was {{avgScore}} IQ.

Today's puzzle is live — can you beat the average?

${BASE_URL}/play/{{slug}}?ref=twitter`,
  },
  {
    type: "streak",
    text: `🔥 Streak check

How many days in a row have you played?

Drop your number. No lying.

${BASE_URL}?ref=twitter`,
  },
  {
    type: "streak",
    text: `Some players are on 30+ day streaks.

Others forgot to play yesterday.

Which one are you? Don't break the chain.

${BASE_URL}?ref=twitter`,
  },
  {
    type: "leaderboard",
    text: `🏆 This week's tier breakdown:

Most players: Scout level
Top 5%: Director of Football
The elite: The Gaffer

Where do you sit?

${BASE_URL}?ref=twitter`,
  },
  {
    type: "general",
    text: `New here? Football IQ drops fresh puzzles every day:

🧩 Career Path — name the player from career clues
🔗 Connections — find the hidden groups
💰 Transfer Guess — nail the fee
⏱️ Timeline — sort the career events
📝 Topical Quiz — this week's football

${BASE_URL}?ref=twitter`,
  },
  {
    type: "general",
    text: `Your mates think they know football?

Send them Football IQ. New puzzles daily. Free to play. Bragging rights included.

${BASE_URL}?ref=twitter`,
  },
];

// ---------------------------------------------------------------------------
// Template selection helpers
// ---------------------------------------------------------------------------

const WEB_MODES = [
  "career-path",
  "transfer-guess",
  "connections",
  "topical-quiz",
  "timeline",
] as const;

/**
 * Get the game mode for a given date using deterministic rotation.
 */
export function getModeForDate(date: Date): (typeof WEB_MODES)[number] {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return WEB_MODES[dayOfYear % WEB_MODES.length];
}

/**
 * Pick a template for a given date. Uses date-based seed for deterministic
 * but varied selection within each mode's pool.
 */
export function pickTemplateForDate(date: Date): SocialTemplate {
  const slug = getModeForDate(date);
  const modeTemplates = PUZZLE_TEMPLATES.filter((t) => t.slug === slug);

  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Use week number to cycle through templates within a mode
  const weekOfYear = Math.floor(dayOfYear / 7);
  const index = weekOfYear % modeTemplates.length;

  return modeTemplates[index];
}

/**
 * Check if a given date should get an engagement post (Weds + Sat).
 */
export function isEngagementDay(date: Date): boolean {
  const day = date.getDay();
  return day === 3 || day === 6; // Wednesday or Saturday
}
