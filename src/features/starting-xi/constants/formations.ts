/**
 * Formation Constants for Starting XI
 *
 * POSITION_MAP: Default x,y coordinates for each position key.
 * FORMATIONS: Mapping of formation names to position arrays.
 *
 * Coordinate system:
 * - x: 0 = left touchline, 100 = right touchline
 * - y: 0 = attacking goal (top of screen), 100 = defensive goal (bottom)
 *   - y=90 is the defensive baseline (goalkeeper area)
 *   - y=10-25 is the attacking area (forwards)
 */

import type {
  PositionKey,
  PositionCoords,
  FormationName,
} from '../types/startingXI.types';

/**
 * Default coordinates for all position keys.
 * These can be overridden per-player in puzzle content via override_x/override_y.
 */
export const POSITION_MAP: Record<PositionKey, PositionCoords> = {
  // Goalkeeper
  GK: { x: 50, y: 90 },

  // Defenders (y ~75-80)
  RB: { x: 85, y: 75 },
  RCB: { x: 65, y: 78 },
  CB: { x: 50, y: 78 },
  LCB: { x: 35, y: 78 },
  LB: { x: 15, y: 75 },
  RWB: { x: 88, y: 65 },
  LWB: { x: 12, y: 65 },

  // Defensive Midfield (y ~60)
  CDM: { x: 50, y: 60 },
  RCDM: { x: 60, y: 60 },
  LCDM: { x: 40, y: 60 },

  // Central Midfield (y ~50)
  RCM: { x: 65, y: 50 },
  CM: { x: 50, y: 50 },
  LCM: { x: 35, y: 50 },
  RM: { x: 85, y: 50 },
  LM: { x: 15, y: 50 },

  // Attacking Midfield (y ~38)
  CAM: { x: 50, y: 38 },
  RCAM: { x: 60, y: 38 },
  LCAM: { x: 40, y: 38 },

  // Forwards (y ~18-25)
  RW: { x: 82, y: 25 },
  LW: { x: 18, y: 25 },
  ST: { x: 50, y: 18 },
  RST: { x: 60, y: 18 },
  LST: { x: 40, y: 18 },
  CF: { x: 50, y: 25 },
};

/**
 * Formation-specific coordinates for all positions.
 * Each formation defines exact x,y coordinates for its 11 positions,
 * allowing the same position key (e.g., RCAM) to render differently
 * depending on tactical context (wide in 4-2-3-1, narrow in 4-3-2-1).
 */
export const FORMATION_COORDS: Record<
  FormationName,
  Array<{ key: PositionKey; x: number; y: number }>
