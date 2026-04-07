# Release Notes Modal ("What's New")

A modal that shows once per app version on first launch. Useful for announcing new features, game modes, or significant changes.

## How to add release notes

Edit `src/features/home/constants/releaseNotes.ts` and add an entry keyed by version:

```ts
'3.6.0': {
  title: 'Higher/Lower revamp',
  notes: [
    { emoji: '📈', text: 'Redesigned the Higher/Lower game with transfer chain format.' },
    { emoji: '🐛', text: 'Fixed score calculation when guessing equal fees.' },
  ],
},
```

## How to skip a version

Don't add an entry. If `RELEASE_NOTES[version]` has no match, the modal silently skips. Minor patches like `3.5.1` won't show anything unless you explicitly add notes.

## How it works

- `useWhatsNew` hook (`src/features/home/hooks/useWhatsNew.ts`) reads the app version from `expo-constants` and checks AsyncStorage for `@whats_new_seen_{version}`
- If unseen, the hook sets `visible: true`
- `WhatsNewModal` (`src/features/home/components/WhatsNewModal.tsx`) renders the modal using the notes from `releaseNotes.ts`
- On dismiss, the key is written to AsyncStorage so it won't show again

## Files

| File | Purpose |
|------|---------|
| `src/features/home/constants/releaseNotes.ts` | Release notes content (edit this) |
| `src/features/home/components/WhatsNewModal.tsx` | Modal UI |
| `src/features/home/hooks/useWhatsNew.ts` | Visibility logic + AsyncStorage |
| `app/(tabs)/index.tsx` | Renders the modal on the home screen |
