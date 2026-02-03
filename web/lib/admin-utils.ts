import type { GameMode } from "@/lib/constants";

interface ExtractedAnswer {
  text: string;
  qid: string | undefined;
}

/**
 * Extract a display-friendly answer and optional QID from puzzle content,
 * based on game mode. Each mode stores its "answer" in different fields.
 */
export function extractAnswer(
  gameMode: GameMode | string,
  content: Record<string, unknown> | null
): ExtractedAnswer {
  if (!content) {
    return { text: "Unknown", qid: undefined };
  }

  switch (gameMode) {
    case "career_path":
    case "career_path_pro": {
      const answer = content.answer as string | undefined;
      const qid = content.answer_qid as string | undefined;
      return {
        text: answer || "Unknown",
        qid: qid || undefined,
      };
    }

    case "guess_the_transfer": {
      const answer = content.answer as string | undefined;
      const qid = content.answer_qid as string | undefined;
      return {
        text: answer || "Unknown",
        qid: qid || undefined,
      };
    }

    case "starting_xi": {
      const team = content.team as string | undefined;
      const matchName = content.match_name as string | undefined;
      if (!team && !matchName) {
        return { text: "Unknown", qid: undefined };
      }
      return {
        text: `${team} - ${matchName}`,
        qid: undefined,
      };
    }

    case "guess_the_goalscorers": {
      const home = content.home_team as string | undefined;
      const away = content.away_team as string | undefined;
      if (!home && !away) {
        return { text: "Unknown", qid: undefined };
      }
      return {
        text: `${home} vs ${away}`,
        qid: undefined,
      };
    }

    case "the_grid": {
      return { text: "Grid Puzzle", qid: undefined };
    }

    case "topical_quiz": {
      return { text: "Quiz", qid: undefined };
    }

    case "top_tens": {
      const title = content.title as string | undefined;
      return {
        text: title || "Unknown",
        qid: undefined,
      };
    }

    default:
      return { text: "Unknown", qid: undefined };
  }
}