> = {
  '4-3-3': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RB', x: 85, y: 75 },
    { key: 'RCB', x: 65, y: 78 },
    { key: 'LCB', x: 35, y: 78 },
    { key: 'LB', x: 15, y: 75 },
    { key: 'RCM', x: 65, y: 50 },
    { key: 'CM', x: 50, y: 50 },
    { key: 'LCM', x: 35, y: 50 },
    { key: 'RW', x: 82, y: 25 },
    { key: 'ST', x: 50, y: 15 },
    { key: 'LW', x: 18, y: 25 },
  ],
  '4-2-3-1': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RB', x: 85, y: 75 },
    { key: 'RCB', x: 65, y: 78 },
    { key: 'LCB', x: 35, y: 78 },
    { key: 'LB', x: 15, y: 75 },
    { key: 'RCDM', x: 60, y: 55 },
    { key: 'LCDM', x: 40, y: 55 },
    { key: 'RCAM', x: 82, y: 28 },
    { key: 'CAM', x: 50, y: 30 },
    { key: 'LCAM', x: 18, y: 28 },
    { key: 'ST', x: 50, y: 15 },
  ],
  '4-4-2': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RB', x: 85, y: 75 },
    { key: 'RCB', x: 65, y: 78 },
    { key: 'LCB', x: 35, y: 78 },
    { key: 'LB', x: 15, y: 75 },
    { key: 'RM', x: 85, y: 50 },
    { key: 'RCM', x: 60, y: 52 },
    { key: 'LCM', x: 40, y: 52 },
    { key: 'LM', x: 15, y: 50 },
    { key: 'RST', x: 60, y: 18 },
    { key: 'LST', x: 40, y: 18 },
  ],
  '4-4-1-1': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RB', x: 85, y: 75 },
    { key: 'RCB', x: 65, y: 78 },
    { key: 'LCB', x: 35, y: 78 },
    { key: 'LB', x: 15, y: 75 },
    { key: 'RM', x: 85, y: 50 },
    { key: 'RCM', x: 60, y: 52 },
    { key: 'LCM', x: 40, y: 52 },
    { key: 'LM', x: 15, y: 50 },
    { key: 'CAM', x: 50, y: 35 },
    { key: 'ST', x: 50, y: 18 },
  ],
  '3-5-2': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RCB', x: 68, y: 78 },
    { key: 'CB', x: 50, y: 78 },
    { key: 'LCB', x: 32, y: 78 },
    { key: 'RWB', x: 88, y: 58 },
    { key: 'RCM', x: 62, y: 50 },
    { key: 'CDM', x: 50, y: 55 },
    { key: 'LCM', x: 38, y: 50 },
    { key: 'LWB', x: 12, y: 58 },
    { key: 'RST', x: 60, y: 18 },
    { key: 'LST', x: 40, y: 18 },
  ],
  '3-4-3': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RCB', x: 68, y: 78 },
    { key: 'CB', x: 50, y: 78 },
    { key: 'LCB', x: 32, y: 78 },
    { key: 'RWB', x: 88, y: 55 },
    { key: 'RCM', x: 60, y: 50 },
    { key: 'LCM', x: 40, y: 50 },
    { key: 'LWB', x: 12, y: 55 },
    { key: 'RW', x: 82, y: 25 },
    { key: 'ST', x: 50, y: 15 },
    { key: 'LW', x: 18, y: 25 },
  ],
  '5-3-2': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RWB', x: 88, y: 68 },
    { key: 'RCB', x: 68, y: 78 },
    { key: 'CB', x: 50, y: 78 },
    { key: 'LCB', x: 32, y: 78 },
    { key: 'LWB', x: 12, y: 68 },
    { key: 'RCM', x: 65, y: 50 },
    { key: 'CM', x: 50, y: 50 },
    { key: 'LCM', x: 35, y: 50 },
    { key: 'RST', x: 60, y: 18 },
    { key: 'LST', x: 40, y: 18 },
  ],
  '5-4-1': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RWB', x: 88, y: 68 },
    { key: 'RCB', x: 68, y: 78 },
    { key: 'CB', x: 50, y: 78 },
    { key: 'LCB', x: 32, y: 78 },
    { key: 'LWB', x: 12, y: 68 },
    { key: 'RM', x: 85, y: 50 },
    { key: 'RCM', x: 60, y: 52 },
    { key: 'LCM', x: 40, y: 52 },
    { key: 'LM', x: 15, y: 50 },
    { key: 'ST', x: 50, y: 18 },
  ],
  '4-1-4-1': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RB', x: 85, y: 75 },
    { key: 'RCB', x: 65, y: 78 },
    { key: 'LCB', x: 35, y: 78 },
    { key: 'LB', x: 15, y: 75 },
    { key: 'CDM', x: 50, y: 60 },
    { key: 'RM', x: 85, y: 45 },
    { key: 'RCM', x: 60, y: 48 },
    { key: 'LCM', x: 40, y: 48 },
    { key: 'LM', x: 15, y: 45 },
    { key: 'ST', x: 50, y: 18 },
  ],
  '4-3-2-1': [
    { key: 'GK', x: 50, y: 90 },
    { key: 'RB', x: 85, y: 75 },
    { key: 'RCB', x: 65, y: 78 },
    { key: 'LCB', x: 35, y: 78 },
    { key: 'LB', x: 15, y: 75 },
    { key: 'RCM', x: 65, y: 52 },
    { key: 'CM', x: 50, y: 55 },
    { key: 'LCM', x: 35, y: 52 },
    { key: 'RCAM', x: 62, y: 35 },
    { key: 'LCAM', x: 38, y: 35 },
    { key: 'ST', x: 50, y: 18 },
  ],
};

/**
 * Formation definitions mapping formation names to position key arrays.
 * Each array contains exactly 11 positions in tactical order:
 * [GK, defenders..., midfielders..., attackers...]
 */
