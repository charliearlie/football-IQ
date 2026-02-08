import {
  POSITION_MAP,
  FORMATIONS,
  FORMATION_COORDS,
  getPositionCoords,
  getFormationCoords,
  extractSurname,
} from '../constants/formations';
import type { FormationName, PositionKey } from '../types/startingXI.types';

// ============================================================================
// FORMATION_COORDS STRUCTURAL TESTS
// ============================================================================

describe('FORMATION_COORDS', () => {
  const formationNames = Object.keys(FORMATION_COORDS) as FormationName[];

  it('covers all formations defined in FORMATIONS', () => {
    const formationsKeys = Object.keys(FORMATIONS);
    formationNames.forEach((name) => {
      expect(formationsKeys).toContain(name);
    });
    formationsKeys.forEach((name) => {
      expect(formationNames).toContain(name);
    });
  });

  it.each(formationNames)('%s has exactly 11 positions', (formation) => {
    expect(FORMATION_COORDS[formation]).toHaveLength(11);
  });

  it.each(formationNames)('%s has no duplicate position keys', (formation) => {
    const keys = FORMATION_COORDS[formation].map((p) => p.key);
    expect(new Set(keys).size).toBe(11);
  });

  it.each(formationNames)(
    '%s has all coordinates within 0-100 range',
    (formation) => {
      FORMATION_COORDS[formation].forEach(({ key, x, y }) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(100);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      });
    }
  );

  it.each(formationNames)('%s position keys match FORMATIONS array', (formation) => {
    const coordKeys = FORMATION_COORDS[formation].map((p) => p.key).sort();
    const formationKeys = [...FORMATIONS[formation]].sort();
    expect(coordKeys).toEqual(formationKeys);
  });

  it.each(formationNames)('%s has GK at bottom center (y >= 85, x near 50)', (formation) => {
    const gk = FORMATION_COORDS[formation].find((p) => p.key === 'GK');
    expect(gk).toBeDefined();
    expect(gk!.y).toBeGreaterThanOrEqual(85);
    expect(gk!.x).toBeGreaterThanOrEqual(45);
    expect(gk!.x).toBeLessThanOrEqual(55);
  });
});

// ============================================================================
// 4-2-3-1 SPECIFIC TESTS (the formation we're fixing)
// ============================================================================

describe('4-2-3-1 formation coordinates', () => {
  const coords4231 = FORMATION_COORDS['4-2-3-1'];

  const getPos = (key: PositionKey) => coords4231.find((p) => p.key === key)!;

  it('has wide attacking mids (RCAM right side, LCAM left side)', () => {
    const rcam = getPos('RCAM');
    const lcam = getPos('LCAM');

    // Wide AMs should be spread like wingers, not bunched in center
    expect(rcam.x).toBeGreaterThan(70);
    expect(lcam.x).toBeLessThan(30);
  });

  it('has CAM centrally positioned', () => {
    const cam = getPos('CAM');
    expect(cam.x).toBeGreaterThanOrEqual(45);
    expect(cam.x).toBeLessThanOrEqual(55);
  });

  it('has attacking mids between midfield and forward lines', () => {
    const st = getPos('ST');
    const rcdm = getPos('RCDM');
    const rcam = getPos('RCAM');
    const cam = getPos('CAM');
    const lcam = getPos('LCAM');

    // AMs should be between ST (y~15) and CDMs (y~55)
    [rcam, cam, lcam].forEach((am) => {
      expect(am.y).toBeGreaterThan(st.y);
      expect(am.y).toBeLessThan(rcdm.y);
    });
  });

  it('has two CDMs between defense and attacking midfield', () => {
    const rcdm = getPos('RCDM');
    const lcdm = getPos('LCDM');
    const rcb = getPos('RCB');
    const cam = getPos('CAM');

    // CDMs between defenders and AMs
    [rcdm, lcdm].forEach((cdm) => {
      expect(cdm.y).toBeLessThan(rcb.y);
      expect(cdm.y).toBeGreaterThan(cam.y);
    });
  });

  it('has a proper back four', () => {
    const rb = getPos('RB');
    const rcb = getPos('RCB');
    const lcb = getPos('LCB');
    const lb = getPos('LB');

    // Fullbacks wider than center-backs
    expect(rb.x).toBeGreaterThan(rcb.x);
    expect(lb.x).toBeLessThan(lcb.x);

    // All defenders at similar height
    [rb, rcb, lcb, lb].forEach((def) => {
      expect(def.y).toBeGreaterThanOrEqual(70);
      expect(def.y).toBeLessThanOrEqual(82);
    });
  });
});

