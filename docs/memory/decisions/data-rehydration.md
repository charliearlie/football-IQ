# Data Rehydration Service

**Date:** 2026-01-27
**Status:** Implemented
**Author:** Claude

## Overview

The Data Rehydration Service restores user progress, total IQ, and Pro status automatically after app reinstallation. It uses `expo-secure-store` (Keychain on iOS, Keystore on Android) to persist credentials that survive app deletion.

## Problem Statement

When users reinstall the app:
1. AsyncStorage is cleared (Supabase session lost)
2. A new anonymous account is created (new UUID)
3. All local SQLite progress is lost
4. Pro status is not automatically restored
5. Onboarding modal shows again

This breaks the user experience, especially for paying Pro users who expect their subscription to persist.

## Solution Architecture

```
App Reinstall → Check SecureStore for credentials
    ├─ Has credentials → Restore session → Rehydrate data → Skip onboarding
    └─ No credentials → Fresh install flow (current behavior)
```

## Implementation

### 1. Secure Identity Persistence

**File:** `src/features/auth/services/SecureIdentityService.ts`

Stores Supabase credentials in Keychain/Keystore:

```typescript
export const SECURE_KEYS = {
  USER_ID: 'football_iq_user_id',
  REFRESH_TOKEN: 'football_iq_refresh_token',
  ONBOARDING_COMPLETED: 'football_iq_onboarding_completed',
};

// Core functions
storeAuthCredentials(userId, refreshToken)  // Save on login
getStoredCredentials()                      // Check on reinstall
clearStoredCredentials()                    // Clear on sign out
setOnboardingCompleted()                    // Persist onboarding flag
isOnboardingCompletedSecure()               // Check onboarding flag
updateRefreshToken(refreshToken)            // Update when token refreshes
```

**Key Decision:** Store Supabase's `refresh_token` in SecureStore. On reinstall, use `supabase.auth.refreshSession()` with the stored refresh token to restore the exact same user session.

### 2. Auth Session Recovery

**File:** `src/features/auth/context/AuthContext.tsx`

Modified `initializeAuth()` to check SecureStore when no AsyncStorage session exists:

```typescript
const initializeAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Normal case - use existing session
    await storeAuthCredentials(session.user.id, session.refresh_token);
  } else {
    // Check SecureStore (reinstall scenario)
    const storedCredentials = await getStoredCredentials();

    if (storedCredentials) {
      // REINSTALL DETECTED - restore session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: storedCredentials.refreshToken,
      });

      if (!error && data.session) {
        // Session restored! Same user ID as before reinstall
        setSession(data.session);
      } else {
        // Token expired - create new account
        await clearStoredCredentials();
        await createNewAnonymousSession();
      }
    } else {
      // Fresh install - normal flow
      await createNewAnonymousSession();
    }
  }
};
```

### 3. RevenueCat Silent Restore

**File:** `src/features/auth/services/SubscriptionSync.ts`

Added `silentRestorePurchases()` function:

```typescript
export async function silentRestorePurchases(): Promise<SilentRestoreResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const { hasPremium } = checkPremiumEntitlement(customerInfo);
    return { customerInfo, hasPremium };
  } catch (error) {
    // No purchases to restore - not an error
    return { customerInfo: null, hasPremium: false };
  }
}
```

**File:** `src/features/auth/context/SubscriptionSyncContext.tsx`

Integrated silent restore after user identification:

```typescript
const startSync = useCallback(async (userId: string) => {
  const { customerInfo } = await identifyUser(userId);

  if (customerInfo) {
    const { hasPremium } = checkPremiumEntitlement(customerInfo);

    // If not premium, try silent restore (catches reinstall scenario)
    if (!hasPremium) {
      const restoreResult = await silentRestorePurchases();
      if (restoreResult.hasPremium && restoreResult.customerInfo) {
        await handleCustomerInfoUpdate(restoreResult.customerInfo);
        return;
      }
    }

    await handleCustomerInfoUpdate(customerInfo);
  }
}, [handleCustomerInfoUpdate]);
```

### 4. Supabase Data Rehydration

**File:** `src/features/integrity/services/RehydrationService.ts`

Pulls historical puzzle attempts from Supabase when local SQLite is empty:

```typescript
export const DATA_FLOOR_DATE = '2026-01-20';  // Don't pull before this
export const MAX_ATTEMPTS_TO_PULL = 100;

export async function needsRehydration(userId: string): Promise<boolean> {
  // 1. Check if SQLite has data
  const localCount = await getAttemptCount();
  if (localCount > 0) return false;

  // 2. Check if already rehydrated
  const rehydrated = await AsyncStorage.getItem(REHYDRATION_FLAG_KEY);
  if (rehydrated === userId) return false;

  // 3. Check if Supabase has data
  const { count } = await supabase
    .from('puzzle_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('started_at', DATA_FLOOR_DATE);

  return (count ?? 0) > 0;
}

export async function performRehydration(userId: string): Promise<RehydrationResult> {
  // Fetch attempts with related puzzle data
  const { data: attempts } = await supabase
    .from('puzzle_attempts')
    .select(`*, daily_puzzles (*)`)
    .eq('user_id', userId)
    .gte('started_at', DATA_FLOOR_DATE)
    .order('started_at', { ascending: false })
    .limit(MAX_ATTEMPTS_TO_PULL);

  // Insert into local SQLite (marked as synced=1)
  for (const attempt of attempts || []) {
    if (attempt.daily_puzzles) {
      await savePuzzle(transformPuzzle(attempt.daily_puzzles));
    }
    await saveAttempt({ ...transformAttempt(attempt), synced: 1 });
  }

  await AsyncStorage.setItem(REHYDRATION_FLAG_KEY, userId);
  return { success: true, attemptsRehydrated: attempts?.length ?? 0 };
}
```

