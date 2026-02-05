/**
 * Shared types for the Grid Sandbox.
 */

export interface GridCategory {
  type: "club" | "nation" | "trophy" | "stat";
  value: string;
}

export interface GeneratedGrid {
  xAxis: [GridCategory, GridCategory, GridCategory];
  yAxis: [GridCategory, GridCategory, GridCategory];
  cellCounts: number[]; // Length 9 — valid player count per cell
}

export interface PoolDebugInfo {
  clubs: number;
  nations: number;
  trophies: number;
  stats: number;
  attempts: number;
}

export interface CellSolvability {
  cellIndex: number;
  row: GridCategory;
  col: GridCategory;
  playerCount: number;
}

export interface RarityPlayer {
  qid: string;
  name: string;
  scoutRank: number;
  rarityScore: number;
  nationalityCode: string | null;
  positionCategory: string | null;
  birthYear: number | null;
}

export interface AutocompletePlayer {
  qid: string;
  name: string;
  scoutRank: number;
  nationalityCode: string | null;
  positionCategory: string | null;
  birthYear: number | null;
}

export interface CellValidationResult {
  isValid: boolean;
  matchedA: boolean;
  matchedB: boolean;
}

/**
 * Country name → nationality_code mapping.
 * Must match the codes stored in the `players.nationality_code` column.
 * UK home nations use ISO 3166-2 subdivision codes (GB-ENG, GB-SCT, GB-WLS, GB-NIR).
 */
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  Brazil: "BR",
  France: "FR",
  Argentina: "AR",
  Germany: "DE",
  Spain: "ES",
  England: "GB-ENG",
  Italy: "IT",
  Portugal: "PT",
  Netherlands: "NL",
  Belgium: "BE",
  Croatia: "HR",
  Uruguay: "UY",
  Colombia: "CO",
  Chile: "CL",
  Poland: "PL",
  Sweden: "SE",
  Denmark: "DK",
  Norway: "NO",
  Wales: "GB-WLS",
  Scotland: "GB-SCT",
  "Northern Ireland": "GB-NIR",
  Ireland: "IE",
  Serbia: "RS",
  Senegal: "SN",
  Morocco: "MA",
  Nigeria: "NG",
  Egypt: "EG",
  "Ivory Coast": "CI",
  Cameroon: "CM",
  Ghana: "GH",
  Algeria: "DZ",
  Japan: "JP",
  "South Korea": "KR",
  Australia: "AU",
  Mexico: "MX",
  USA: "US",
  Canada: "CA",
  Russia: "RU",
  "Czech Republic": "CZ",
  Switzerland: "CH",
  Austria: "AT",
  Greece: "GR",
  Romania: "RO",
  Turkey: "TR",
  Ukraine: "UA",
  Hungary: "HU",
};

/** Reverse lookup: ISO code → country name */
export const CODE_TO_COUNTRY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/** Country code → flag emoji */
export function getFlagEmoji(code: string | null): string {
  if (!code) return "";
  // UK subdivision codes all share the GB flag
  const isoCode = code.startsWith("GB") ? "GB" : code;
  if (isoCode.length !== 2) return "";
  return String.fromCodePoint(
    ...isoCode
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
