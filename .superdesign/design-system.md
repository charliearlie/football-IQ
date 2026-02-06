# Football IQ Mobile Design System

## Platform
- React Native (Expo)
- Mobile-first design
- Dark theme

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Pitch Green | #58CC02 | Primary actions, success, connectors |
| Grass Shadow | #46A302 | 3D button shadows |
| Stadium Navy | #0F172A | Main background |
| Floodlight White | #F8FAFC | Primary text |
| Card Yellow | #FACC15 | Highlights, goal badge |
| Red Card | #EF4444 | Errors, danger |
| Warning Orange | #FF4D00 | Sacrifice actions |
| Amber | #F59E0B | Costly actions |
| Glass Background | rgba(255, 255, 255, 0.05) | Card backgrounds |
| Glass Border | rgba(255, 255, 255, 0.1) | Card borders |
| Text Secondary | rgba(248, 250, 252, 0.7) | Muted text |

## Typography

| Style | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| h1 | Bebas Neue | 32px | Regular | Game titles |
| h2 | Bebas Neue | 24px | Regular | Section headers |
| h3 | Bebas Neue | 20px | Regular | Small headers |
| subtitle | Montserrat | 18px | SemiBold (600) | Labels |
| body | Montserrat | 16px | Regular (400) | Primary text |
| bodySmall | Montserrat | 14px | Regular (400) | Secondary text |
| caption | Montserrat | 12px | Regular (400) | Hints, labels |
| button | Bebas Neue | 18px | Regular | Button text, UPPERCASE |

## Spacing Scale (4px base)

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |

## Border Radius

| Token | Value |
|-------|-------|
| sm | 4px |
| md | 8px |
| lg | 12px |
| xl | 16px |
| 2xl | 24px |
| full | 9999px |

## Component Patterns

### Glass Card
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 12px;
```

### 3D Elevated Button
- Top layer: Primary color (#58CC02)
- Bottom layer: Darker shade (#46A302), offset 8px down
- On press: Top layer translates down

### Badges
- Small pill shape
- Background: semantic color
- Text: Stadium Navy (#0F172A)
- Font: Bebas Neue, 10-12px, UPPERCASE

### Connector Lines
- Width: 2px
- Color: Pitch Green (#58CC02) for connected
- Color: Text Secondary for pending (dashed)

### Step Number Badges
- Circle: 22px diameter
- Background: Pitch Green
- Text: Stadium Navy, Bebas Neue, 12px
