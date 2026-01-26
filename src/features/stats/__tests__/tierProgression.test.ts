/**
 * Tier Progression Tests (TDD)
 *
 * Tests for the 10-tier non-linear IQ progression system.
 * Uses cumulative points with exponential curve (0 to 20,000).
 *
 * Tier Thresholds:
 * 1. Trialist:           0 - 24
 * 2. Youth Team:       25 - 99
 * 3. Reserve Team:     100 - 249
 * 4. Impact Sub:       250 - 499
 * 5. Rotation Player:  500 - 999
 * 6. First Team Regular: 1,000 - 1,999
 * 7. Key Player:       2,000 - 3,999
 * 8. Club Legend:      4,000 - 7,999
 * 9. National Treasure: 8,000 - 19,999
 * 10. GOAT:            20,000+
 */

import {
  getTierForPoints,
  getProgressToNextTier,
  getPointsToNextTier,
  getTierColor,
  IQ_TIERS,
  IQTier,
} from '../utils/tierProgression';

describe('IQ_TIERS constant', () => {
  it('has exactly 10 tiers', () => {
    expect(IQ_TIERS).toHaveLength(10);
  });

  it('has tiers numbered 1-10', () => {
    const tierNumbers = IQ_TIERS.map((t) => t.tier);
    expect(tierNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('has correct tier names', () => {
    const tierNames = IQ_TIERS.map((t) => t.name);
    expect(tierNames).toEqual([
      'Trialist',
      'Youth Team',
      'Reserve Team',
      'Impact Sub',
      'Rotation Player',
      'First Team Regular',
      'Key Player',
      'Club Legend',
      'National Treasure',
      'GOAT',
    ]);
  });

  it('has correct minPoints for each tier', () => {
    const minPoints = IQ_TIERS.map((t) => t.minPoints);
    expect(minPoints).toEqual([0, 25, 100, 250, 500, 1000, 2000, 4000, 8000, 20000]);
  });

  it('has GOAT as the only tier with null maxPoints', () => {
    const tiersWithNullMax = IQ_TIERS.filter((t) => t.maxPoints === null);
    expect(tiersWithNullMax).toHaveLength(1);
    expect(tiersWithNullMax[0].name).toBe('GOAT');
  });
});

describe('getTierForPoints', () => {
  describe('tier 1: Trialist (0-24)', () => {
    it('returns Trialist for 0 points', () => {
      const tier = getTierForPoints(0);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('Trialist');
    });

    it('returns Trialist for 12 points (midpoint)', () => {
      const tier = getTierForPoints(12);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('Trialist');
    });

    it('returns Trialist for 24 points (boundary)', () => {
      const tier = getTierForPoints(24);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('Trialist');
    });
  });

  describe('tier 2: Youth Team (25-99)', () => {
    it('returns Youth Team at exactly 25 points (transition)', () => {
      const tier = getTierForPoints(25);
      expect(tier.tier).toBe(2);
      expect(tier.name).toBe('Youth Team');
    });

    it('returns Youth Team for 62 points (midpoint)', () => {
      const tier = getTierForPoints(62);
      expect(tier.tier).toBe(2);
      expect(tier.name).toBe('Youth Team');
    });

    it('returns Youth Team for 99 points (boundary)', () => {
      const tier = getTierForPoints(99);
      expect(tier.tier).toBe(2);
      expect(tier.name).toBe('Youth Team');
    });
  });

  describe('tier 3: Reserve Team (100-249)', () => {
    it('returns Reserve Team at exactly 100 points', () => {
      const tier = getTierForPoints(100);
      expect(tier.tier).toBe(3);
      expect(tier.name).toBe('Reserve Team');
    });

    it('returns Reserve Team for 249 points (boundary)', () => {
      const tier = getTierForPoints(249);
      expect(tier.tier).toBe(3);
      expect(tier.name).toBe('Reserve Team');
    });
  });

  describe('tier 4: Impact Sub (250-499)', () => {
    it('returns Impact Sub at exactly 250 points', () => {
      const tier = getTierForPoints(250);
      expect(tier.tier).toBe(4);
      expect(tier.name).toBe('Impact Sub');
    });

    it('returns Impact Sub for 499 points (boundary)', () => {
      const tier = getTierForPoints(499);
      expect(tier.tier).toBe(4);
      expect(tier.name).toBe('Impact Sub');
    });
  });

  describe('tier 5: Rotation Player (500-999)', () => {
    it('returns Rotation Player at exactly 500 points', () => {
      const tier = getTierForPoints(500);
      expect(tier.tier).toBe(5);
      expect(tier.name).toBe('Rotation Player');
    });

    it('returns Rotation Player for 999 points (boundary)', () => {
      const tier = getTierForPoints(999);
      expect(tier.tier).toBe(5);
      expect(tier.name).toBe('Rotation Player');
    });
  });

  describe('tier 6: First Team Regular (1000-1999)', () => {
    it('returns First Team Regular at exactly 1000 points', () => {
      const tier = getTierForPoints(1000);
      expect(tier.tier).toBe(6);
      expect(tier.name).toBe('First Team Regular');
    });

    it('returns First Team Regular for 1999 points (boundary)', () => {
      const tier = getTierForPoints(1999);
      expect(tier.tier).toBe(6);
      expect(tier.name).toBe('First Team Regular');
    });
  });

  describe('tier 7: Key Player (2000-3999)', () => {
    it('returns Key Player at exactly 2000 points', () => {
      const tier = getTierForPoints(2000);
      expect(tier.tier).toBe(7);
      expect(tier.name).toBe('Key Player');
    });

    it('returns Key Player for 3999 points (boundary)', () => {
      const tier = getTierForPoints(3999);
      expect(tier.tier).toBe(7);
      expect(tier.name).toBe('Key Player');
    });
  });

  describe('tier 8: Club Legend (4000-7999)', () => {
    it('returns Club Legend at exactly 4000 points', () => {
      const tier = getTierForPoints(4000);
      expect(tier.tier).toBe(8);
      expect(tier.name).toBe('Club Legend');
    });

    it('returns Club Legend for 7999 points (boundary)', () => {
      const tier = getTierForPoints(7999);
      expect(tier.tier).toBe(8);
      expect(tier.name).toBe('Club Legend');
    });
  });

  describe('tier 9: National Treasure (8000-19999)', () => {
    it('returns National Treasure at exactly 8000 points', () => {
      const tier = getTierForPoints(8000);
      expect(tier.tier).toBe(9);
      expect(tier.name).toBe('National Treasure');
    });

    it('returns National Treasure for 19999 points (boundary)', () => {
      const tier = getTierForPoints(19999);
      expect(tier.tier).toBe(9);
      expect(tier.name).toBe('National Treasure');
    });
  });

  describe('tier 10: GOAT (20000+)', () => {
    it('returns GOAT at exactly 20000 points', () => {
      const tier = getTierForPoints(20000);
      expect(tier.tier).toBe(10);
      expect(tier.name).toBe('GOAT');
    });

    it('returns GOAT for 50000 points (above max)', () => {
      const tier = getTierForPoints(50000);
      expect(tier.tier).toBe(10);
      expect(tier.name).toBe('GOAT');
    });

    it('returns GOAT for 1000000 points (way above max)', () => {
      const tier = getTierForPoints(1000000);
      expect(tier.tier).toBe(10);
      expect(tier.name).toBe('GOAT');
    });
  });

  describe('edge cases', () => {
    it('handles negative points by returning Trialist', () => {
      const tier = getTierForPoints(-100);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('Trialist');
    });

    it('handles all exact tier boundaries correctly', () => {
      const boundaries = [0, 25, 100, 250, 500, 1000, 2000, 4000, 8000, 20000];
      const expectedTiers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      boundaries.forEach((points, i) => {
        expect(getTierForPoints(points).tier).toBe(expectedTiers[i]);
      });
    });
  });
});

describe('getProgressToNextTier', () => {
  describe('progress within tier', () => {
    it('returns 0% at start of Trialist tier', () => {
      expect(getProgressToNextTier(0)).toBe(0);
    });

    it('returns ~50% at midpoint of Trialist tier (12 of 25)', () => {
      // Trialist: 0-24, span = 25, midpoint progress = 12/25 = 48%
      expect(getProgressToNextTier(12)).toBe(48);
    });

    it('returns 96% at end of Trialist tier (24 of 25)', () => {
      // 24/25 = 96%
      expect(getProgressToNextTier(24)).toBe(96);
    });

    it('returns 0% at start of Youth Team tier', () => {
      expect(getProgressToNextTier(25)).toBe(0);
    });

    it('returns ~50% at midpoint of Youth Team tier', () => {
      // Youth Team: 25-99, span = 75, midpoint = 25 + 37 = 62
      // Progress = 37/75 = 49%
      expect(getProgressToNextTier(62)).toBe(49);
    });

    it('returns 0% at start of Impact Sub tier', () => {
      expect(getProgressToNextTier(250)).toBe(0);
    });

    it('returns ~50% at midpoint of Impact Sub tier', () => {
      // Impact Sub: 250-499, span = 250, midpoint = 250 + 125 = 375
      // Progress = 125/250 = 50%
      expect(getProgressToNextTier(375)).toBe(50);
    });
  });

  describe('GOAT tier (max level)', () => {
    it('returns 100% for GOAT tier at exactly 20000', () => {
      expect(getProgressToNextTier(20000)).toBe(100);
    });

    it('returns 100% for GOAT tier above 20000', () => {
      expect(getProgressToNextTier(30000)).toBe(100);
    });

    it('returns 100% for GOAT tier way above 20000', () => {
      expect(getProgressToNextTier(100000)).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('returns 0% for negative points', () => {
      expect(getProgressToNextTier(-50)).toBe(0);
    });
  });
});

describe('getPointsToNextTier', () => {
  describe('points needed calculation', () => {
    it('returns 25 for Trialist at 0 points', () => {
      expect(getPointsToNextTier(0)).toBe(25);
    });

    it('returns 13 for Trialist at 12 points', () => {
      // Need 25 to reach Youth Team, have 12, need 13 more
      expect(getPointsToNextTier(12)).toBe(13);
    });

    it('returns 1 for Trialist at 24 points', () => {
      // Need 25 to reach Youth Team, have 24, need 1 more
      expect(getPointsToNextTier(24)).toBe(1);
    });

    it('returns 75 for Youth Team at 25 points', () => {
      // Need 100 to reach Reserve Team, have 25, need 75 more
      expect(getPointsToNextTier(25)).toBe(75);
    });

    it('returns 150 for Reserve Team at 100 points', () => {
      // Need 250 to reach Impact Sub, have 100, need 150 more
      expect(getPointsToNextTier(100)).toBe(150);
    });

    it('returns 250 for Impact Sub at 250 points', () => {
      // Need 500 to reach Rotation Player, have 250, need 250 more
      expect(getPointsToNextTier(250)).toBe(250);
    });

    it('returns 500 for Rotation Player at 500 points', () => {
      // Need 1000 to reach First Team Regular
      expect(getPointsToNextTier(500)).toBe(500);
    });

    it('returns 1000 for First Team Regular at 1000 points', () => {
      // Need 2000 to reach Key Player
      expect(getPointsToNextTier(1000)).toBe(1000);
    });

    it('returns 2000 for Key Player at 2000 points', () => {
      // Need 4000 to reach Club Legend
      expect(getPointsToNextTier(2000)).toBe(2000);
    });

    it('returns 4000 for Club Legend at 4000 points', () => {
      // Need 8000 to reach National Treasure
      expect(getPointsToNextTier(4000)).toBe(4000);
    });

    it('returns 12000 for National Treasure at 8000 points', () => {
      // Need 20000 to reach GOAT
      expect(getPointsToNextTier(8000)).toBe(12000);
    });
  });

  describe('GOAT tier (max level)', () => {
    it('returns 0 for GOAT tier at exactly 20000', () => {
      expect(getPointsToNextTier(20000)).toBe(0);
    });

    it('returns 0 for GOAT tier above 20000', () => {
      expect(getPointsToNextTier(50000)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('returns 25 for negative points', () => {
      // Treated as 0
      expect(getPointsToNextTier(-100)).toBe(25);
    });
  });
});

describe('getTierColor', () => {
  it('returns correct color for tier 1 (Trialist)', () => {
    const color = getTierColor(1);
    expect(color).toBeDefined();
    expect(typeof color).toBe('string');
  });

  it('returns correct color for tier 5 (Rotation Player)', () => {
    const color = getTierColor(5);
    expect(color).toBeDefined();
    expect(typeof color).toBe('string');
  });

  it('returns gold color for tier 10 (GOAT)', () => {
    const color = getTierColor(10);
    expect(color).toBe('#FFD700'); // Gold
  });

  it('returns different colors for different tier ranges', () => {
    const lowTierColor = getTierColor(1);
    const midTierColor = getTierColor(5);
    const highTierColor = getTierColor(10);

    // At least GOAT should be distinct
    expect(highTierColor).not.toBe(lowTierColor);
  });

  it('handles out-of-range tier numbers gracefully', () => {
    // Should not throw
    expect(() => getTierColor(0)).not.toThrow();
    expect(() => getTierColor(11)).not.toThrow();
  });
});
