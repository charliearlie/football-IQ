# Football Quiz Platform: Tech Stack & Engineering Guide

Version: 1.0
Purpose: This document provides a definitive guide to the Football Quiz Platform technology stack and engineering practices. It is intended to be used by all developers, including AI coding assistants, to ensure consistency, quality, and adherence to our chosen architecture.

## 1. Core Philosophy

Our technology choices are guided by three principles:

**Gaming Performance**: We prioritize real-time responsiveness, smooth animations, and instant feedback essential for an engaging quiz experience. Our stack is optimized for low latency and high interactivity.

**SEO & Monetization**: We need excellent SEO for content discovery and flexible monetization options. Server-side rendering and dynamic content generation are crucial for topical quizzes and player profiles.

**Rapid Iteration**: We use a modern TypeScript stack with excellent DX to ship features quickly, test new game modes, and respond to trending football events with topical quizzes.

## 2. Core Technology Stack

| Category      | Technology    | Version / Spec      | Key Usage                                                     |
| ------------- | ------------- | ------------------- | ------------------------------------------------------------- |
| Framework     | Next.js       | 15+ (App Router)    | Full-stack development with RSC, API routes, SEO optimization |
| Language      | TypeScript    | 5+                  | End-to-end type safety                                        |
| Database      | Neon          | Serverless Postgres | PostgreSQL with generous free tier, branching, autoscaling    |
| ORM           | Drizzle       | Latest              | Type-safe, performant ORM with excellent DX                   |
| Caching       | Upstash Redis | Serverless          | Leaderboards, session data, rate limiting                     |
| Auth          | Clerk         | Latest              | User authentication with social logins                        |
| Styling       | Tailwind CSS  | 4.0                 | Utility-first CSS matching our design system                  |
| UI Components | Shadcn/ui     | Latest              | Consistent, accessible React components                       |
| Animations    | Framer Motion | 11+                 | Smooth animations for game interactions                       |
| Real-time     | Pusher        | Latest              | Live quiz features, multiplayer modes                         |
| Payments      | Stripe        | Latest SDK          | Premium subscriptions, in-app purchases                       |
| Analytics     | PostHog       | Cloud               | User behavior, A/B testing, feature flags                     |
| Deployment    | Vercel        | -                   | Hosting, CI/CD, Edge Functions                                |
| CDN/Images    | Cloudinary    | Free tier           | Team badges, player images optimization                       |
| Email         | Resend        | Latest              | Transactional emails for achievements                         |

## 3. Detailed Architecture & Patterns

### 3.1. Database Architecture: Neon + Drizzle

**Why Neon?**

- Generous free tier: 0.5 GB storage, perfect for starting
- Serverless PostgreSQL with instant branching
- Autoscaling and connection pooling built-in
- Works perfectly with Vercel's serverless functions

**Schema Design Principles:**

```typescript
// Example schema with Drizzle
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(), // For SEO URLs
  currentClub: varchar("current_club", { length: 255 }),
  nationality: varchar("nationality", { length: 100 }),
  position: varchar("position", { length: 50 }),
  metadata: jsonb("metadata"), // Flexible data storage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  gameMode: varchar("game_mode", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  timeElapsed: integer("time_elapsed"), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
  metadata: jsonb("metadata"), // Store answers, hints used, etc.
});
```

### 3.2. Caching Strategy: Upstash Redis

**Key Patterns:**

```typescript
// Leaderboard caching
const LEADERBOARD_KEY = "leaderboard:global:daily";
const CACHE_TTL = 60; // 1 minute for real-time feel

// Player search caching for autocomplete
const PLAYER_SEARCH_PREFIX = "search:player:";

// Rate limiting for API calls
const RATE_LIMIT_KEY = `rate_limit:${userId}:${endpoint}`;
```

### 3.3. Real-time Features: Pusher

For multiplayer quiz battles and live features:

```typescript
// Channel structure
const CHANNEL_PATTERNS = {
  globalLeaderboard: "presence-global-leaderboard",
  quizBattle: `private-quiz-battle-${battleId}`,
  liveEvent: `public-live-${eventId}`,
};
```

### 3.4. SEO & Content Strategy

**Dynamic Routes for SEO:**

```
/players/[slug] - Player profiles with quiz links
/clubs/[slug] - Club pages with related quizzes
/quizzes/[category]/[slug] - Individual quiz pages
/transfers/[year] - Transfer quiz archives
/news/[slug] - Topical quiz announcements
```

**Metadata Generation:**

