import { describe, it, expect } from "vitest";
import { generateFeedback } from "../feedback";

const ANSWER = {
  player_name: "Mohamed Salah",
  player_id: "Q346551",
  club: "Liverpool",
  league: "Premier League",
  nationality: "Egypt",
  position: "Right Winger",
  birth_year: 1992,
};

describe("generateFeedback", () => {
  it("returns all-green for the exact correct player", () => {
    const fb = generateFeedback(
      {
        playerName: "Mohamed Salah",
        club: "Liverpool",
        league: "Premier League",
        nationality: "Egypt",
        position: "Right Winger",
        birthYear: 1992,
      },
      ANSWER
    );
    expect(fb.club.color).toBe("green");
    expect(fb.league.color).toBe("green");
    expect(fb.nationality.color).toBe("green");
    expect(fb.position.color).toBe("green");
    expect(fb.birthYear.color).toBe("green");
  });

  it("returns red on wrong club and wrong league", () => {
    const fb = generateFeedback(
      {
        playerName: "Lionel Messi",
        club: "Inter Miami",
        league: "Major League Soccer",
        nationality: "Argentina",
        position: "Right Winger",
        birthYear: 1987,
      },
      ANSWER
    );
    expect(fb.club.color).toBe("red");
    expect(fb.league.color).toBe("red");
  });

  it("returns yellow on same continent nationality, red otherwise", () => {
    // Same continent (Africa): Senegal vs Egypt = yellow
    const sameContinent = generateFeedback(
      { playerName: "Sadio Mane", club: "Al-Nassr", league: "Saudi Pro League",
        nationality: "Senegal", position: "Left Winger", birthYear: 1992 },
      ANSWER
    );
    expect(sameContinent.nationality.color).toBe("yellow");

    // Different continent (Europe vs Africa): Spain vs Egypt = red
    const diff = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Spain", position: "Right Winger", birthYear: 1992 },
      ANSWER
    );
    expect(diff.nationality.color).toBe("red");
  });

  it("returns yellow on same position category, red otherwise", () => {
    // Same category (Forward): Striker vs Right Winger = yellow
    const sameCategory = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Striker", birthYear: 1992 },
      ANSWER
    );
    expect(sameCategory.position.color).toBe("yellow");

    // Different category (Defender vs Forward) = red
    const diff = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Centre-Back", birthYear: 1992 },
      ANSWER
    );
    expect(diff.position.color).toBe("red");
  });

  it("returns yellow on birthYear within ±2 with direction arrow, red otherwise", () => {
    const close = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Right Winger", birthYear: 1990 },
      ANSWER
    );
    expect(close.birthYear.color).toBe("yellow");
    expect(close.birthYear.direction).toBe("up"); // 1990 < 1992 → arrow points up (older guess, need younger)

    const far = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "Egypt", position: "Right Winger", birthYear: 1980 },
      ANSWER
    );
    expect(far.birthYear.color).toBe("red");
    expect(far.birthYear.direction).toBe("up");
  });

  it("strips F.C. / A.F.C. suffix from club display value", () => {
    const fb = generateFeedback(
      {
        playerName: "X",
        club: "Arsenal F.C.",
        league: "Premier League",
        nationality: "Egypt",
        position: "Right Winger",
        birthYear: 1992,
      },
      { ...ANSWER, club: "Arsenal" }
    );
    expect(fb.club.value).toBe("Arsenal");
    expect(fb.club.color).toBe("green");
  });

  it("maps ISO nationality codes via nationalityCodeToName", () => {
    const fb = generateFeedback(
      { playerName: "X", club: "X", league: "X",
        nationality: "EG", position: "Right Winger", birthYear: 1992 },
      ANSWER
    );
    expect(fb.nationality.value).toBe("Egypt");
    expect(fb.nationality.color).toBe("green");
  });
});
