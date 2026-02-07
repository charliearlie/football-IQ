import { describe, it, expect } from "vitest";
import {
  threadTypeSchema,
  threadBrandSchema,
  kitLoreSchema,
  theThreadContentSchema,
  contentSchemaMap,
  getContentSchema,
  validateContent,
} from "../puzzle-schemas";
import { GAME_MODES } from "@/lib/constants";

// ============================================================================
// THE THREAD SCHEMA TESTS
// ============================================================================

describe("threadTypeSchema", () => {
  it("accepts 'sponsor' type", () => {
    expect(() => threadTypeSchema.parse("sponsor")).not.toThrow();
  });

  it("accepts 'supplier' type", () => {
    expect(() => threadTypeSchema.parse("supplier")).not.toThrow();
  });

  it("rejects invalid thread type", () => {
    const result = threadTypeSchema.safeParse("manufacturer");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = threadTypeSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = threadTypeSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

describe("threadBrandSchema", () => {
  it("validates correct brand entry with completed year range", () => {
    const valid = { brand_name: "Nike", years: "2010-2020" };
    expect(() => threadBrandSchema.parse(valid)).not.toThrow();
  });

  it("validates brand entry with ongoing year range", () => {
    const valid = { brand_name: "Adidas", years: "2020-" };
    expect(() => threadBrandSchema.parse(valid)).not.toThrow();
  });

  it("validates historical year ranges", () => {
    const valid = { brand_name: "Umbro", years: "1899-1920" };
    expect(() => threadBrandSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty brand name", () => {
    const invalid = { brand_name: "", years: "2010-2020" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Brand name required");
    }
  });

  it("rejects empty years", () => {
    const invalid = { brand_name: "Nike", years: "" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid year format - single year only", () => {
    const invalid = { brand_name: "Nike", years: "2020" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("YYYY-YYYY or YYYY-");
    }
  });

  it("rejects invalid year format - wrong separator", () => {
    const invalid = { brand_name: "Nike", years: "2010/2020" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid year format - text description", () => {
    const invalid = { brand_name: "Nike", years: "early-2000s" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid year format - three-digit year", () => {
    const invalid = { brand_name: "Nike", years: "999-2000" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid year format - spaces", () => {
    const invalid = { brand_name: "Nike", years: "2010 - 2020" };
    const result = threadBrandSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("kitLoreSchema", () => {
  it("validates correct kit lore with fun fact", () => {
    const valid = {
      fun_fact: "This club was the first to have a sponsor on their shirt in 1979.",
    };
    expect(() => kitLoreSchema.parse(valid)).not.toThrow();
  });

  it("rejects empty fun_fact", () => {
    const invalid = { fun_fact: "" };
    const result = kitLoreSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Fun fact required");
    }
  });

  it("rejects missing fun_fact field", () => {
    const invalid = {};
    const result = kitLoreSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("theThreadContentSchema", () => {
  const createBrand = (name: string, years: string) => ({
    brand_name: name,
    years,
  });

  const validContent = {
    thread_type: "sponsor",
    path: [
      createBrand("Sharp", "1982-2000"),
      createBrand("Vodafone", "2000-2006"),
      createBrand("AIG", "2006-2010"),
    ],
    correct_club_id: "Q18656",
    correct_club_name: "Manchester United",
    kit_lore: {
      fun_fact: "Manchester United were pioneers in shirt sponsorship deals.",
    },
  };

  it("validates correct sponsor content", () => {
    expect(() => theThreadContentSchema.parse(validContent)).not.toThrow();
  });

  it("validates correct supplier content", () => {
    const supplierContent = {
      ...validContent,
      thread_type: "supplier",
      path: [
        createBrand("Adidas", "1980-1992"),
        createBrand("Umbro", "1992-2002"),
        createBrand("Nike", "2002-"),
      ],
    };
    expect(() => theThreadContentSchema.parse(supplierContent)).not.toThrow();
  });

  it("rejects path with fewer than 3 brands", () => {
    const invalid = {
      ...validContent,
      path: [createBrand("Nike", "2010-2020"), createBrand("Adidas", "2020-")],
    };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 3");
    }
  });

  it("rejects path with 1 brand", () => {
    const invalid = {
      ...validContent,
      path: [createBrand("Nike", "2010-2020")],
    };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty path", () => {
    const invalid = { ...validContent, path: [] };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects missing thread_type", () => {
    const { thread_type, ...withoutType } = validContent;
    const result = theThreadContentSchema.safeParse(withoutType);
    expect(result.success).toBe(false);
  });

  it("rejects invalid thread_type", () => {
    const invalid = { ...validContent, thread_type: "kit_maker" };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty correct_club_id", () => {
    const invalid = { ...validContent, correct_club_id: "" };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Club ID required");
    }
  });

  it("rejects empty correct_club_name", () => {
    const invalid = { ...validContent, correct_club_name: "" };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Club name required");
    }
  });

  it("rejects missing kit_lore", () => {
    const { kit_lore, ...withoutLore } = validContent;
    const result = theThreadContentSchema.safeParse(withoutLore);
    expect(result.success).toBe(false);
  });

  it("rejects kit_lore with empty fun_fact", () => {
    const invalid = { ...validContent, kit_lore: { fun_fact: "" } };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts path with many brands (long history)", () => {
    const longPath = {
      ...validContent,
      path: [
        createBrand("Brand 1", "1970-1980"),
        createBrand("Brand 2", "1980-1990"),
        createBrand("Brand 3", "1990-2000"),
        createBrand("Brand 4", "2000-2010"),
        createBrand("Brand 5", "2010-2020"),
        createBrand("Brand 6", "2020-"),
      ],
    };
    expect(() => theThreadContentSchema.parse(longPath)).not.toThrow();
  });

  it("validates mixed year format variations in path", () => {
    const content = {
      ...validContent,
      path: [
        createBrand("Historic Brand", "1899-1920"),
        createBrand("Mid Brand", "1920-1950"),
        createBrand("Current Brand", "2023-"),
      ],
    };
    expect(() => theThreadContentSchema.parse(content)).not.toThrow();
  });

  it("rejects path with invalid brand entry", () => {
    const invalid = {
      ...validContent,
      path: [
        createBrand("Nike", "2010-2020"),
        createBrand("", "2020-2025"), // Empty brand name
        createBrand("Puma", "2025-"),
      ],
    };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects path with invalid year format in one entry", () => {
    const invalid = {
      ...validContent,
      path: [
        createBrand("Nike", "2010-2020"),
        createBrand("Adidas", "invalid"),
        createBrand("Puma", "2025-"),
      ],
    };
    const result = theThreadContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// INTEGRATION WITH CONTENT SCHEMA MAP
// ============================================================================

describe("contentSchemaMap - the_thread integration", () => {
  it("has entry for the_thread in GAME_MODES", () => {
    expect(GAME_MODES).toContain("the_thread");
  });

  it("has the_thread in contentSchemaMap", () => {
    expect(contentSchemaMap).toHaveProperty("the_thread");
    expect(contentSchemaMap.the_thread).toBe(theThreadContentSchema);
  });
});

describe("getContentSchema - the_thread", () => {
  it("returns theThreadContentSchema for the_thread mode", () => {
    expect(getContentSchema("the_thread")).toBe(theThreadContentSchema);
  });
});

describe("validateContent - the_thread", () => {
  const validThreadContent = {
    thread_type: "sponsor",
    path: [
      { brand_name: "A", years: "2000-2005" },
      { brand_name: "B", years: "2005-2010" },
      { brand_name: "C", years: "2010-" },
    ],
    correct_club_id: "Q123",
    correct_club_name: "Test Club",
    kit_lore: { fun_fact: "A fun fact about the club's kit history." },
  };

  it("validates correct the_thread content", () => {
    const result = validateContent("the_thread", validThreadContent);
    expect(result.success).toBe(true);
  });

  it("returns error for invalid the_thread content - too few brands", () => {
    const invalidContent = {
      ...validThreadContent,
      path: [{ brand_name: "Only One", years: "2020-" }],
    };
    const result = validateContent("the_thread", invalidContent);
    expect(result.success).toBe(false);
  });

  it("returns error for invalid the_thread content - missing required fields", () => {
    const invalidContent = {
      thread_type: "sponsor",
      path: [
        { brand_name: "A", years: "2000-2005" },
        { brand_name: "B", years: "2005-2010" },
        { brand_name: "C", years: "2010-" },
      ],
      correct_club_id: "",
      correct_club_name: "",
      kit_lore: { fun_fact: "" },
    };
    const result = validateContent("the_thread", invalidContent);
    expect(result.success).toBe(false);
  });
});
