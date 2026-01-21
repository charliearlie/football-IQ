import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithForm, testData } from "@/tests/test-utils";

import { CareerPathForm } from "../career-path-form";
import { TransferGuessForm } from "../transfer-guess-form";
import { GoalscorerRecallForm } from "../goalscorer-recall-form";
import { TheGridForm } from "../the-grid-form";
import { TopicalQuizForm } from "../topical-quiz-form";
import { TopTensForm } from "../top-tens-form";
import { StartingXIForm } from "../starting-xi-form";

// ============================================================================
// CAREER PATH FORM
// ============================================================================

describe("CareerPathForm", () => {
  it("renders player name input", () => {
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });
    expect(screen.getByPlaceholderText(/zlatan ibrahimovic/i)).toBeInTheDocument();
  });

  it("renders career steps section", () => {
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });
    expect(screen.getByText(/career steps/i)).toBeInTheDocument();
  });

  it("shows 3 initial career steps by default", () => {
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });
    expect(screen.getAllByText(/step \d+/i)).toHaveLength(3);
  });

  it("shows Add Step button", () => {
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });
    expect(screen.getByRole("button", { name: /add step/i })).toBeInTheDocument();
  });

  it("adds a new career step when Add Step is clicked", async () => {
    const user = userEvent.setup();
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });

    await user.click(screen.getByRole("button", { name: /add step/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/step \d+/i)).toHaveLength(4);
    });
  });

  it("has disabled delete buttons when only 3 steps exist", () => {
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });
    const deleteButtons = screen.getAllByRole("button").filter(btn =>
      btn.querySelector("svg.lucide-trash2")
    );
    deleteButtons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it("enables delete after adding 4th step", async () => {
    const user = userEvent.setup();
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });

    await user.click(screen.getByRole("button", { name: /add step/i }));

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole("button").filter(btn =>
        btn.querySelector("svg.lucide-trash2")
      );
      expect(deleteButtons.some(btn => !btn.hasAttribute("disabled"))).toBe(true);
    });
  });

  it("removes a career step when delete is clicked", async () => {
    const user = userEvent.setup();
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });

    // First add a step so we can delete one
    await user.click(screen.getByRole("button", { name: /add step/i }));
    await waitFor(() => expect(screen.getAllByText(/step \d+/i)).toHaveLength(4));

    // Now click delete on the first enabled one
    const deleteButtons = screen.getAllByRole("button").filter(btn =>
      btn.querySelector("svg.lucide-trash2") && !btn.hasAttribute("disabled")
    );
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/step \d+/i)).toHaveLength(3);
    });
  });

  it("renders with initial content", () => {
    renderWithForm(<CareerPathForm />, {
      gameMode: "career_path",
      initialContent: testData.careerPath.valid,
    });
    expect(screen.getByDisplayValue("Cristiano Ronaldo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sporting CP")).toBeInTheDocument();
  });

  it("shows club/loan type selector for each step", () => {
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });
    const typeLabels = screen.getAllByText(/^type$/i);
    expect(typeLabels.length).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// TRANSFER GUESS FORM
// ============================================================================