```typescript
export async function generateMetadata({ params }) {
  const player = await getPlayer(params.slug);
  return {
    title: `${player.name} Quiz - Test Your Knowledge`,
    description: `Can you guess ${player.name}'s career path? Play now!`,
    openGraph: {
      images: [player.imageUrl],
    },
  };
}
```

### 3.5. Game State Management

**Client State (Zustand):**

```typescript
interface GameStore {
  currentQuestion: number;
  score: number;
  timeRemaining: number;
  hintsUsed: number;
  answers: Record<number, string>;
  // Actions
  submitAnswer: (answer: string) => void;
  useHint: () => void;
  nextQuestion: () => void;
}
```

**Server State (TanStack Query):**

```typescript
// Prefetch on server, hydrate on client
const { data: leaderboard } = useQuery({
  queryKey: ["leaderboard", gameMode],
  queryFn: fetchLeaderboard,
  staleTime: 60 * 1000, // 1 minute
  refetchInterval: 60 * 1000,
});
```

## 4. Engineering Best Practices

### 4.1. API Design

**Route Structure:**

```
/api/quiz/start - POST - Start new quiz session
/api/quiz/submit - POST - Submit answer
/api/quiz/complete - POST - Complete quiz, calculate score
/api/leaderboard/[mode] - GET - Fetch leaderboard
/api/players/search - GET - Autocomplete search
/api/topical/generate - POST - Generate topical quiz (admin)
```

### 4.2. Error Handling & Logging

```typescript
// Consistent error responses
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

// Wrap all API routes
export const withErrorHandler = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Log to PostHog
      captureException(error);
      // Return user-friendly error
    }
  };
};
```

### 4.3. Performance Optimizations

1. **Image Optimization:**

   - Use Cloudinary for all player/club images
   - Implement lazy loading for image-heavy pages
   - Generate responsive image sets

2. **Bundle Optimization:**

   - Code split by route
   - Lazy load game components
   - Tree shake Framer Motion imports

3. **Database Optimization:**
   - Index frequently queried columns (slug, userId)
   - Use database views for complex leaderboard queries
   - Implement cursor-based pagination

## 5. Instructions for AI Coding Assistants

When generating code for the Football Quiz Platform, you MUST adhere to the following rules:

1. **Use Only Listed Technologies**: Reference only the technologies in the table above. Do not suggest alternatives without explicit approval.

2. **Database Queries**: Use Drizzle ORM for all database interactions. Follow the type-safe patterns and avoid raw SQL unless necessary.

3. **Styling Consistency**:

   - Use only Tailwind CSS classes from our globals.css
   - ALWAYS use gradient buttons for primary CTAs: `btn-gradient-primary`
   - Follow the design system color variables

4. **Component Structure**:

   - Build all UI using shadcn/ui as base components
   - Add Framer Motion for animations on game interactions
   - Ensure all interactive elements have proper hover states

5. **State Management**:

   - Server state: TanStack Query with proper caching strategies
   - Client state: Zustand for game state
   - Form state: React Hook Form with zod validation

6. **API Patterns**:

   - All API routes must return consistent error/success formats
   - Implement rate limiting using Upstash Redis
   - Use tRPC for type-safe API calls

7. **Performance First**:

   - Implement React.lazy() for route-based code splitting
   - Use next/dynamic for heavy game components
   - Prefetch data on server when possible

8. **SEO Requirements**:

   - Every page must have proper meta tags
   - Use semantic HTML structure
   - Implement JSON-LD for rich snippets

9. **Testing Approach**:

   - Write E2E tests for critical game flows
   - Unit test scoring algorithms
   - Test API endpoints with MSW

10. **Security**:
    - Validate all user inputs with zod
    - Implement CSRF protection
    - Rate limit all API endpoints
    - Sanitize user-generated content

By following these guidelines, you will help build a performant, scalable, and maintainable football quiz platform that delivers an exceptional user experience.

## 6. Development Workflow

### Local Development Setup:

```bash
# Environment variables needed
DATABASE_URL=          # Neon connection string
UPSTASH_REDIS_REST_URL=    # Redis connection
UPSTASH_REDIS_REST_TOKEN=  # Redis auth token
CLERK_SECRET_KEY=     # Auth secret
PUSHER_APP_ID=        # Real-time features
STRIPE_SECRET_KEY=    # Payments
```

### Branch Strategy:

- `main` - Production branch
- `develop` - Staging branch
- `feature/*` - Feature branches
- `hotfix/*` - Urgent fixes for topical content

### Database Migrations:

```bash
# Create new migration
pnpm drizzle-kit generate:pg

# Apply migrations
pnpm drizzle-kit push:pg

# Create database snapshot before major changes
neon branches create --name pre-migration-backup
```