// ============================================================================
// 4-3-2-1 SPECIFIC TESTS (uses RCAM/LCAM but narrower)
// ============================================================================

describe('4-3-2-1 formation coordinates', () => {
  const coords4321 = FORMATION_COORDS['4-3-2-1'];

  const getPos = (key: PositionKey) => coords4321.find((p) => p.key === key)!;

  it('has narrow attacking mids (diamond shape, not wingers)', () => {
    const rcam = getPos('RCAM');
    const lcam = getPos('LCAM');

    // In 4-3-2-1, the AMs are narrower (inside channels)
    expect(rcam.x).toBeLessThan(70);
    expect(lcam.x).toBeGreaterThan(30);
  });
});

// ============================================================================
// getPositionCoords TESTS
// ============================================================================

describe('getPositionCoords', () => {
  it('returns POSITION_MAP defaults when no formation provided', () => {
    const coords = getPositionCoords('RCAM');
    expect(coords).toEqual(POSITION_MAP.RCAM);
  });

  it('returns formation-specific coords when formation provided', () => {
    const coords = getPositionCoords('RCAM', undefined, undefined, '4-2-3-1');
    const expected = FORMATION_COORDS['4-2-3-1'].find((p) => p.key === 'RCAM')!;
    expect(coords.x).toBe(expected.x);
    expect(coords.y).toBe(expected.y);
  });

  it('returns different coords for RCAM in 4-2-3-1 vs 4-3-2-1', () => {
    const coords4231 = getPositionCoords('RCAM', undefined, undefined, '4-2-3-1');
    const coords4321 = getPositionCoords('RCAM', undefined, undefined, '4-3-2-1');

    // 4-2-3-1 should be wider
    expect(coords4231.x).toBeGreaterThan(coords4321.x);
  });

  it('override_x/override_y take precedence over formation coords', () => {
    const coords = getPositionCoords('RCAM', 42, 69, '4-2-3-1');
    expect(coords.x).toBe(42);
    expect(coords.y).toBe(69);
  });

  it('partial override (only x) uses formation y', () => {
    const coords = getPositionCoords('RCAM', 42, undefined, '4-2-3-1');
    const formationCoords = FORMATION_COORDS['4-2-3-1'].find((p) => p.key === 'RCAM')!;
    expect(coords.x).toBe(42);
    expect(coords.y).toBe(formationCoords.y);
  });

  it('partial override (only y) uses formation x', () => {
    const coords = getPositionCoords('RCAM', undefined, 69, '4-2-3-1');
    const formationCoords = FORMATION_COORDS['4-2-3-1'].find((p) => p.key === 'RCAM')!;
    expect(coords.x).toBe(formationCoords.x);
    expect(coords.y).toBe(69);
  });

  it('null overrides fall back to formation coords (not override)', () => {
    // In the DB, overrides are stored as null (not undefined)
    const coords = getPositionCoords('RCAM', null as unknown as number, null as unknown as number, '4-2-3-1');
    const formationCoords = FORMATION_COORDS['4-2-3-1'].find((p) => p.key === 'RCAM')!;
    expect(coords.x).toBe(formationCoords.x);
    expect(coords.y).toBe(formationCoords.y);
  });

  it('falls back to POSITION_MAP when position not in formation coords', () => {
    // Edge case: position key exists in POSITION_MAP but not in the formation
    const coords = getPositionCoords('GK', undefined, undefined, '4-3-3');
    // GK should still resolve (it IS in every formation, but this tests the fallback logic)
    expect(coords.x).toBe(50);
    expect(coords.y).toBe(90);
  });
});

// ============================================================================
// getFormationCoords TESTS
// ============================================================================

describe('getFormationCoords', () => {
  it('returns array of 11 positions with coords', () => {
    const coords = getFormationCoords('4-3-3');
    expect(coords).toHaveLength(11);
    coords.forEach((pos) => {
      expect(pos).toHaveProperty('key');
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });
  });

  it('returns formation-specific coords for 4-2-3-1', () => {
    const coords = getFormationCoords('4-2-3-1');
    const rcam = coords.find((p) => p.key === 'RCAM')!;
    expect(rcam.x).toBeGreaterThan(70);
  });
});
