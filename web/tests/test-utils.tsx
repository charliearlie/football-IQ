import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { FormProvider, useForm, UseFormProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contentSchemaMap } from "@/lib/schemas/puzzle-schemas";
import { getDefaultContent } from "@/lib/schemas/puzzle-defaults";
import type { GameMode } from "@/lib/constants";

// ============================================================================
// FORM WRAPPER FOR TESTING
// ============================================================================

interface FormWrapperProps<T extends Record<string, unknown>> {
  children: React.ReactNode;
  defaultValues: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: z.ZodSchema<any>;
  formOptions?: Partial<UseFormProps<T>>;
}

function FormWrapper<T extends Record<string, unknown>>({
  children,
  defaultValues,
  schema,
  formOptions = {},
}: FormWrapperProps<T>) {
  const methods = useForm<T>({
    defaultValues: defaultValues as UseFormProps<T>["defaultValues"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: schema ? zodResolver(schema as any) : undefined,
    mode: "onChange",
    ...formOptions,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

// ============================================================================
// PUZZLE FORM WRAPPER
// ============================================================================

interface PuzzleFormWrapperProps {
  children: React.ReactNode;
  gameMode: GameMode;
  initialContent?: unknown;
}

export function PuzzleFormWrapper({
  children,
  gameMode,
  initialContent,
}: PuzzleFormWrapperProps) {
  const contentSchema = contentSchemaMap[gameMode];
  const formSchema = z.object({
    content: contentSchema,
    difficulty: z.string().nullable(),
    status: z.enum(["draft", "live", "archived"]),
  });

  const defaultValues = {
    content: initialContent || getDefaultContent(gameMode),
    difficulty: null,
    status: "draft" as const,
  };

  return (
    <FormWrapper defaultValues={defaultValues} schema={formSchema}>
      {children}
    </FormWrapper>
  );
}

// ============================================================================
// CUSTOM RENDER WITH PROVIDERS
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  gameMode?: GameMode;
  initialContent?: unknown;
}

export function renderWithForm(
  ui: ReactElement,
  { gameMode = "career_path", initialContent, ...options }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PuzzleFormWrapper gameMode={gameMode} initialContent={initialContent}>
        {children}
      </PuzzleFormWrapper>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

export const testData = {
  careerPath: {
    valid: {
      answer: "Cristiano Ronaldo",
      career_steps: [
        { type: "club" as const, text: "Sporting CP", year: "2002-2003", apps: 25, goals: 3 },
        { type: "club" as const, text: "Manchester United", year: "2003-2009", apps: 196, goals: 84 },
        { type: "club" as const, text: "Real Madrid", year: "2009-2018", apps: 292, goals: 311 },
      ],
    },
  },

  transferGuess: {
    valid: {
      answer: "Neymar",
      from_club: "Barcelona",
      to_club: "PSG",
      year: 2017,
      fee: "€222m",
      hints: ["Brazilian", "Forward", "Won La Liga"],
    },
  },

  goalscorerRecall: {
    valid: {
      home_team: "Liverpool",
      away_team: "Manchester City",
      home_score: 2,
      away_score: 2,
      competition: "Premier League",
      match_date: "2024-01-15",
      goals: [
        { scorer: "Salah", minute: 25, team: "home" as const, isOwnGoal: false },
        { scorer: "Haaland", minute: 40, team: "away" as const, isOwnGoal: false },
      ],
    },
  },

  theGrid: {
    valid: {
      xAxis: [
        { type: "club" as const, value: "Man Utd" },
        { type: "club" as const, value: "Chelsea" },
        { type: "club" as const, value: "Arsenal" },
      ],
      yAxis: [
        { type: "nation" as const, value: "England" },
        { type: "nation" as const, value: "France" },
        { type: "nation" as const, value: "Brazil" },
      ],
      valid_answers: {
        "0": ["Rooney"],
        "1": ["Terry"],
        "2": ["Henry"],
        "3": ["Cantona"],
        "4": ["Hazard"],
        "5": ["Pires"],
        "6": ["Anderson"],
        "7": ["Willian"],
        "8": ["Edu"],
      },
    },
  },

  topicalQuiz: {
    valid: {
      questions: [
        { id: "q1", question: "Question 1?", options: ["A", "B", "C", "D"], correctIndex: 0, imageUrl: "" },
        { id: "q2", question: "Question 2?", options: ["A", "B", "C", "D"], correctIndex: 1, imageUrl: "" },
        { id: "q3", question: "Question 3?", options: ["A", "B", "C", "D"], correctIndex: 2, imageUrl: "" },
        { id: "q4", question: "Question 4?", options: ["A", "B", "C", "D"], correctIndex: 3, imageUrl: "" },
        { id: "q5", question: "Question 5?", options: ["A", "B", "C", "D"], correctIndex: 0, imageUrl: "" },
      ],
    },
  },

  topTens: {
    valid: {
      title: "Top 10 Goalscorers",
      category: "Premier League",
      answers: Array.from({ length: 10 }, (_, i) => ({
        name: `Player ${i + 1}`,
        aliases: [],
        info: `${100 - i * 10} goals`,
      })),
    },
  },

  startingXI: {
    valid: {
      match_name: "Liverpool vs Man City",
      competition: "Premier League",
      match_date: "2024-01-15",
      formation: "4-3-3" as const,
      team: "Liverpool",
      players: [
        { position_key: "GK" as const, player_name: "Alisson", is_hidden: false, override_x: null, override_y: null },
        { position_key: "RB" as const, player_name: "Alexander-Arnold", is_hidden: false, override_x: null, override_y: null },
        { position_key: "RCB" as const, player_name: "Konate", is_hidden: false, override_x: null, override_y: null },
        { position_key: "LCB" as const, player_name: "Van Dijk", is_hidden: false, override_x: null, override_y: null },
        { position_key: "LB" as const, player_name: "Robertson", is_hidden: false, override_x: null, override_y: null },
        { position_key: "RCM" as const, player_name: "Szoboszlai", is_hidden: false, override_x: null, override_y: null },
        { position_key: "CM" as const, player_name: "Mac Allister", is_hidden: false, override_x: null, override_y: null },
        { position_key: "LCM" as const, player_name: "Gravenberch", is_hidden: false, override_x: null, override_y: null },
        { position_key: "RW" as const, player_name: "Salah", is_hidden: false, override_x: null, override_y: null },
        { position_key: "ST" as const, player_name: "Nunez", is_hidden: false, override_x: null, override_y: null },
        { position_key: "LW" as const, player_name: "Diaz", is_hidden: false, override_x: null, override_y: null },
      ],
    },
  },
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
