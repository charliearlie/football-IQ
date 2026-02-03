import { describe, it, expect } from "vitest";
import { extractAnswer } from "../admin-utils";

// ============================================================================
// extractAnswer - Pure function tests
// ============================================================================

describe("extractAnswer", () => {
  describe("career_path", () => {
    it("extracts answer and qid from career path content", () => {
      const result = extractAnswer("career_path", {
        answer: "Lionel Messi",
        answer_qid: "Q11571",
        career_steps: [],
      });
      expect(result).toEqual({ text: "Lionel Messi", qid: "Q11571" });
    });

    it("extracts answer without qid", () => {
      const result = extractAnswer("career_path", {
        answer: "Ronaldinho",
        career_steps: [],
      });
      expect(result).toEqual({ text: "Ronaldinho", qid: undefined });
    });
  });

  describe("career_path_pro", () => {
    it("extracts answer and qid from career path pro content", () => {
      const result = extractAnswer("career_path_pro", {
        answer: "Andrea Pirlo",
        answer_qid: "Q7846",
        career_steps: [],
      });
      expect(result).toEqual({ text: "Andrea Pirlo", qid: "Q7846" });
    });
  });

  describe("guess_the_transfer", () => {
    it("extracts answer from transfer guess content", () => {
      const result = extractAnswer("guess_the_transfer", {
        answer: "Neymar",
        from_club: "Barcelona",
        to_club: "PSG",
        fee: "€222m",
        hints: ["2017", "Forward", "🇧🇷"],
      });
      expect(result).toEqual({ text: "Neymar", qid: undefined });
    });

    it("extracts answer_qid when present", () => {
      const result = extractAnswer("guess_the_transfer", {
        answer: "Neymar",
        answer_qid: "Q123",
        from_club: "Barcelona",
        to_club: "PSG",
        fee: "€222m",
        hints: ["2017", "Forward", "🇧🇷"],
      });
      expect(result).toEqual({ text: "Neymar", qid: "Q123" });
    });
  });

  describe("starting_xi", () => {
    it("extracts team and match name", () => {
      const result = extractAnswer("starting_xi", {
        team: "Liverpool",
        match_name: "Liverpool 4-0 Barcelona",
        competition: "Champions League SF",
        match_date: "2019-05-07",
        formation: "4-3-3",
        players: [],
      });
      expect(result).toEqual({
        text: "Liverpool - Liverpool 4-0 Barcelona",
        qid: undefined,
      });
    });
  });

  describe("guess_the_goalscorers", () => {
    it("extracts home and away team names", () => {
      const result = extractAnswer("guess_the_goalscorers", {
        home_team: "Liverpool",
        away_team: "Barcelona",
        home_score: 4,
        away_score: 0,
        competition: "Champions League",
        match_date: "2019-05-07",
        goals: [],
      });
      expect(result).toEqual({
        text: "Liverpool vs Barcelona",
        qid: undefined,
      });
    });
  });

  describe("the_grid", () => {
    it("returns Grid puzzle label", () => {
      const result = extractAnswer("the_grid", {
        xAxis: [],
        yAxis: [],
        valid_answers: {},
      });
      expect(result).toEqual({ text: "Grid Puzzle", qid: undefined });
    });
  });

  describe("topical_quiz", () => {
    it("returns Quiz label", () => {
      const result = extractAnswer("topical_quiz", {
        questions: [],
      });
      expect(result).toEqual({ text: "Quiz", qid: undefined });
    });
  });

  describe("top_tens", () => {
    it("extracts title from top tens content", () => {
      const result = extractAnswer("top_tens", {
        title: "Top 10 Premier League Goalscorers",
        answers: [],
      });
      expect(result).toEqual({
        text: "Top 10 Premier League Goalscorers",
        qid: undefined,
      });
    });
  });

  describe("edge cases", () => {
    it("handles missing answer field gracefully", () => {
      const result = extractAnswer("career_path", {});
      expect(result).toEqual({ text: "Unknown", qid: undefined });
    });

    it("handles null content gracefully", () => {
      const result = extractAnswer("career_path", null as unknown as Record<string, unknown>);
      expect(result).toEqual({ text: "Unknown", qid: undefined });
    });

    it("handles empty string answer", () => {
      const result = extractAnswer("career_path", { answer: "" });
      expect(result).toEqual({ text: "Unknown", qid: undefined });
    });

    it("handles missing team fields for starting_xi", () => {
      const result = extractAnswer("starting_xi", {});
      expect(result).toEqual({ text: "Unknown", qid: undefined });
    });

    it("handles missing team fields for goalscorer recall", () => {
      const result = extractAnswer("guess_the_goalscorers", {});
      expect(result).toEqual({ text: "Unknown", qid: undefined });
    });
  });
});
