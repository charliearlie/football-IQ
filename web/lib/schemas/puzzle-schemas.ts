import { z } from "zod";
import { GAME_MODES, PUZZLE_STATUSES } from "@/lib/constants";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const puzzleBaseSchema = z.object({
  puzzle_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  game_mode: z.enum(GAME_MODES),
  status: z.enum(PUZZLE_STATUSES).default("draft"),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  source: z.string().nullable().optional(),
});

export type PuzzleBase = z.infer<typeof puzzleBaseSchema>;

// ============================================================================
// CAREER PATH (career_path & career_path_pro)
// ============================================================================

export const careerStepSchema = z.object({
  type: z.enum(["club", "loan"]),
  text: z.string().min(1, "Club name required"),
  year: z.string().min(1, "Year required"),
  apps: z.coerce.number().int().nonnegative().optional().nullable(),
  goals: z.coerce.number().int().nonnegative().optional().nullable(),
});

export const careerPathContentSchema = z.object({
  answer: z.string().min(1, "Player name required"),
  answer_qid: z.string().optional(),
  career_steps: z
    .array(careerStepSchema)
    .min(3, "At least 3 career steps required")
    .max(15, "Maximum 15 career steps"),
});

export type CareerPathContent = z.infer<typeof careerPathContentSchema>;
export type CareerStep = z.infer<typeof careerStepSchema>;

// ============================================================================
// TRANSFER GUESS (guess_the_transfer)
// ============================================================================

export const transferGuessContentSchema = z.object({
  answer: z.string().min(1, "Player name required"),
  from_club: z.string().min(1, "Origin club required"),
  to_club: z.string().min(1, "Destination club required"),
  year: z.coerce.number().int().min(1900).max(2030),
  fee: z.string().min(1, "Transfer fee required"),
  hints: z.tuple([
    z.string().min(1, "Transfer year hint required"),
    z.string().min(1, "Position hint required"),
    z.string().min(1, "Nationality hint required"),
  ]),
});

export type TransferGuessContent = z.infer<typeof transferGuessContentSchema>;

// ============================================================================
// GOALSCORER RECALL (guess_the_goalscorers)
// ============================================================================

export const goalEventSchema = z.object({
  scorer: z.string().min(1, "Scorer name required"),
  minute: z.coerce.number().int().min(1).max(120),
  team: z.enum(["home", "away"]),
  isOwnGoal: z.boolean().optional().default(false),
});

export const goalscorerRecallContentSchema = z.object({
  home_team: z.string().min(1, "Home team required"),
  away_team: z.string().min(1, "Away team required"),
  home_score: z.coerce.number().int().nonnegative(),
  away_score: z.coerce.number().int().nonnegative(),
  competition: z.string().min(1, "Competition required"),
  match_date: z.string().min(1, "Match date required"),
  goals: z.array(goalEventSchema).min(1, "At least one goal required"),
});

export type GoalscorerRecallContent = z.infer<typeof goalscorerRecallContentSchema>;
export type GoalEvent = z.infer<typeof goalEventSchema>;

// ============================================================================
// THE GRID (the_grid)
// ============================================================================

export const categoryTypeSchema = z.enum(["club", "nation", "stat", "trophy"]);

export const gridCategorySchema = z.object({
  type: categoryTypeSchema,
  value: z.string().min(1, "Category value required"),
});

export const theGridContentSchema = z.object({
  xAxis: z.tuple([gridCategorySchema, gridCategorySchema, gridCategorySchema]),
  yAxis: z.tuple([gridCategorySchema, gridCategorySchema, gridCategorySchema]),
  valid_answers: z.record(
    z.string().regex(/^[0-8]$/),
    z.array(z.string().min(1))
  ),
});

export type TheGridContent = z.infer<typeof theGridContentSchema>;
export type GridCategory = z.infer<typeof gridCategorySchema>;
export type CategoryType = z.infer<typeof categoryTypeSchema>;

// ============================================================================
// TOPICAL QUIZ (topical_quiz)
// ============================================================================

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1, "Question text required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  options: z.tuple([
    z.string().min(1, "Option A required"),
    z.string().min(1, "Option B required"),
    z.string().min(1, "Option C required"),
    z.string().min(1, "Option D required"),
  ]),
  correctIndex: z.coerce.number().int().min(0).max(3),
});

