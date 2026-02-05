# Football IQ Web Routes

## App Router Structure (Next.js 15)

```
web/app/
├── page.tsx                    # Landing page (/)
├── layout.tsx                  # Root layout with fonts
├── globals.css                 # Global styles
├── privacy/page.tsx            # Privacy policy (/privacy)
├── terms/page.tsx              # Terms of service (/terms)
├── download/page.tsx           # Download redirect (/download)
└── (dashboard)/                # CMS/Admin routes (route group)
    ├── layout.tsx              # Dashboard layout
    ├── calendar/page.tsx       # Puzzle calendar
    ├── player-scout/page.tsx   # Player search
    └── admin/                  # Admin tools
        └── grid-sandbox/page.tsx
```

## Landing Page Route

**Path:** `/`
**File:** `web/app/page.tsx`
**Type:** Server Component with ISR (revalidate: 3600)

### Data Fetching
- Fetches today's Career Path puzzle from Supabase
- Falls back to FALLBACK_CAREER_PUZZLE constant

### Sections (by anchor)
- `#features` → GameModeShowcase
- `#database` → FeatureSection
- `#demo` → PlayableCareerPath

## Static Pages

**Privacy Policy:** `/privacy`
**Terms of Service:** `/terms`
**Download:** `/download` (redirect to app stores)
