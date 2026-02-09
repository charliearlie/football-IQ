
import { ArchivePuzzle } from '../types/archive.types';
import { getDayStatus, calculateDayStats, isDayLocked } from '../utils/dayStatus';

// Mock data
const MOCK_DATE = '2023-10-25';
const MOCK_PUZZLE_BASE: ArchivePuzzle = {
  id: '1',
  gameMode: 'career_path',
  puzzleDate: MOCK_DATE,
  difficulty: 'easy',
  isLocked: false,
  status: 'play',
  isAdUnlocked: false,
};

describe('Archive Redesign Logic', () => {
    describe('calculateDayStats', () => {
        it('calculates aggregate completion stats correctly', () => {
            const puzzles: ArchivePuzzle[] = [
                { ...MOCK_PUZZLE_BASE, id: '1', status: 'done' },
                { ...MOCK_PUZZLE_BASE, id: '2', status: 'play' },
                { ...MOCK_PUZZLE_BASE, id: '3', status: 'done' },
            ];
            
            const stats = calculateDayStats(puzzles);
            expect(stats).toEqual({ total: 3, completed: 2 });
        });
        
        it('handles empty puzzle list', () => {
            const stats = calculateDayStats([]);
            expect(stats).toEqual({ total: 0, completed: 0 });
        });
    });

    describe('getDayStatus (Perfect Day)', () => {
        it('identifies "Perfect Day" status when all puzzles are done', () => {
            const puzzles: ArchivePuzzle[] = [
                { ...MOCK_PUZZLE_BASE, id: '1', status: 'done' },
                { ...MOCK_PUZZLE_BASE, id: '2', status: 'done' },
            ];
            const status = getDayStatus(puzzles);
            expect(status).toBe('perfect');
        });

        it('identifies "Active" (In Progress) status when some puzzles are done', () => {
             const puzzles: ArchivePuzzle[] = [
                { ...MOCK_PUZZLE_BASE, id: '1', status: 'done' },
                { ...MOCK_PUZZLE_BASE, id: '2', status: 'play' },
            ];
            const status = getDayStatus(puzzles);
            expect(status).toBe('active');
        });
        
         it('identifies "Available" status when no puzzles are done', () => {
             const puzzles: ArchivePuzzle[] = [
                { ...MOCK_PUZZLE_BASE, id: '1', status: 'play' },
                { ...MOCK_PUZZLE_BASE, id: '2', status: 'play' },
            ];
            const status = getDayStatus(puzzles);
            expect(status).toBe('available');
        });
    });

    describe('isDayLocked', () => {
         // Logic: Locked if user is NOT pro AND date is > 7 days old
         // Note: The prompt implies checking date logic.
         // We'll assume the function takes (dateString, isPro)
         
         const TODAY = new Date('2023-11-01'); // Fixed date for test
         const SEVEN_DAYS_AGO = '2023-10-24'; // > 7 days
         const RECENT_DATE = '2023-10-30'; // < 7 days
         
         beforeAll(() => {
             jest.useFakeTimers().setSystemTime(TODAY);
         });
         
         afterAll(() => {
             jest.useRealTimers();
         });

         it('returns true for dates > 7 days old for non-pro users', () => {
             expect(isDayLocked(SEVEN_DAYS_AGO, false)).toBe(true);
         });

         it('returns false for dates > 7 days old for PRO users', () => {
             expect(isDayLocked(SEVEN_DAYS_AGO, true)).toBe(false);
         });

         it('returns false for recent dates for non-pro users', () => {
             expect(isDayLocked(RECENT_DATE, false)).toBe(false);
         });
    });
});
