import { renderHook, act } from '@testing-library/react-native';
import { useSpecialEvent } from '../useSpecialEvent';
import { SPECIAL_EVENTS } from '../../config/events';

// Mock the config
jest.mock('../../config/events', () => ({
  SPECIAL_EVENTS: [
    {
      id: "active-event",
      isActive: true,
      title: "Active Event",
      startDate: new Date(Date.now() - 10000).toISOString(), // Started 10s ago
      endDate: new Date(Date.now() + 10000).toISOString(),   // Ends in 10s
    },
    {
      id: "future-event",
      isActive: true,
      title: "Future Event",
      startDate: new Date(Date.now() + 100000).toISOString(),
      endDate: new Date(Date.now() + 200000).toISOString(),
    },
    {
        id: "past-event",
        isActive: true,
        title: "Past Event",
        startDate: new Date(Date.now() - 200000).toISOString(),
        endDate: new Date(Date.now() - 100000).toISOString(),
      },
  ],
}));

describe('useSpecialEvent', () => {
    it('returns the active event', () => {
        const { result } = renderHook(() => useSpecialEvent());
        expect(result.current).not.toBeNull();
        expect(result.current?.id).toBe('active-event');
    });
});
