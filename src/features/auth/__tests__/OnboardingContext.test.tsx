import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingProvider, useOnboarding } from '../context/OnboardingContext';
import { useAuth } from '../context/AuthContext';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock expo-tracking-transparency
jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock FirstRunModal to capture props
// We assign the captured props to a mutable object so we can inspect them
let mockFirstRunModalProps: any = {};
jest.mock('../components/FirstRunModal', () => ({
  FirstRunModal: (props: any) => {
    mockFirstRunModalProps = props;
    return null;
  },
}));

describe('OnboardingContext (State Machine)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFirstRunModalProps = {};
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <OnboardingProvider>{children}</OnboardingProvider>
  );

  describe('Initialization State', () => {
    it('starts in loading state', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: false,
        isLoading: true,
        user: null,
        profile: null,
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isOnboardingActive).toBe(false);
    });

    it('waits for Auth initialization', async () => {
      // Mock auth still loading
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: false,
        isLoading: true,
      });

      const { result, rerender } = renderHook(() => useOnboarding(), { wrapper });
      expect(result.current.isLoading).toBe(true);

      // Now Auth initializes
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null }, // No name yet
        updateDisplayName: jest.fn(),
      });
      rerender({});

      // Should check profile and eventually show modal
      await waitFor(() => {
        expect(result.current.isOnboardingActive).toBe(true);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('State Transitions & Latching', () => {
    it('latches to SHOW_MODAL if no display name and no storage', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null },
      });

      renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(mockFirstRunModalProps.visible).toBe(true);
      });
    });

    it('latches to COMPLETED if storage has true', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null }, // Even if profile incomplete
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isOnboardingActive).toBe(false);
      });
      expect(mockFirstRunModalProps.visible).toBe(false); // Should be false or undefined depending on render
    });
  });

  describe('Submission Flow', () => {
    it('completes onboarding on successful submission', async () => {
      const mockUpdateDisplayName = jest.fn().mockResolvedValue({ error: null });
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null },
        updateDisplayName: mockUpdateDisplayName,
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Wait for modal to show
      await waitFor(() => {
        expect(mockFirstRunModalProps.visible).toBe(true);
      });

      // Simulate submitting the form via the captured prop
      expect(mockFirstRunModalProps.onSubmit).toBeDefined();
      
      await act(async () => {
        await mockFirstRunModalProps.onSubmit('New User Name');
      });

      // Verification
      expect(mockUpdateDisplayName).toHaveBeenCalledWith('New User Name');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('app_onboarding_completed', 'true');
      
      await waitFor(() => {
        expect(result.current.isOnboardingActive).toBe(false);
      });
    });

    it('handles submission error gracefully', async () => {
      const mockUpdateDisplayName = jest.fn().mockResolvedValue({ 
        error: new Error('Network fail') 
      });
      
      (useAuth as jest.Mock).mockReturnValue({
        isInitialized: true,
        isLoading: false,
        user: { id: 'user123' },
        profile: { display_name: null },
        updateDisplayName: mockUpdateDisplayName,
      });

      const { result } = renderHook(() => useOnboarding(), { wrapper });

      // Wait for modal
      await waitFor(() => {
        expect(mockFirstRunModalProps.visible).toBe(true);
      });

      // Submit with error
      await act(async () => {
        try {
          await mockFirstRunModalProps.onSubmit('Fail Name');
        } catch (e) {
          // Expected error
        }
      });

      // Should still be active
      expect(result.current.isOnboardingActive).toBe(true);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
