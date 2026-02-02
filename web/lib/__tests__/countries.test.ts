import { describe, it, expect } from "vitest";
import { countries, searchCountries, getCountryByCode } from "../countries";

describe("countries", () => {
  it("every country has a non-empty code field", () => {
    for (const c of countries) {
      expect(c.code).toBeDefined();
      expect(c.code.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("codes are unique", () => {
    const codes = countries.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("GB home nations use subdivision codes", () => {
    const england = countries.find((c) => c.name === "England");
    expect(england?.code).toBe("GB-ENG");
    const scotland = countries.find((c) => c.name === "Scotland");
    expect(scotland?.code).toBe("GB-SCT");
    const wales = countries.find((c) => c.name === "Wales");
    expect(wales?.code).toBe("GB-WLS");
    const ni = countries.find((c) => c.name === "Northern Ireland");
    expect(ni?.code).toBe("GB-NIR");
  });

  it("standard countries use alpha-2 codes", () => {
    const belgium = countries.find((c) => c.name === "Belgium");
    expect(belgium?.code).toBe("BE");
    const brazil = countries.find((c) => c.name === "Brazil");
    expect(brazil?.code).toBe("BR");
    const germany = countries.find((c) => c.name === "Germany");
    expect(germany?.code).toBe("DE");
  });
});

describe("searchCountries", () => {
  it("returns results with code field", () => {
    const results = searchCountries("Belgium");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].code).toBe("BE");
  });
});

describe("getCountryByCode", () => {
  it("returns country for valid code", () => {
    const belgium = getCountryByCode("BE");
    expect(belgium).toBeDefined();
    expect(belgium?.name).toBe("Belgium");
  });

  it("returns country for GB home nation code", () => {
    const england = getCountryByCode("GB-ENG");
    expect(england).toBeDefined();
    expect(england?.name).toBe("England");
  });

  it("returns undefined for unknown code", () => {
    expect(getCountryByCode("ZZ")).toBeUndefined();
  });
});
