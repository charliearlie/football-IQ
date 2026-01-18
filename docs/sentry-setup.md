# Sentry Setup Guide

This guide covers the Sentry error monitoring configuration for Football IQ.

## Current Setup

Sentry is configured and active in production builds. Errors are automatically captured and sent to the `football-iq` organization's `football-iq-mobile` project.

### Configuration

| Setting | Value |
|---------|-------|
| Organization | `football-iq` |
| Project | `football-iq-mobile` |
| Region | `de.sentry.io` |
| DSN | `EXPO_PUBLIC_SENTRY_DSN` in `.env` |
| Source Maps | Disabled (`uploadSourceMaps: false`) |
| Native Symbols | Disabled (`uploadNativeSymbols: false`) |

### Files

- **Initialization**: `app/_layout.tsx` (imported before React for proper instrumentation)
- **Error Boundary**: `Sentry.ErrorBoundary` wraps root navigation stack
- **Fallback UI**: `src/components/SentryErrorFallback.tsx`
- **Plugin Config**: `app.json` → `plugins` array

### Behavior

- **Development**: Sentry is disabled (`enabled: !__DEV__`)
- **Production**: Full error capture with `tracesSampleRate: 1.0`
- **Debug logs**: Enabled in dev mode for troubleshooting

---

## Source Map Uploads (Future Setup)

Source maps allow Sentry to show readable stack traces instead of minified code. This requires uploading source maps during each release build.

**Currently disabled** in `app.json` to avoid requiring auth token:
```json
{
  "uploadSourceMaps": false,
  "uploadNativeSymbols": false
}
```

To enable, set both to `true` and configure auth token (see below).

### Option A: Manual Upload via sentry-cli

1. **Install sentry-cli**
   ```bash
   npm install -g @sentry/cli
   # or
   brew install getsentry/tools/sentry-cli
   ```

2. **Authenticate**
   ```bash
   sentry-cli login
   # Or set environment variable
   export SENTRY_AUTH_TOKEN="your-auth-token"
   ```

3. **Upload after build**
   ```bash
   # After running your Xcode archive build
   sentry-cli sourcemaps upload \
     --org football-iq \
     --project football-iq-mobile \
     --release "com.charliearlie.footballiq.app@1.0.0+17" \
     ./path/to/sourcemaps
   ```

### Option B: Xcode Build Phase (Recommended)

Automatically upload source maps during archive builds.

#### Step 1: Get Auth Token

1. Go to https://football-iq.sentry.io/settings/auth-tokens/
2. Create a new token with `project:releases` and `org:read` scopes
3. Save the token securely

#### Step 2: Add Environment Variable

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export SENTRY_AUTH_TOKEN="sntryu_your_token_here"
```

Or add to Xcode scheme:
1. Product → Scheme → Edit Scheme
2. Select "Archive" in the left sidebar
3. Add environment variable `SENTRY_AUTH_TOKEN`

#### Step 3: Add Build Phase Script

1. Open your Xcode project (after running `npx expo prebuild`)
2. Select your app target
3. Go to "Build Phases" tab
4. Click "+" → "New Run Script Phase"
5. Name it "Upload Sentry Source Maps"
6. Drag it to run after "Bundle React Native code and images"
7. Add this script:

```bash
# Only run for Release/Archive builds
if [ "${CONFIGURATION}" = "Release" ]; then
  export SENTRY_PROPERTIES=sentry.properties

  # Path to sentry-cli (adjust if using npm global install)
  SENTRY_CLI="${PODS_ROOT}/@sentry/react-native/scripts/sentry-xcode.sh"

  if [ -f "$SENTRY_CLI" ]; then
    /bin/sh "$SENTRY_CLI"
  else
    echo "warning: sentry-cli not found, skipping source map upload"
  fi
fi
```

#### Step 4: Create sentry.properties

Create `ios/sentry.properties`:
```properties
defaults.org=football-iq
defaults.project=football-iq-mobile
defaults.url=https://de.sentry.io/
```

#### Step 5: Verify

1. Archive your app in Xcode
2. Check the build log for "Uploading source maps"
3. Verify in Sentry: Settings → Source Maps

---

## Testing Sentry Integration

### In Development (Temporary)

To test Sentry in development, temporarily modify `app/_layout.tsx`:

```typescript
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: true, // Change from !__DEV__
  tracesSampleRate: 1.0,
  debug: true,
});

// Add test message after init
Sentry.captureMessage('Test message from development');
```

**Remember to revert before committing!**

### In Production

1. Build and deploy to TestFlight
2. Trigger an error or add a test message
3. Check Sentry dashboard: https://football-iq.sentry.io/issues/

### Verify via Sentry MCP

```
# Search for test messages
search_events(organizationSlug='football-iq', naturalLanguageQuery='Test message')

# Search for recent errors
search_issues(organizationSlug='football-iq', naturalLanguageQuery='unresolved errors from today')
```

---

## Useful Sentry APIs

### Manual Error Capture

```typescript
import * as Sentry from '@sentry/react-native';

// Capture exception
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// Capture message
Sentry.captureMessage('User completed onboarding');
```

### Add Context

```typescript
// Set user info (cleared on sign out)
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.display_name,
});

// Clear user on sign out
Sentry.setUser(null);

// Add tags (indexed, searchable)
Sentry.setTag('game_mode', 'career_path');
Sentry.setTag('is_premium', String(isPremium));

// Add context (not indexed, for debugging)
Sentry.setContext('puzzle', {
  id: puzzle.id,
  date: puzzle.puzzle_date,
  difficulty: puzzle.difficulty,
});
```

### Breadcrumbs

```typescript
// Automatic: Sentry captures console.log, navigation, network requests

// Manual breadcrumb
Sentry.addBreadcrumb({
  category: 'game',
  message: 'User submitted guess',
  level: 'info',
  data: {
    guess: userGuess,
    attempt: attemptNumber,
  },
});
```

---

## Troubleshooting

### Events not appearing in Sentry

1. Check DSN is correct in `.env`
2. Verify `enabled: true` (or `!__DEV__` in production)
3. Check network connectivity
4. Look for errors in Metro bundler console

### Source maps not working

1. Verify auth token has correct scopes
2. Check release version matches exactly
3. Ensure source maps are generated during build
4. Check Sentry dashboard: Settings → Source Maps

### Error boundary not showing

The `SentryErrorFallback` only shows for unhandled errors that crash the app. Test with:

```typescript
// Add temporarily to a screen
throw new Error('Test error boundary');
```

---

## Resources

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Expo + Sentry Guide](https://docs.expo.dev/guides/using-sentry/)
- [Sentry CLI Reference](https://docs.sentry.io/product/cli/)
- [Football IQ Sentry Dashboard](https://football-iq.sentry.io/)