describe("TransferGuessForm", () => {
  it("renders all required fields", () => {
    renderWithForm(<TransferGuessForm />, { gameMode: "guess_the_transfer" });

    expect(screen.getByPlaceholderText(/eden hazard/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/chelsea/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/real madrid/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/€100M/i)).toBeInTheDocument();
  });

  it("renders hint fields", () => {
    renderWithForm(<TransferGuessForm />, { gameMode: "guess_the_transfer" });

    expect(screen.getByPlaceholderText(/belgian/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ATT, MID/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ballon d'or/i)).toBeInTheDocument();
  });

  it("renders with initial content", () => {
    renderWithForm(<TransferGuessForm />, {
      gameMode: "guess_the_transfer",
      initialContent: testData.transferGuess.valid,
    });

    expect(screen.getByDisplayValue("Neymar")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Barcelona")).toBeInTheDocument();
    expect(screen.getByDisplayValue("PSG")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2017")).toBeInTheDocument();
  });

  it("allows year input", async () => {
    const user = userEvent.setup();
    renderWithForm(<TransferGuessForm />, { gameMode: "guess_the_transfer" });

    const yearInput = screen.getByLabelText(/transfer year/i);
    await user.clear(yearInput);
    await user.type(yearInput, "2023");

    expect(screen.getByDisplayValue("2023")).toBeInTheDocument();
  });
});

// ============================================================================
// GOALSCORER RECALL FORM
// ============================================================================

describe("GoalscorerRecallForm", () => {
  it("renders match info fields", () => {
    renderWithForm(<GoalscorerRecallForm />, { gameMode: "guess_the_goalscorers" });

    expect(screen.getByPlaceholderText(/liverpool/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/barcelona/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/champions league/i)).toBeInTheDocument();
  });

  it("renders score inputs", () => {
    renderWithForm(<GoalscorerRecallForm />, { gameMode: "guess_the_goalscorers" });

    const scoreLabels = screen.getAllByText(/score/i);
    expect(scoreLabels.length).toBeGreaterThanOrEqual(2);
  });

  it("renders goals section", () => {
    renderWithForm(<GoalscorerRecallForm />, { gameMode: "guess_the_goalscorers" });

    expect(screen.getByText(/goals/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add goal/i })).toBeInTheDocument();
  });

  it("renders one initial goal entry", () => {
    renderWithForm(<GoalscorerRecallForm />, { gameMode: "guess_the_goalscorers" });

    const scorerInputs = screen.getAllByPlaceholderText(/mohamed salah/i);
    expect(scorerInputs).toHaveLength(1);
  });

  it("adds goal when Add Goal is clicked", async () => {
    const user = userEvent.setup();
    renderWithForm(<GoalscorerRecallForm />, { gameMode: "guess_the_goalscorers" });

    await user.click(screen.getByRole("button", { name: /add goal/i }));

    await waitFor(() => {
      const scorerInputs = screen.getAllByPlaceholderText(/mohamed salah/i);
      expect(scorerInputs).toHaveLength(2);
    });
  });

  it("renders own goal toggle", () => {
    renderWithForm(<GoalscorerRecallForm />, { gameMode: "guess_the_goalscorers" });
    expect(screen.getByText(/own goal/i)).toBeInTheDocument();
  });
});

// ============================================================================
// THE GRID FORM
// ============================================================================

describe("TheGridForm", () => {
  it("renders x-axis categories", () => {
    renderWithForm(<TheGridForm />, { gameMode: "the_grid" });
    expect(screen.getByText(/column headers.*x-axis/i)).toBeInTheDocument();
  });

  it("renders y-axis categories", () => {
    renderWithForm(<TheGridForm />, { gameMode: "the_grid" });
    expect(screen.getByText(/row headers.*y-axis/i)).toBeInTheDocument();
  });

  it("renders category type selectors", () => {
    renderWithForm(<TheGridForm />, { gameMode: "the_grid" });
    // Should have 6 type selectors (3 x-axis + 3 y-axis)
    const typeLabels = screen.getAllByText(/^type$/i);
    expect(typeLabels).toHaveLength(6);
  });

  it("renders valid answers section", () => {
    renderWithForm(<TheGridForm />, { gameMode: "the_grid" });
    expect(screen.getByText(/valid answers/i)).toBeInTheDocument();
  });

  it("renders 9 cell answer areas", () => {
    renderWithForm(<TheGridForm />, { gameMode: "the_grid" });
    // Each cell has a Cell badge like "Cell 0 (R1C1)"
    const cellBadges = screen.getAllByText(/^cell \d/i);
    expect(cellBadges).toHaveLength(9);
  });
});

// ============================================================================
// TOPICAL QUIZ FORM
// ============================================================================

describe("TopicalQuizForm", () => {
  it("renders 5 question cards", () => {
    renderWithForm(<TopicalQuizForm />, { gameMode: "topical_quiz" });

    const questionBadges = screen.getAllByText(/^q[1-5]$/i);
    expect(questionBadges).toHaveLength(5);
  });

  it("renders question text areas", () => {
    renderWithForm(<TopicalQuizForm />, { gameMode: "topical_quiz" });

    const questionInputs = screen.getAllByPlaceholderText(/enter the question text/i);
    expect(questionInputs).toHaveLength(5);
  });

  it("renders 4 option inputs per question", () => {
    renderWithForm(<TopicalQuizForm />, { gameMode: "topical_quiz" });

    // Each question has 4 option labels (A, B, C, D)
    const optionALabels = screen.getAllByText(/option a/i);
    expect(optionALabels).toHaveLength(5); // One per question
  });

  it("renders correct answer selector for each question", () => {
    renderWithForm(<TopicalQuizForm />, { gameMode: "topical_quiz" });

    const correctLabels = screen.getAllByText(/correct answer/i);
    expect(correctLabels).toHaveLength(5);
  });

  it("renders optional image URL fields", () => {
    renderWithForm(<TopicalQuizForm />, { gameMode: "topical_quiz" });

    const imageLabels = screen.getAllByText(/image url/i);
    expect(imageLabels).toHaveLength(5);
  });
});

// ============================================================================
// TOP TENS FORM
// ============================================================================

describe("TopTensForm", () => {
  it("renders title input", () => {
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    expect(screen.getByPlaceholderText(/premier league all-time goalscorers/i)).toBeInTheDocument();
  });

  it("renders category input", () => {
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    expect(screen.getByPlaceholderText(/premier league, world cup/i)).toBeInTheDocument();
  });

  it("renders all 10 answer slots", () => {
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    // Check for rank badges #1 through #10
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(`#${i}`)).toBeInTheDocument();
    }
  });

  it("highlights #10 as jackpot", () => {
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    expect(screen.getByText(/jackpot/i)).toBeInTheDocument();
  });

  it("renders name and info inputs for each answer", () => {
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    // Should have placeholder "Alan Shearer" for name fields
    const nameInputs = screen.getAllByPlaceholderText(/alan shearer/i);
    expect(nameInputs).toHaveLength(10);
  });

  it("shows Add Alias buttons for each answer", () => {
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    const addAliasButtons = screen.getAllByRole("button", { name: /add alias/i });
    expect(addAliasButtons).toHaveLength(10);
  });

  it("adds alias when Add Alias is clicked", async () => {
    const user = userEvent.setup();
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    // Click first Add Alias button
    const addAliasButtons = screen.getAllByRole("button", { name: /add alias/i });
    await user.click(addAliasButtons[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/^alias$/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// STARTING XI FORM
// ============================================================================

describe("StartingXIForm", () => {
  it("renders match info fields", () => {
    renderWithForm(<StartingXIForm />, { gameMode: "starting_xi" });

    expect(screen.getByPlaceholderText(/liverpool 4-0 barcelona/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/champions league sf/i)).toBeInTheDocument();
  });

  it("renders formation selector", () => {
    renderWithForm(<StartingXIForm />, { gameMode: "starting_xi" });

    // Use exact match for the label text to avoid matching the section header
    expect(screen.getByLabelText("Formation")).toBeInTheDocument();
  });

  it("renders team name input", () => {
    renderWithForm(<StartingXIForm />, { gameMode: "starting_xi" });

    // The placeholder is "e.g., Liverpool" - use exact match to avoid matching "e.g., Liverpool 4-0 Barcelona"
    expect(screen.getByPlaceholderText("e.g., Liverpool")).toBeInTheDocument();
  });

  it("renders 11 player inputs", () => {
    renderWithForm(<StartingXIForm />, { gameMode: "starting_xi" });

    const playerNameInputs = screen.getAllByPlaceholderText(/^player name$/i);
    expect(playerNameInputs).toHaveLength(11);
  });

  it("shows position labels for each player", () => {
    renderWithForm(<StartingXIForm />, { gameMode: "starting_xi" });

    // Default 4-3-3 positions
    expect(screen.getByText("GK")).toBeInTheDocument();
    expect(screen.getByText("RB")).toBeInTheDocument();
    expect(screen.getByText("ST")).toBeInTheDocument();
  });

  it("renders hidden toggle for each player", () => {
    renderWithForm(<StartingXIForm />, { gameMode: "starting_xi" });

    const hiddenLabels = screen.getAllByText(/^hidden$/i);
    expect(hiddenLabels).toHaveLength(11);
  });

  it("renders with initial content", () => {
    renderWithForm(<StartingXIForm />, {
      gameMode: "starting_xi",
      initialContent: testData.startingXI.valid,
    });

    expect(screen.getByDisplayValue("Liverpool vs Man City")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Liverpool")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alisson")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Salah")).toBeInTheDocument();
  });
});

// ============================================================================
// FORM INPUT BEHAVIOR
// ============================================================================

describe("Form input behavior", () => {
  it("allows typing in career path answer", async () => {
    const user = userEvent.setup();
    renderWithForm(<CareerPathForm />, { gameMode: "career_path" });

    const answerInput = screen.getByPlaceholderText(/zlatan ibrahimovic/i);
    await user.type(answerInput, "Lionel Messi");

    expect(screen.getByDisplayValue("Lionel Messi")).toBeInTheDocument();
  });

  it("allows typing in quiz question", async () => {
    const user = userEvent.setup();
    renderWithForm(<TopicalQuizForm />, { gameMode: "topical_quiz" });

    const questionInputs = screen.getAllByPlaceholderText(/enter the question text/i);
    await user.type(questionInputs[0], "Who won the 2022 World Cup?");

    expect(screen.getByDisplayValue("Who won the 2022 World Cup?")).toBeInTheDocument();
  });

  it("allows typing in top tens title", async () => {
    const user = userEvent.setup();
    renderWithForm(<TopTensForm />, { gameMode: "top_tens" });

    const titleInput = screen.getByPlaceholderText(/premier league all-time goalscorers/i);
    await user.type(titleInput, "Top 10 World Cup Winners");

    expect(screen.getByDisplayValue("Top 10 World Cup Winners")).toBeInTheDocument();
  });
});
