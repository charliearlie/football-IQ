import { useIQRank } from '../useIQRank';

describe('useIQRank', () => {
    it('returns Bench Warmer for 0 games', () => {
        expect(useIQRank(0)).toBe('Bench Warmer');
    });

    it('returns Academy Prospect for 10 games', () => {
        expect(useIQRank(10)).toBe('Academy Prospect');
    });

    it('returns Squad Player for 25 games', () => {
        expect(useIQRank(25)).toBe('Squad Player');
    });

    it('returns Starting XI for 55 games', () => {
        expect(useIQRank(55)).toBe('Starting XI');
    });

    it('returns Hall of Famer for 1000 games', () => {
        expect(useIQRank(1000)).toBe('Hall of Famer');
    });
});
