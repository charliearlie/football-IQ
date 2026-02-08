import { useDailyProgress } from '../useDailyProgress';
import { DailyPuzzleCard } from '../useDailyPuzzles';

describe('useDailyProgress', () => {
    it('returns 0% when no cards', () => {
        const result = useDailyProgress([]);
        expect(result).toEqual({
            percent: 0,
            completedCount: 0,
            totalCount: 0,
            countString: '0 / 0',
            isComplete: false,
        });
    });

    it('calculates 50% completion correctly', () => {
        const cards: DailyPuzzleCard[] = [
            { puzzleId: '1', status: 'done', gameMode: 'career_path' },
            { puzzleId: '2', status: 'play', gameMode: 'career_path' },
        ] as any;

        const result = useDailyProgress(cards);
        expect(result).toEqual({
            percent: 50,
            completedCount: 1,
            totalCount: 2,
            countString: '1 / 2',
            isComplete: false,
        });
    });

    it('calculates 100% completion correctly', () => {
        const cards: DailyPuzzleCard[] = [
            { puzzleId: '1', status: 'done', gameMode: 'career_path' },
            { puzzleId: '2', status: 'done', gameMode: 'career_path' },
        ] as any;

        const result = useDailyProgress(cards);
        expect(result).toEqual({
            percent: 100,
            completedCount: 2,
            totalCount: 2,
            countString: '2 / 2',
            isComplete: true,
        });
    });
});
