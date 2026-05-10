# Website Games Migration Design

**Date**: 2026-05-10
**Status**: Approved (brainstorming → ready for implementation plan)
**Owner**: Charlie W

---

## Context

Football IQ has 16 game modes shipping on mobile (React Native / Expo). The web app (Next.js 15, App Router, in `web/`) currently has 5 of them playable: Career Path, Transfer Guess, Connections, Topical Quiz, and Timeline. The remaining 10 modes have SEO landing pages at `/play/[gameMode]` with App Store CTAs but no playable game.

Web SEO is starting to rank well, so the strategic priority is to (1) bring the rest of the games to web to maximise organic-traffic conversion, (2) optimise each game page for SEO, and (3) introduce a paid tier on web to match the mobile freemium model.

Mobile uses RevenueCat (`react-native-purchases`) as the source of truth for entitlements, with `profile.is_premium` propagated via webhook to Supabase. Web has Supabase auth scaffolded (`/login`, `/auth/callback`) but no payment infrastructure.

## Goals

1. Migrate the remaining 10 game modes to web in priority order (Who's That? → Higher/Lower → Top Tens → Starting XI → The Grid → Who Am I?, then a deferred wave: The Chain, Threads, Goalscorer Recall, Career Path Pro).
2. Maximise SEO ranking for each game's primary keyword cluster — every game page is a top-3 candidate for its target queries.
3. Introduce paid subscriptions on web via RevenueCat Web Billing (Stripe under the hood), with cross-platform entitlement unlock so a user who pays on web has premium on mobile and vice versa.

## Non-goals

- Reusing React Native components on web. Game UIs are rebuilt in React; only pure logic (validation, share text, scoring) is shared.
- Building a custom Stripe checkout. RevenueCat Web Billing handles checkout UX.
- Gating today's puzzle on any mode. Today's puzzle is always free on web — it is the SEO ranking surface.
- Mobile-side changes beyond ensuring `Purchases.logIn(supabaseUserId)` is called consistently. Mobile remains anonymous-first with optional email upgrade.
- Backlink campaigns, programmatic blog content, gift subscriptions, promo codes, family sharing.

## Locked decisions

| Area | Decision |
|---|---|
| Step 1 game priority | Who's That? → Higher/Lower → Top Tens, then Starting XI / The Grid / Who Am I?; The Chain / Threads / Goalscorer Recall / Career Path Pro deferred |
| Premium model | Today's puzzle on every mode = free with ads. Archive (older puzzles) + Career Path Pro + ad-free = premium. Mirrors mobile. |
| Subscription architecture | RevenueCat Web Billing (Stripe under the hood). Single source of truth = RevenueCat, identified by Supabase user ID as App User ID. |
| Web auth flow | Anonymous play first. Sign-in only required to subscribe or sync progress across devices. |
| Code architecture | Approach C: per-page SEO wrappers around a shared `<DailyPuzzleGame>` orchestrator. |

---

## Architecture

### Orchestrator pattern

A single `<DailyPuzzleGame mode="<slug>">` component owns all cross-cutting per-game-page concerns. Each `/play/<slug>/page.tsx` is a thin SEO wrapper around it.

```
web/app/play/whos-that/page.tsx              # SEO metadata, JSON-LD, copy → renders <DailyPuzzleGame>
web/components/play/DailyPuzzleGame.tsx      # NEW — orchestrator
web/components/play/games/WhosThatGame.tsx   # NEW — pure game UI
web/components/play/games/HigherLowerGame.tsx
... etc
web/lib/play/registry.ts                     # NEW — typed game registry
```

### Game contract

Every game UI plugs in via a single typed interface:

```ts
type GameProps<T> = {
  puzzle: T;
  onComplete: (result: GameResult) => void;
};

type GameResult = {
  won: boolean;
  score?: number;
  shareText: string;
  metadata?: Record<string, unknown>;
};
```

### Game registry

Central typed map for orchestrator dispatch:

```ts
// web/lib/play/registry.ts
export const GAME_REGISTRY = {
  "career-path":    { component: CareerPathGame,    fetchPuzzle: fetchCareerPathPuzzle,    howToPlay: CareerPathHowToPlay },
  "transfer-guess": { ... },
  "connections":    { ... },
  "topical-quiz":   { ... },
  "timeline":       { ... },
  "whos-that":      { component: WhosThatGame,      fetchPuzzle: fetchWhosThatPuzzle,      howToPlay: WhosThatHowToPlay },
  "higher-lower":   { ... },
  "top-tens":       { ... },
  "starting-xi":    { ... },
  "the-grid":       { ... },
  "who-am-i":       { ... },
} satisfies Record<string, GameRegistryEntry<unknown>>;
```

### Orchestrator responsibilities

- Fetch today's puzzle for the mode (via existing `puzzles` API)
- Run free-window + `is_premium` check — for step 1 this is a no-op (today's puzzle is always free); becomes load-bearing in step 3 when archive lands
- Render `GamePageShell` (existing component, evolved to accept `mode`)
- Show "no puzzle today" / "played today" gates (existing components)
- Render the game via registry lookup, pass `puzzle` + `onComplete`
- Post-game: track analytics (`useGameTracking`), show `PostGameCTA`, persist to local `playSession` (anonymous-friendly)
- Ad slots and `AppDownloadCTA` placement

### Per-page (SEO wrapper) responsibilities

- Page `Metadata` export (title, description, OG, canonical)
- `JsonLd` (SoftwareApplication, BreadcrumbList, FAQPage)
- Server-rendered above-the-fold copy + how-to-play preview (visible pre-hydration)
- Internal links to the hub, related games, related quiz landings

### Code reuse with mobile

- **Reused (lifted to `web/lib/`)**: data shapes (puzzle JSON), validation utilities, share-text generators, scoring formulas, attribute-comparison logic for Who's That, stat-comparison logic for Higher/Lower
- **Not reused**: React Native components. Web rebuilds UI in React. Visual parity is not a goal; logic parity is.

### Anonymous play (step 1)

Every game works without login. Progress persists in `playSession` (existing module, localStorage-backed). No auth scaffolding work happens in step 1.

---

## SEO design

### Per-page SEO structure

Every game page (existing 5 + new 6) follows the same template:

- **`<title>`**: `<Game Name> — Daily Football <Mode Type> | Football IQ`
- **`<meta description>`**: 150–160 chars, primary keyword + free-to-play angle + daily refresh hook
- **`<h1>`**: matches title without the brand suffix
- **Above-the-fold copy**: 50–80 word intro, server-rendered, primary keyword 1×, secondary 1–2×
- **How-to-play section**: 100–150 words, server-rendered
- **FAQ section**: 3–6 Q&As targeting long-tail queries; feeds `FAQPage` JSON-LD
- **Internal links**: hub + 2–3 related modes + home + related `/quiz/*` landing
- **Freshness signal**: render today's ISO date (e.g. *"Today's puzzle — May 10"*); sitemap `lastmod` already auto-updates

### JSON-LD per page

- `SoftwareApplication` (`applicationCategory: "GameApplication"`)
- `BreadcrumbList` (home → play → game)
- `FAQPage` matching the FAQ section
- `WebSite` with `SearchAction` on the homepage only

### Sitemap

`web/app/sitemap.ts` includes every game URL — both playable pages and the SEO-landing pages for not-yet-ported games — with `changefreq: "daily"`. Existing `lastmod` logic stays.

### Keyword research and copy

Each game gets a brief in `docs/superpowers/seo/<slug>.md` capturing primary keyword, secondary keywords, target SERP intent, FAQ list. The `seo-trivia` agent drafts copy; we review.

### Performance budgets

LCP < 2.5s, CLS < 0.1, INP < 200ms. Measured via Vercel Analytics (already wired). Server-render the SEO frame; lazy-load the game JS only after first paint.

### Robots and canonicalization

Every `/play/<slug>` is `index, follow`, canonical to itself. The dynamic SEO landing route at `/play/[gameMode]` keeps redirecting traffic for any slugs without a static page (back-compat). Once a game ships, the static page wins (Next.js static routes take priority over dynamic).

---

## Accounts and subscriptions design

### Account scaffolding

- Web has Supabase auth scaffolded already (`/login`, `/auth/callback`). Extend it:
  - Sign-up via email + magic link (matches mobile, no passwords)
  - Optional Google/Apple OAuth (phase 2 inside step 3)
  - "Continue as guest" prominently shown — anonymous play stays the default
  - Account → settings page: email change, sign out, manage subscription, delete account
- **Identity bridging**: on first sign-in, migrate the user's anonymous `playSession` history into their authed `profile` row via a one-shot idempotent Supabase RPC.
- **Mobile-side**: existing anonymous-on-launch flow stays. Email sign-in on mobile is a parallel ticket; not blocking for this design.

### RevenueCat integration

- Both web and mobile call `Purchases.logIn(supabaseUserId)` after authentication. The Supabase user ID is the RevenueCat App User ID — single identity across platforms.
- Web uses `purchases-js` SDK (RevenueCat Web Billing). Mobile keeps `react-native-purchases`.
- Products configured in RevenueCat dashboard: monthly + annual matching mobile pricing (parity with App Store / Play Store).
- Checkout flow: user clicks "Upgrade" → web triggers `Purchases.purchase(package)` → RevenueCat opens hosted Stripe checkout → on success, RC fires entitlement webhook → existing webhook handler updates Supabase `profiles.is_premium`.
- The same webhook handler used today for mobile RC events is reused for web; we verify it routes web events identically rather than writing new code.

### Paywall enforcement

- Orchestrator (built in step 1) gains a `requiresPremium` check on `puzzle.is_premium` and a `paywall` render path
- Free user clicks an archive puzzle → modal with two CTAs: "Watch ad to unlock" (rewarded ad — needs verification of web rewarded-ad availability via AdSense; if not viable, drop the ad path on web and offer upgrade only) or "Upgrade to remove ads + unlock all"
- Premium user → straight through, no ads, no paywall
- Career Path Pro page mounts but renders the paywall if the user isn't premium; today's puzzle on every other mode stays free
- `web/components/play/AdSlot.tsx` wrapped in a premium check (mirrors mobile `AdContext`)

### Manage subscription

Account page links to RevenueCat's customer portal. RC handles cancel/upgrade/downgrade. No DIY billing portal.

### Edge cases

- User pays on web → uninstalls and reinstalls app → entitlement survives (tied to App User ID, not device)
- Mobile annual subscriber signs in on web → web sees them as premium immediately
- Refunds → RC webhook fires, `is_premium` flips to `false`
- Family sharing → out of scope (RC supports it; not enabled v1)

### Analytics

PostHog events: `paywall_viewed`, `checkout_started`, `subscription_purchased`, `subscription_cancelled`. Event names match mobile for unified funnels.

---

## Phasing

### Phase 1.0 — Orchestrator refactor (1–2 days)
- Build `<DailyPuzzleGame>` orchestrator + `GameProps<T>` contract + registry
- Migrate existing 5 games (Career Path, Transfer Guess, Connections, Topical Quiz, Timeline) onto the orchestrator
- Verify zero regressions via existing tests + manual QA on all 5 games

### Phase 1.1 — Who's That? (2 days)
- Build `<WhosThatGame />`, port attribute-comparison logic from mobile
- Wire SEO page + JSON-LD + FAQ
- Ship

### Phase 1.2 — Higher/Lower (2 days)
- Build `<HigherLowerGame />`, port stat-comparison logic
- SEO page, ship

### Phase 1.3 — Top Tens (2 days)
- Build, SEO, ship

### Phase 1.4 — Starting XI / The Grid / Who Am I? (3–5 days, parallelisable)
- Each ~1 day using the now-mature pattern
- SEO pages, ship in any order

### Phase 1.5 — Deferred wave (post-step-1, optional)
- The Chain, Threads, Goalscorer Recall, Career Path Pro

### Phase 2 — SEO pass (3–4 days, after phase 1.4)
- Keyword briefs for each game (1 day, parallel via `seo-trivia` agent)
- Copy authoring + FAQ + internal links per page (2 days)
- Performance pass — LCP/CLS budgets, lazy-load tightening (1 day)
- Sitemap + robots verification, GSC submission

### Phase 3.0 — Account scaffolding (2–3 days)
- Magic-link sign-up flow on web
- Account page (settings, sign out, delete)
- Identity bridging from anonymous → authed
- "Continue as guest" CTA placement

### Phase 3.1 — RevenueCat Web Billing wiring (2–3 days)
- RC products configured, `purchases-js` integrated
- `Purchases.logIn` wired on both platforms
- Webhook verified end-to-end (test sub from web; confirm `is_premium` flips; confirm app sees premium)

### Phase 3.2 — Paywall enforcement (2–3 days)
- Orchestrator paywall path, archive unlock modal
- Career Path Pro behind paywall on web
- Ad-free for premium on web
- Manage subscription link

### Phase 3.3 — Re-enable PREMIUM_MODES (0.5 day)
- Flip `PREMIUM_MODES` from `[]` to `["career_path_pro"]` in `web/lib/constants.ts`
- Re-enable archive paywall via `puzzle.is_premium`
- Coordinate the same change in mobile (single deploy window)

**Total estimate**: ~25 working days for phases 1.0–3.3, deferring the niche games. ~5–7 calendar weeks at one engineer.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Game UI parity drift between web and mobile | Extract shared logic (validation, share text, scoring) to `web/lib/`, consume from both. Visual parity not required; logic parity is. |
| RevenueCat web billing fees eating margin | Parity pricing with mobile (no web discount). RC ~1% web fee comes out of the same margin we already accept on mobile RC fees. |
| Anonymous → authed migration losing data | One-shot idempotent Supabase RPC `claim_play_history(anonymous_session_id, user_id)`; runs on first sign-in; safe to call repeatedly. |
| SEO regression from orchestrator refactor | Per-page metadata stays intact. Verify canonical / indexability via Search Console post-deploy. Smoke-test the 5 existing pages before adding new ones. |
| Web rewarded-ad availability for archive unlock | Verify AdSense supports rewarded-ad surface on web; if not, drop the ad-unlock path for archive on web and offer upgrade only. |
| Stripe + RC webhook reconciliation | Avoided by using RC Web Billing (RC owns the webhook). We do not write Stripe webhook code. |

## Out of scope

- Mobile email sign-in (parallel ticket)
- Backlink / off-page SEO campaigns
- Programmatic blog / per-club / per-league SEO landings
- Gift subscriptions, promo codes, team accounts, family sharing
- Custom Stripe checkout UX
- Niche games (The Chain, Threads, Goalscorer Recall, Career Path Pro) until phase 1.5

## Open questions

None at design time. Questions to resolve at implementation:

1. RevenueCat Web Billing product IDs — set when we configure RC dashboard during phase 3.1.
2. Web rewarded-ad viability — verify during phase 3.2; if unavailable, drop that path.
3. Magic-link template + sender domain — set during phase 3.0.
