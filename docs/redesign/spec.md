Feature Spec: Gamified Home Screen Redesign 2.0

1. Objective

Redesign the main app/(tabs)/index.tsx screen to shift from a utility-list style to a gamified dashboard. The goal is to maximize engagement through completion bias (Daily Progress Ring), social proof (IQ Level), and urgency (Event Banners).

2. Design System Extensions (Home Specific)

Reference src/theme/home-design.ts for exact constants.

Typography:

Headers/Numbers: Bebas Neue

Labels/Body: Montserrat (SemiBold for labels, Regular for body)

Palette:

Background: Stadium Navy (#0F172A)

Primary Accent: Pitch Green (#58CC02)

Secondary Accent: Card Yellow (#FACC15)

Surface: Glass (rgba(255,255,255, 0.05) + Blur)

UI Patterns:

Chunky 3D Buttons: 4px vertical offset shadow (no blur).

Glass Cards: 1px border with 10% opacity white.

3. Key Components to Implement

A. The Header (HomeHeader.tsx)

Left: Brand Title "FOOTBALL IQ" (Bebas, 28px).

Right: Status Cluster.

Pro Badge: Yellow pill, 3D style. Action: Opens PremiumModal.

Streak: Fire icon + count (Glass style).

Remove: Coin currency (deprecated).

B. Daily Progress Hero (DailyProgressRing.tsx)

Visual: A large (140x140) circular progress indicator.

Logic:

Calculate completed / total from useDailyPuzzles.

If 0/4, show empty ring.

If 4/4, show full ring + "Complete" state (Confetti trigger?).

Tech: Use react-native-svg for the ring stroke and gradient.

C. Stats Dashboard (StatsGrid.tsx)

Two side-by-side glass cards:

Games Completed: Format "X / Y" (Total played vs Total available in DB).

Source: useUserStats or useArchivePuzzles count.

IQ Level: Dynamic Title (e.g., "Starting XI").

Logic: Map total XP/Score to a string rank.

D. Special Event Banner (EventBanner.tsx)

Visual: A distinct gradient card (Blue/Navy) inserted above the daily list.

Features:

"LIMITED TIME" tag.

Title & Subtitle.

"PLAY" button (3D style).

Logic:

Create a config/hook useSpecialEvent() that returns active event metadata.

If active, render banner. On press, navigate to that specific game route.

E. Game List (HomeGameList.tsx)

Replace DailyStackCard with a vertical list of GlassGameCard.

Card Structure:

Left: Icon Box (Glass, centered icon).

Center: Title (Bebas) + Desc (Montserrat).

Right: Circular "Play" button (Green, 3D).

Locked Game Card (Premium Upsell):

Condition: Displayed when a daily puzzle is a "Pro" offering and the user is on the Free tier.

Visual: Glass card with a lock icon overlay or distinct border color.

Actions:

"Watch Ad" (Gray 3D btn) -> Unlocks specific puzzle for one-time play.

"Go Pro" (Yellow 3D btn) -> Opens Premium Modal.

4. Implementation Steps (TDD Approach)

Phase 1: Logic & Hooks

Test: useDailyProgress.test.ts

Input: Array of puzzle statuses.

Output: Percentage integer and count string.

Test: useIQRank.test.ts

Input: Total score/games.

Output: Rank Title (e.g., < 10 "Bench Warmer", > 50 "Captain").

Test: useSpecialEvent.test.ts

Verify it returns null when no event is active, and correct object when active.

Phase 2: Component Development (Isolated)

Create src/features/home/components/new/ProgressRing.tsx.

Create src/features/home/components/new/EventBanner.tsx.

Create src/features/home/components/new/GlassGameCard.tsx.

Note: Ensure touchable areas are large enough (min 44px).

Phase 3: Integration

Refactor app/(tabs)/index.tsx.

Wrap content in SafeAreaView (careful with top inset for Header).

Connect "Watch Ad" button to AdUnlockService.

Connect "Go Pro" to PremiumModal.

5. Technical Constraints

Performance: Ensure the Gradient/Blur on the Glass cards does not drop FPS on Android. Use <BlurView> from expo-blur sparingly or fallback to semi-transparent colors on low-end devices if needed.

Responsiveness: Test on small screens (iPhone SE) to ensure the Progress Ring doesn't push the list off-screen.