**File:** `src/features/integrity/context/RehydrationContext.tsx`

Provider that manages rehydration lifecycle:

```typescript
export function RehydrationProvider({ children }: Props) {
  const { user, isInitialized } = useAuth();
  const [isRehydrating, setIsRehydrating] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!isInitialized || !user?.id || hasChecked.current) return;
    hasChecked.current = true;

    const checkAndRehydrate = async () => {
      const needs = await needsRehydration(user.id);
      if (needs) {
        setIsRehydrating(true);
        await performRehydration(user.id);
        setIsRehydrating(false);
      }
    };

    checkAndRehydrate();
  }, [user?.id, isInitialized]);

  if (isRehydrating) {
    return <RehydrationLoadingScreen />;
  }

  return <>{children}</>;
}
```

### 5. Persistent Onboarding Flag

**File:** `src/features/auth/context/OnboardingContext.tsx`

Added SecureStore check in the onboarding state machine:

```typescript
// In runStateMachine() - check SecureStore first
const secureCompleted = await isOnboardingCompletedSecure();
if (secureCompleted) {
  // Reinstall case - user already completed onboarding
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  setCurrentState('COMPLETED');
  return;
}

// In handleOnboardingSubmit() - persist to both stores
await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
await setOnboardingCompleted();  // SecureStore
```

## Provider Hierarchy

```tsx
<AuthProvider>
  <SubscriptionSyncProvider>
    <AuthOnboardingProvider>
      <IntegrityGuardProvider>
        <RehydrationProvider>  {/* NEW */}
          <PuzzleProvider>
            {/* ... */}
          </PuzzleProvider>
        </RehydrationProvider>
      </IntegrityGuardProvider>
    </AuthOnboardingProvider>
  </SubscriptionSyncProvider>
</AuthProvider>
```

## Data Floor Date

The `DATA_FLOOR_DATE = '2026-01-20'` constant ensures:
- No attempts before this date are pulled during rehydration
- Aligns with Streak Calendar floor date
- Applied via Supabase query filter: `.gte('started_at', DATA_FLOOR_DATE)`

## Files Created

| File | Purpose |
|------|---------|
| `src/features/auth/services/SecureIdentityService.ts` | SecureStore credential management |
| `src/features/auth/__tests__/SecureIdentityService.test.ts` | 18 unit tests |
| `src/features/integrity/services/RehydrationService.ts` | Data rehydration logic |
| `src/features/integrity/__tests__/RehydrationService.test.ts` | 18 unit tests |
| `src/features/integrity/context/RehydrationContext.tsx` | Rehydration lifecycle provider |
| `src/features/integrity/components/RehydrationLoadingScreen.tsx` | Loading UI during rehydration |

## Files Modified

| File | Changes |
|------|---------|
| `src/features/auth/context/AuthContext.tsx` | Check SecureStore, restore session |
| `src/features/auth/services/SubscriptionSync.ts` | Added `silentRestorePurchases()` |
| `src/features/auth/context/SubscriptionSyncContext.tsx` | Call silent restore on init |
| `src/features/auth/context/OnboardingContext.tsx` | Check SecureStore for onboarding flag |
| `src/features/auth/index.ts` | Export SecureIdentityService functions |
| `src/features/integrity/index.ts` | Export RehydrationProvider and services |
| `src/lib/database.ts` | Added `getAttemptCount()` function |
| `app/_layout.tsx` | Added RehydrationProvider to hierarchy |
| `jest-setup.ts` | Added SecureStore mock |

## Edge Cases Handled

1. **SecureStore unavailable**: Falls back to normal fresh install flow
2. **Expired refresh token**: Clears stored credentials, creates new anonymous account
3. **Network offline during rehydration**: Graceful failure, can retry on next launch
4. **Partial rehydration failure**: Returns error result, allows retry
5. **Race conditions**: Uses refs and isInitialized guards
6. **Empty Supabase data**: Short-circuits early, marks as "no rehydration needed"

## Testing

All new code includes comprehensive unit tests:
- SecureIdentityService: 18 tests
- RehydrationService: 18 tests
- SubscriptionSync (silentRestorePurchases): 4 additional tests

Run tests with:
```bash
npm test -- --testPathPattern="SecureIdentityService|RehydrationService|RevenueCatSync"
```

## Verification Steps

1. **Fresh Install Simulation:**
   - Clear app data on device
   - Launch app → Creates new anonymous account
   - Play some games, earn IQ
   - Delete app completely
   - Reinstall app
   - Verify: Same user ID, Pro status restored, progress visible

2. **Onboarding Skip:**
   - After reinstall, verify onboarding modal does NOT appear

3. **RevenueCat:**
   - Verify in RevenueCat dashboard that user ID is consistent
   - Verify Pro entitlement transfers on reinstall
