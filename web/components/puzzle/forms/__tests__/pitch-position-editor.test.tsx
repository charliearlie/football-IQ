import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithForm, testData } from "@/tests/test-utils";

import { PitchPositionEditor } from "../pitch-position-editor";

const startingXIContent = testData.startingXI.valid;

describe("PitchPositionEditor", () => {
  it("renders the pitch container", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    expect(screen.getByTestId("pitch-editor")).toBeInTheDocument();
  });

  it("renders all 11 player markers", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    for (let i = 0; i < 11; i++) {
      expect(screen.getByTestId(`player-marker-${i}`)).toBeInTheDocument();
    }
  });

  it("shows player surnames on markers", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    expect(screen.getByText("Alisson")).toBeInTheDocument();
    expect(screen.getByText("Salah")).toBeInTheDocument();
    expect(screen.getByText("Nunez")).toBeInTheDocument();
  });

  it("shows position keys in marker circles", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    // Position keys are truncated to 3 chars
    expect(screen.getByText("GK")).toBeInTheDocument();
    expect(screen.getByText("RB")).toBeInTheDocument();
    expect(screen.getByText("ST")).toBeInTheDocument();
  });

  it("shows Pitch Editor heading", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    expect(screen.getByText("Pitch Editor")).toBeInTheDocument();
  });

  it("shows drag instruction text", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    expect(
      screen.getByText(/drag players to adjust positions/i)
    ).toBeInTheDocument();
  });

  it("does not show Reset All button when no overrides exist", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    expect(screen.queryByText("Reset All")).not.toBeInTheDocument();
  });

  it("shows Reset All button when overrides exist", () => {
    const contentWithOverrides = {
      ...startingXIContent,
      players: startingXIContent.players.map((p, i) =>
        i === 0 ? { ...p, override_x: 30, override_y: 50 } : p
      ),
    };

    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: contentWithOverrides,
    });

    expect(screen.getByText("Reset All")).toBeInTheDocument();
  });

  it("positions players at formation default coordinates", () => {
    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: startingXIContent,
    });

    // GK (index 0) should be at x=50, y=90 for 4-3-3
    const gkMarker = screen.getByTestId("player-marker-0");
    expect(gkMarker.style.left).toBe("50%");
    expect(gkMarker.style.top).toBe("90%");
  });

  it("positions players at override coordinates when set", () => {
    const contentWithOverrides = {
      ...startingXIContent,
      players: startingXIContent.players.map((p, i) =>
        i === 0 ? { ...p, override_x: 25, override_y: 75 } : p
      ),
    };

    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: contentWithOverrides,
    });

    const gkMarker = screen.getByTestId("player-marker-0");
    expect(gkMarker.style.left).toBe("25%");
    expect(gkMarker.style.top).toBe("75%");
  });

  it("styles hidden players with dashed border", () => {
    const contentWithHidden = {
      ...startingXIContent,
      players: startingXIContent.players.map((p, i) =>
        i === 0 ? { ...p, is_hidden: true } : p
      ),
    };

    renderWithForm(<PitchPositionEditor />, {
      gameMode: "starting_xi",
      initialContent: contentWithHidden,
    });

    const gkMarker = screen.getByTestId("player-marker-0");
    const circle = gkMarker.querySelector(".rounded-full");
    expect(circle?.className).toContain("border-dashed");
  });
});
