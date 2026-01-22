# AI Scout Feature

**Date:** 2026-01-21
**Status:** Implemented
**Feature:** Career Path AI Scout

## Overview

The AI Scout feature automates the extraction of footballer career data from Wikipedia articles. It uses the MediaWiki API to fetch raw wikitext and OpenAI's gpt-4o model to parse and structure the data into the `CareerPathContent` format used by the game.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Career Path Form (career-path-form.tsx)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [Wikipedia URL Input] [Scout Player Button]              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Server Action: scoutPlayerCareer() (actions.ts)          │  │
│  │  - Validates Wikipedia URL format                         │  │
│  │  - Calls AI service (server-side only)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AI Service: career-scout.ts                              │  │
│  │  1. Extract page title from URL                           │  │
│  │  2. Fetch wikitext from MediaWiki API                     │  │
│  │  3. Send to OpenAI gpt-4o for extraction                  │  │
│  │  4. Validate response against source (anti-hallucination) │  │
│  │  5. Return typed CareerScoutResult                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `web/lib/ai/career-scout.ts` | Core AI service - Wikipedia fetch + OpenAI extraction |
| `web/app/(dashboard)/calendar/actions.ts` | Server action `scoutPlayerCareer()` |
| `web/components/puzzle/forms/career-path-form.tsx` | UI integration with Scout section |
| `web/types/ai.ts` | Type definitions for scout results |
| `web/.env.local` | `OPENAI_API_KEY` environment variable |

## API Choices

### MediaWiki API (Wikipedia)
- **Why:** More reliable than HTML scraping, provides raw wikitext
- **Endpoint:** `https://en.wikipedia.org/w/api.php`
- **Parameters:** `action=query`, `prop=revisions`, `rvprop=content`
- **Format:** JSON with `formatversion=2`

### OpenAI gpt-4o
- **Why:** Best balance of capability and speed for structured extraction
- **Temperature:** `0.2` (low for factual accuracy over creativity)
- **Response format:** JSON mode with structured output
- **Max tokens:** ~15,000 chars of wikitext (to stay within limits)

## Anti-Hallucination Measures

1. **Source Verification:** Each extracted club name is checked against the source wikitext
2. **Explicit Instructions:** System prompt emphasizes "ONLY data from source"
3. **Confidence Scoring:** Three-tier system (high/medium/low)
4. **Visual Indicators:** Low-confidence items highlighted with red border in UI
5. **Manual Review:** All data editable before saving to database

## Confidence Scoring

| Level | Criteria | UI Indicator |
|-------|----------|--------------|
| High | All data (years, apps, goals) clearly stated in source | Green dot |
| Medium | Some data inferred or partially stated | Yellow dot |
| Low | Data is ambiguous, incomplete, or could not be verified | Red dot + red border |

## Trivia Generation

The AI generates one factual trivia insight per major club:
- Must be based on facts mentioned in the source Wikipedia article
- Player name is anonymized as "[The Player]"
- Example: "[The Player] won two Champions League titles during this spell"
- Set to `null` for short stints or when no notable achievements found

## Security Considerations

1. **Server-side only:** `OPENAI_API_KEY` has no `NEXT_PUBLIC_` prefix
2. **URL validation:** Server action validates Wikipedia URL format before processing
3. **Dynamic import:** AI service is dynamically imported to ensure server-side execution
4. **No client exposure:** All API calls happen in server actions

## Usage

1. Open Career Path editor in CMS
2. Paste Wikipedia URL in "Scout with AI" section
3. Click "Scout Player" button
4. Review populated data (check confidence indicators)
5. Edit any fields as needed
6. Save to database

## Example

**Input:** `https://en.wikipedia.org/wiki/Andrea_Pirlo`

**Output:**
```json
{
  "answer": "Andrea Pirlo",
  "career_steps": [
    { "type": "club", "text": "Brescia", "year": "1995-1998", "apps": 59, "goals": 6, "confidence": "high" },
    { "type": "loan", "text": "Inter Milan", "year": "1998-1999", "apps": 22, "goals": 0, "confidence": "high" },
    { "type": "loan", "text": "Reggina", "year": "1999-2001", "apps": 47, "goals": 6, "confidence": "high" },
    { "type": "club", "text": "AC Milan", "year": "2001-2011", "apps": 284, "goals": 32, "trivia": "[The Player] won two Champions League titles and two Serie A titles", "confidence": "high" },
    { "type": "club", "text": "Juventus", "year": "2011-2015", "apps": 118, "goals": 10, "trivia": "[The Player] won four consecutive Serie A titles", "confidence": "high" },
    { "type": "club", "text": "New York City FC", "year": "2015-2017", "apps": 62, "goals": 1, "confidence": "high" }
  ]
}
```

## Future Improvements

1. **Caching:** Cache Wikipedia wikitext to reduce API calls
2. **Batch processing:** Allow scouting multiple players at once
3. **Alternative sources:** Support other football databases (Transfermarkt, etc.)
4. **Rate limiting:** Add rate limiting for OpenAI API calls
5. **Source linking:** Store Wikipedia URL as `source` field in puzzle