export const topicalQuizContentSchema = z.object({
  questions: z
    .array(quizQuestionSchema)
    .length(5, "Exactly 5 questions required"),
});

export type TopicalQuizContent = z.infer<typeof topicalQuizContentSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// ============================================================================
// TOP TENS (top_tens)
// ============================================================================

export const topTenAnswerSchema = z.object({
  name: z.string().min(1, "Answer name required"),
  aliases: z.array(z.string()).optional().default([]),
  info: z.string().optional().default(""),
});

export const topTensContentSchema = z.object({
  title: z.string().min(1, "List title required"),
  category: z.string().optional().default(""),
  answers: z.array(topTenAnswerSchema).length(10, "Exactly 10 answers required"),
});

export type TopTensContent = z.infer<typeof topTensContentSchema>;
export type TopTenAnswer = z.infer<typeof topTenAnswerSchema>;

// ============================================================================
// STARTING XI (starting_xi)
// ============================================================================

export const positionKeySchema = z.enum([
  // Goalkeeper
  "GK",
  // Defenders
  "RB", "RCB", "CB", "LCB", "LB", "RWB", "LWB",
  // Defensive Midfield
  "CDM", "RCDM", "LCDM",
  // Central Midfield
  "RCM", "CM", "LCM", "RM", "LM",
  // Attacking Midfield
  "CAM", "RCAM", "LCAM",
  // Forwards
  "RW", "LW", "ST", "RST", "LST", "CF",
]);

export const formationSchema = z.enum([
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "4-4-1-1",
  "3-5-2",
  "3-4-3",
  "5-3-2",
  "5-4-1",
  "4-1-4-1",
  "4-3-2-1",
]);

export const lineupPlayerSchema = z.object({
  position_key: positionKeySchema,
  player_name: z.string().min(1, "Player name required"),
  is_hidden: z.boolean().default(false),
  override_x: z.coerce.number().min(0).max(100).optional().nullable(),
  override_y: z.coerce.number().min(0).max(100).optional().nullable(),
});

export const startingXIContentSchema = z.object({
  match_name: z.string().min(1, "Match name required"),
  competition: z.string().min(1, "Competition required"),
  match_date: z.string().min(1, "Match date required"),
  formation: formationSchema,
  team: z.string().min(1, "Team name required"),
  players: z
    .array(lineupPlayerSchema)
    .length(11, "Exactly 11 players required"),
});

export type StartingXIContent = z.infer<typeof startingXIContentSchema>;
export type LineupPlayer = z.infer<typeof lineupPlayerSchema>;
export type PositionKey = z.infer<typeof positionKeySchema>;
export type FormationName = z.infer<typeof formationSchema>;

// ============================================================================
// CONTENT SCHEMA MAP
// ============================================================================

export const contentSchemaMap = {
  career_path: careerPathContentSchema,
  career_path_pro: careerPathContentSchema,
  the_grid: theGridContentSchema,
  guess_the_transfer: transferGuessContentSchema,
  guess_the_goalscorers: goalscorerRecallContentSchema,
  topical_quiz: topicalQuizContentSchema,
  top_tens: topTensContentSchema,
  starting_xi: startingXIContentSchema,
} as const;

// Union type for all content types
export type PuzzleContent =
  | CareerPathContent
  | TransferGuessContent
  | GoalscorerRecallContent
  | TheGridContent
  | TopicalQuizContent
  | TopTensContent
  | StartingXIContent;

// ============================================================================
// FULL PUZZLE FORM SCHEMA
// ============================================================================

export const puzzleFormSchema = puzzleBaseSchema.extend({
  content: z.unknown(), // Validated separately based on game_mode
});

export type PuzzleFormData = z.infer<typeof puzzleFormSchema>;

// Helper to get the right schema for a game mode
export function getContentSchema(gameMode: keyof typeof contentSchemaMap) {
  return contentSchemaMap[gameMode];
}

// Validate content for a specific game mode
export function validateContent(
  gameMode: keyof typeof contentSchemaMap,
  content: unknown
) {
  const schema = getContentSchema(gameMode);
  return schema.safeParse(content);
}
