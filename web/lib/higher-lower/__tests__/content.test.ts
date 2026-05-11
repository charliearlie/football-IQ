// web/lib/higher-lower/__tests__/content.test.ts
import { describe, it, expect } from "vitest";
import { parseHigherLowerContent } from "../content";

describe("parseHigherLowerContent", () => {
  it("normalises a chain of new-format entries into pairs", () => {
    const content = {
      players: [
        { name: "A", context: "X", statLabel: "Goals", statType: "goals", value: 30 },
        { name: "B", context: "Y", statLabel: "Goals", statType: "goals", value: 25 },
        { name: "C", context: "Z", statLabel: "Goals", statType: "goals", value: 22 },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs).toHaveLength(2);
    expect(parsed!.pairs[0].player1.name).toBe("A");
    expect(parsed!.pairs[0].player2.name).toBe("B");
    expect(parsed!.pairs[1].player1.name).toBe("B");
    expect(parsed!.pairs[1].player2.name).toBe("C");
  });

  it("accepts legacy entries (club/fee) and normalises to new shape with transfer_fee statType", () => {
    const content = {
      players: [
        { name: "A", club: "Barcelona", fee: 222 },
        { name: "B", club: "PSG", fee: 180 },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs[0].player1).toEqual({
      name: "A",
      context: "Barcelona",
      statLabel: "Transfer Fee",
      statType: "transfer_fee",
      value: 222,
    });
    expect(parsed!.pairs[0].player2.value).toBe(180);
  });

  it("accepts explicit pairs format and preserves order", () => {
    const content = {
      pairs: [
        {
          player1: { name: "A", context: "X", statLabel: "Caps", statType: "international_caps", value: 100 },
          player2: { name: "B", context: "Y", statLabel: "Caps", statType: "international_caps", value: 80 },
        },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs).toHaveLength(1);
    expect(parsed!.pairs[0].player1.name).toBe("A");
  });

  it("falls back to 'transfer_fee' for unknown statType strings", () => {
    const content = {
      players: [
        { name: "A", context: "X", statLabel: "Mystery", statType: "not_a_real_stat", value: 10 },
        { name: "B", context: "Y", statLabel: "Mystery", statType: "not_a_real_stat", value: 20 },
      ],
    };
    const parsed = parseHigherLowerContent(content);
    expect(parsed).not.toBeNull();
    expect(parsed!.pairs[0].player1.statType).toBe("transfer_fee");
  });

  it("returns null for malformed input", () => {
    expect(parseHigherLowerContent(null)).toBeNull();
    expect(parseHigherLowerContent({})).toBeNull();
    expect(parseHigherLowerContent({ players: [] })).toBeNull();
    expect(parseHigherLowerContent({ players: [{ name: "A" }] })).toBeNull();
    expect(parseHigherLowerContent({ pairs: [] })).toBeNull();
  });
});
