/**
 * Blog content clusters — single source of truth for tag taxonomy and the
 * weekly cluster-rotation schedule.
 *
 * The plan calls for cluster-batched publishing: 5-7 articles per pillar
 * per week to build topical authority. This file defines:
 *   1. The canonical pillar list (and the URL each pillar targets)
 *   2. The shape of an Article Tag (tags assigned to blog_articles.tags[])
 *   3. The weekly rotation schedule — `getActiveClusterForDate(d)` returns
 *      the cluster that should be the focus for the week containing `d`
 *
 * The existing daily news cron (`/api/cron/blog-generate`) reads the active
 * cluster and asks the LLM to assign 2-4 tags from the canonical set, with
 * preference for tags belonging to the active cluster.
 */

export type PillarTag =
  | "premier-league"
  | "champions-league"
  | "world-cup"
  | "transfer-news"
  | "trivia-questions"
  | "football-history"
  | "connections"
  | "career-path"
  // Format-specific tags (orthogonal to pillars)
  | "listicle"
  | "deep-dive"
  | "data-insight"
  | "mode-spotlight"
  | "seasonal"
  | "guide"
  | "daily-football";

/** All valid tags. Use this when validating tag input. */
export const VALID_TAGS: PillarTag[] = [
  "premier-league",
  "champions-league",
  "world-cup",
  "transfer-news",
  "trivia-questions",
  "football-history",
  "connections",
  "career-path",
  "listicle",
  "deep-dive",
  "data-insight",
  "mode-spotlight",
  "seasonal",
  "guide",
  "daily-football",
];

export interface Cluster {
  /** Canonical slug used in cluster URLs and internal references */
  slug: string;
  /** Display name */
  name: string;
  /** Pillar tag — primary tag every article in this cluster receives */
  primaryTag: PillarTag;
  /** Hub URL on the site that all cluster articles must internally link to */
  hubUrl: string;
  /** Tags the LLM should strongly prefer when writing articles in this cluster */
  preferredTags: PillarTag[];
  /** Game-mode pages the LLM should consider linking from cluster articles */
  relatedGameModes: string[];
}

/**
 * The 6 canonical content pillars. Each cluster has one hub page on the site.
 * The weekly rotation cycles through these in order.
 */
export const CLUSTERS: Cluster[] = [
  {
    slug: "daily-football-quizzes",
    name: "Daily Football Quizzes",
    primaryTag: "daily-football",
    hubUrl: "/play",
    preferredTags: ["daily-football", "guide", "mode-spotlight"],
    relatedGameModes: [
      "/play/career-path",
      "/play/transfer-guess",
      "/play/connections",
    ],
  },
  {
    slug: "competition-quizzes",
    name: "Competition Quizzes",
    primaryTag: "premier-league",
    hubUrl: "/football-trivia-questions",
    preferredTags: ["premier-league", "champions-league", "trivia-questions"],
    relatedGameModes: ["/play/career-path", "/play/topical-quiz"],
  },
  {
    slug: "guess-the-footballer",
    name: "Guess the Footballer",
    primaryTag: "career-path",
    hubUrl: "/quiz/guess-the-footballer",
    preferredTags: ["career-path", "guide", "trivia-questions"],
    relatedGameModes: ["/play/career-path", "/play/transfer-guess"],
  },
  {
    slug: "football-trivia-questions",
    name: "Football Trivia Questions",
    primaryTag: "trivia-questions",
    hubUrl: "/football-trivia-questions",
    preferredTags: ["trivia-questions", "listicle", "deep-dive"],
    relatedGameModes: ["/play/career-path", "/play/timeline"],
  },
  {
    slug: "football-history",
    name: "Football History",
    primaryTag: "football-history",
    hubUrl: "/quiz/football-history",
    preferredTags: ["football-history", "deep-dive", "trivia-questions"],
    relatedGameModes: ["/play/timeline", "/play/career-path"],
  },
  {
    slug: "football-connections",
    name: "Football Connections",
    primaryTag: "connections",
    hubUrl: "/football-connections",
    preferredTags: ["connections", "guide", "trivia-questions"],
    relatedGameModes: ["/play/connections", "/play/career-path"],
  },
];

/**
 * Returns the cluster that's the focus for the week containing the given date.
 * Cycles through CLUSTERS in order, advancing one cluster per ISO week.
 *
 * Rationale: the LLM doesn't need to know "which week of the rotation" —
 * it just needs the active cluster. Rotation is deterministic so backfills
 * and manual triggers always land on a stable cluster.
 */
export function getActiveClusterForDate(date: Date): Cluster {
  const isoWeek = getISOWeek(date);
  const isoYear = getISOWeekYear(date);
  const weekIndex = (isoYear * 53 + isoWeek) % CLUSTERS.length;
  return CLUSTERS[weekIndex];
}

/** Returns the cluster matching `slug`, or null if not found. */
export function getClusterBySlug(slug: string): Cluster | null {
  return CLUSTERS.find((c) => c.slug === slug) ?? null;
}

/** Filters input tags down to only valid pillar tags, deduped. */
export function sanitizeTags(input: unknown): PillarTag[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: PillarTag[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const t = raw.toLowerCase().trim() as PillarTag;
    if (!VALID_TAGS.includes(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 4) break;
  }
  return out;
}

// ─── ISO week helpers (no extra deps) ────────────────────────────────────────

function getISOWeek(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
}

function getISOWeekYear(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  return target.getUTCFullYear();
}
