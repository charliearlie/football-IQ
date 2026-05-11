import { describe, it, expect } from "vitest";
import { formatStatValue } from "../formatStatValue";

describe("formatStatValue", () => {
  it("formats transfer fees with euro and millions suffix", () => {
    expect(formatStatValue(105, "transfer_fee")).toBe("€105m");
    expect(formatStatValue(222, "transfer_fee")).toBe("€222m");
  });

  it("formats integers with locale separators for non-transfer stats", () => {
    expect(formatStatValue(1234, "goals")).toBe("1,234");
    expect(formatStatValue(500, "league_appearances")).toBe("500");
    expect(formatStatValue(1234567, "league_appearances")).toBe("1,234,567");
  });

  it("handles zero", () => {
    expect(formatStatValue(0, "transfer_fee")).toBe("€0m");
    expect(formatStatValue(0, "goals")).toBe("0");
  });
});
