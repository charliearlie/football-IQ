Football IQ Design System: "The Digital Pitch"

1. Visual Philosophy

The app should feel like a high-end sports game mixed with the playfulness of Duolingo. We avoid "flat" design in favor of "pressable" elements that feel tactile.

2. Color Palette

Pitch Green (Primary): #58CC02 (Vibrant, action-oriented)

Grass Shadow: #46A302 (For button elevation and depth)

Stadium Navy (Background): #0F172A (Deep, high-contrast background)

Floodlight White: #F8FAFC (Text and primary surface color)

Card Yellow: #FACC15 (For alerts, Career Path clues, and highlights)

Red Card: #EF4444 (For errors and incorrect guesses)

3. Typography

Headlines: Bebas Neue (Strong, athletic, condensed)

Sub-headings: Inter Bold (Clean, modern)

Body: Inter Regular (High legibility)

4. UI Components & "Elevated" Style

The "Action Button" (The pressable feel)

Style: Neubrutalist 3D.

Construction: \* Top Layer: Pitch Green.

Bottom Layer (Shadow): Grass Shadow (Offset by 4px-6px).

Interaction: On pressIn, the top layer translates Y by 4px to meet the shadow, creating a physical "click" sensation.

Border: 2px Solid Stadium Navy.

Corner Radius: 16px (Friendly, not sharp).

The "Glass Card"

Style: Blurred transparency for game containers.

Properties: background: rgba(255, 255, 255, 0.05), backdrop-filter: blur(10px), border: 1px solid rgba(255, 255, 255, 0.1).

5. Animation Guidelines

Reveals: Use a "Spring" animation (stiffness: 100, damping: 10) for clue entries.

Feedback: Haptic feedback on every successful guess or button press.

Transitions: Layout animations when a clue is revealed to push other content down smoothly.

6. Icons

Source: Lucide React (clean, consistent).

Weight: 2px stroke width for a "bold" look.