export const FORMATIONS: Record<FormationName, PositionKey[]> = {
  '4-3-3': ['GK', 'RB', 'RCB', 'LCB', 'LB', 'RCM', 'CM', 'LCM', 'RW', 'ST', 'LW'],
  '4-2-3-1': [
    'GK',
    'RB',
    'RCB',
    'LCB',
    'LB',
    'RCDM',
    'LCDM',
    'RCAM',
    'CAM',
    'LCAM',
    'ST',
  ],
  '4-4-2': [
    'GK',
    'RB',
    'RCB',
    'LCB',
    'LB',
    'RM',
    'RCM',
    'LCM',
    'LM',
    'RST',
    'LST',
  ],
  '4-4-1-1': [
    'GK',
    'RB',
    'RCB',
    'LCB',
    'LB',
    'RM',
    'RCM',
    'LCM',
    'LM',
    'CAM',
    'ST',
  ],
  '3-5-2': [
    'GK',
    'RCB',
    'CB',
    'LCB',
    'RWB',
    'RCM',
    'CDM',
    'LCM',
    'LWB',
    'RST',
    'LST',
  ],
  '3-4-3': ['GK', 'RCB', 'CB', 'LCB', 'RWB', 'RCM', 'LCM', 'LWB', 'RW', 'ST', 'LW'],
  '5-3-2': [
    'GK',
    'RWB',
    'RCB',
    'CB',
    'LCB',
    'LWB',
    'RCM',
    'CM',
    'LCM',
    'RST',
    'LST',
  ],
  '5-4-1': [
    'GK',
    'RWB',
    'RCB',
    'CB',
    'LCB',
    'LWB',
    'RM',
    'RCM',
    'LCM',
    'LM',
    'ST',
  ],
  '4-1-4-1': [
    'GK',
    'RB',
    'RCB',
    'LCB',
    'LB',
    'CDM',
    'RM',
    'RCM',
    'LCM',
    'LM',
    'ST',
  ],
  '4-3-2-1': [
    'GK',
    'RB',
    'RCB',
    'LCB',
    'LB',
    'RCM',
    'CM',
    'LCM',
    'RCAM',
    'LCAM',
    'ST',
  ],
};

/**
 * Name prefixes that should be kept with the surname.
 * e.g., "van" in "Virgil van Dijk" → "van Dijk"
 */
const SURNAME_PREFIXES = [
  'van',
  'de',
  'da',
  'di',
  'del',
  'von',
  'la',
  'el',
  'dos',
  'das',
  'ben',
  'al',
  'le',
];

/**
 * Extract surname from full player name for display on markers.
 *
 * Handles various naming conventions:
 * - Western: "Bukayo Saka" → "Saka"
 * - East Asian: "Son Heung-min" → "Son" (family name first)
 * - Dutch/German: "Virgil van Dijk" → "van Dijk"
 * - Single name: "Neymar" → "Neymar"
 *
 * @param fullName - Full player name
 * @returns Surname for display (typically last name, or prefixed surname)
 *
 * @example
 * extractSurname("Virgil van Dijk")  // "van Dijk"
 * extractSurname("Sadio Mané")       // "Mané"
 * extractSurname("Neymar")           // "Neymar"
 * extractSurname("Kevin De Bruyne")  // "De Bruyne"
 */
export function extractSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);

  // Single name (e.g., "Neymar", "Pelé")
  if (parts.length === 1) {
    return parts[0];
  }

  // Check if second-to-last word is a prefix (e.g., "van", "de")
  if (parts.length >= 3) {
    const maybePrefix = parts[parts.length - 2].toLowerCase();
    if (SURNAME_PREFIXES.includes(maybePrefix)) {
      // Include prefix with surname: "van Dijk", "De Bruyne"
      return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
    }
  }

  // Standard case: return last word
  return parts[parts.length - 1];
}

/**
 * Get position coordinates, applying formation-specific coords and overrides.
 *
 * Priority: override > formation-specific > POSITION_MAP fallback
 *
 * @param positionKey - The position key (e.g., "ST", "GK")
 * @param overrideX - Optional x-coordinate override (0-100)
 * @param overrideY - Optional y-coordinate override (0-100)
 * @param formation - Optional formation name for formation-specific coords
 * @returns Final coordinates to use for positioning
 */
export function getPositionCoords(
  positionKey: PositionKey,
  overrideX?: number | null,
  overrideY?: number | null,
  formation?: FormationName
): PositionCoords {
  // 1. Try formation-specific coords
  let baseCoords = POSITION_MAP[positionKey];
  if (formation && FORMATION_COORDS[formation]) {
    const formationPos = FORMATION_COORDS[formation].find(
      (p) => p.key === positionKey
    );
    if (formationPos) {
      baseCoords = { x: formationPos.x, y: formationPos.y };
    }
  }

  // 2. Apply overrides (null/undefined fall through to base)
  return {
    x: overrideX != null ? overrideX : baseCoords.x,
    y: overrideY != null ? overrideY : baseCoords.y,
  };
}

/**
 * Get the full coordinate set for a formation.
 * Returns an array of { key, x, y } for all 11 positions.
 */
export function getFormationCoords(
  formation: FormationName
): Array<{ key: PositionKey; x: number; y: number }> {
  return FORMATION_COORDS[formation] || FORMATION_COORDS['4-3-3'];
}

/**
 * Validate that a formation name is supported.
 */
export function isValidFormation(name: string): name is FormationName {
  return name in FORMATIONS;
}

/**
 * Get list of all supported formation names.
 */
export function getFormationNames(): FormationName[] {
  return Object.keys(FORMATIONS) as FormationName[];
}
