# Football IQ Mobile Design System

## Platform
- React Native (Expo SDK 52, RN 0.76)
- Mobile-first design
- Dark theme — Premium Sports Game aesthetic

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Pitch Green | #58CC02 | Primary actions, success |
| Grass Shadow | #46A302 | 3D button shadows |
| Stadium Navy | #0F172A | App background |
| Surface | #1E293B | Card/surface backgrounds |
| Floodlight White | #F8FAFC | Primary text |
| Text Secondary | #94A3B8 | Muted/secondary text |
| Card Yellow | #FACC15 | Highlights, accents |
| Yellow Shadow | #CA8A04 | 3D yellow button shadows |
| Red Card | #EF4444 | Errors, danger |
| Warning Orange | #FF4D00 | Sacrifice actions |
| Amber | #F59E0B | Costly actions |
| Border | rgba(255, 255, 255, 0.08) | Subtle card borders |
| Shadow Dark | rgba(0, 0, 0, 0.4) | Card squish shadows |

## Typography

Two-font system: **Bebas Neue** for display, **Inter** for everything else.

### Bebas Neue (Display Only)
Used EXCLUSIVELY for: page headers, game mode titles on cards, large scores.

| Style | Size | Usage |
|-------|------|-------|
| h1 | 32px | Page titles ("HOME", "ARCHIVE") |
| h2 | 24px | Section headers |
| h3 | 20px | Small headers, game mode titles |

### Inter (Body + UI)
Used for everything else. Use weights 600, 700, 800 heavily.

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| subtitle | 18px | Bold (700) | Labels, emphasis |
| body | 16px | Regular (400) | Primary text |
| bodySmall | 14px | Regular (400) | Secondary text |
| caption | 12px | Regular (400) | Hints, labels |
| button | 16px | ExtraBold (800) | Button text, UPPERCASE |
| buttonLarge | 18px | ExtraBold (800) | Large buttons |
| buttonSmall | 14px | Bold (700) | Small buttons |

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

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Subtle rounding |
| md | 8px | Default |
| lg | 12px | Medium |
| xl | 16px | Inner elements, buttons |
| 2xl | 20px | Main layout cards |
| 3xl | 24px | Largest cards |
| full | 9999px | Pills, circles |

## Component Patterns

### Squish Button (ElevatedButton)
Tactile 3D press effect using dual-layer "Solid Layer" architecture:
- Bottom layer: Fixed, darker shade (shadow)
- Top layer: Animated translateY on press (face)
- NO thick borders — clean shadow-only depth
- Depth: 4px (standard), 3px (small), 5px (large)
- Spring animation with haptic feedback

```
Default:  [face] sits 4px above [shadow]
Pressed:  [face] translates down 4px, covering [shadow]
```

### Squish Card (SquishCard)
Same dual-layer architecture for pressable cards:
- Background: #1E293B (Surface)
- Border: 1px rgba(255, 255, 255, 0.08)
- Shadow: rgba(0, 0, 0, 0.4), 3px depth
- Border radius: 20px
- Haptic feedback on press

### Badges
- Small pill shape
- Background: semantic color
- Text: Stadium Navy (#0F172A)
- Font: Inter 700, 10-12px, UPPERCASE

### Connector Lines
- Width: 2px
- Color: Pitch Green (#58CC02) for connected
- Color: Text Secondary (#94A3B8) for pending (dashed)

### Icons
- Library: lucide-react-native
- Stroke width: 2px for bold appearance
