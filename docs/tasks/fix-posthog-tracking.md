# Task: Fix PostHog Analytics Tracking on TestFlight

## Problem
PostHog analytics is not tracking any events on TestFlight builds. It was previously set up but is not working.

## Current State

### What's Installed
- `posthog-react-native`: ^4.24.0
- `posthog-react-native-session-replay`: ^1.2.3 (DO NOT USE - causes Xcode build issues)

### Current Configuration (`app/_layout.tsx` lines 274-282)
```tsx
<PostHogProvider
  apiKey="phc_u3vrkbSBmnx9m6bDDInC3XsFrnETkRAnNgO3iVLDWLE"
  options={{
    host: "https://eu.i.posthog.com",
  }}
  autocapture={{
    captureScreens: false,
  }}
>
```

### What's Missing

1. **No Expo plugin in `app.json`**
   - `posthog-react-native` is NOT in the plugins array
   - This may prevent native initialization on iOS/Android

2. **No events are being tracked**
   - `usePostHog()` hook is never imported or used anywhere in the codebase
   - Zero `.capture()` calls exist
   - Screen autocapture is disabled (`captureScreens: false`)

3. **No initialization logging**
   - Unlike RevenueCat/Sentry which log success, PostHog has no verification logging

4. **No debug mode enabled**
   - PostHog has a `debug: true` option that would help diagnose issues

## What Needs to Be Done

### 1. Add Expo Plugin to `app.json`
Add `posthog-react-native` to the plugins array (check PostHog docs for correct config).

### 2. Enable Debug Mode for Testing
Update the PostHogProvider options:
```tsx
options={{
  host: "https://eu.i.posthog.com",
  debug: __DEV__, // Enable debug logging in development
}}
```

### 3. Add Initialization Logging
Add console.log after PostHog initializes to verify it's working.

### 4. Enable Screen Autocapture (or add manual tracking)
Either:
- Set `captureScreens: true` for automatic screen tracking, OR
- Add manual event tracking using `usePostHog().capture()` for key events

### 5. Track Key Events (if going manual route)
Consider tracking:
- Game completions (with score, mode)
- Purchases
- Subscription status changes
- Onboarding completion
- Feature usage (archive views, etc.)

## Constraints

- **DO NOT enable session replay** - `posthog-react-native-session-replay` causes Xcode build issues
- Keep the EU host: `https://eu.i.posthog.com`
- API key is correct: `phc_u3vrkbSBmnx9m6bDDInC3XsFrnETkRAnNgO3iVLDWLE`

## Files to Check/Modify

1. `app.json` - Add posthog-react-native plugin
2. `app/_layout.tsx` - Update PostHogProvider configuration
3. Potentially create a PostHog utility/hook for tracking events

## Verification

1. Build app locally and check console for PostHog debug logs
2. Deploy to TestFlight
3. Check PostHog dashboard for:
   - Active users
   - Screen views (if autocapture enabled)
   - Custom events (if added)

## Reference Links

- PostHog React Native docs: https://posthog.com/docs/libraries/react-native
- PostHog Expo setup: https://posthog.com/docs/libraries/react-native#expo
