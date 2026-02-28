Football IQ Design System v2: "The Premium Pitch"

1. Visual Philosophy

The app abandons flat, corporate utility design in favor of a premium, modern sports gaming aesthetic (inspired by EA Sports FC, Sorare, and high-end broadcast graphics). The design relies on deep, near-OLED dark themes paired with vibrant neon accents and highly tactile, physical "squish" mechanics for all interactive elements.

2. Color Palette

Base Theme (Ultra Premium Dark):

Pitch Black (App Background): #05050A (Deeper than navy, near OLED black)

Surface Panel (Elevated Cards): #0E121A

Glass Border (Subtle Structure): rgba(255, 255, 255, 0.08)

Glass Panel (Frosted Elements): rgba(255, 255, 255, 0.03) with backdrop-filter blur.

Text Colors:

Pure White (Primary): #FFFFFF

Muted Slate (Secondary): #A0ABC0

Action & Accent Colors (Neon & Gold):

Neon Green (Primary Action/Correct): #2EFC5D

Shadow/3D Base: #1A9E38

Glow: rgba(46, 252, 93, 0.3)

Gold (Premium/Unlock/Reveal): #FFD700

Shadow/3D Base: #B39700

Danger Red (Errors/Give Up): #FF3366

Accent Blue (Secondary Highlights): #00E5FF

3. Typography: The "Triple-Type" System

We use three specific fonts to separate hierarchy and inject sports personality.

Bebas Neue (The Broadcaster):

Usage: Top-level page titles (e.g., "CAREER PATH PRO"), primary button text ("SUBMIT"), large numbers on grid cards.

Styling: Always uppercase. Letter-spacing 1px to 2px.

Outfit (The Modern UI):

Usage: All standard UI, body text, subheadings, and input fields.

Weights: 400 (Body), 600 (Sub-labels), 700/800 (Pills/Tags).

Space Grotesk (The Data Display):

Usage: Specific for stats, scores, timers, and game progression numbers (e.g., "3 of 5", "15:30:00").

4. UI Components & "Tactile" Mechanics

We rely entirely on CSS box-shadow to create physical depth, moving away from heavy thick borders.

The Universal "Squish" Button/Card

Concept: Interactive elements look like physical, elevated keys that compress flat into the UI when pressed.

Default State:

Shape is clean with a hard drop-shadow. Example: box-shadow: 0 4px 0 rgba(0,0,0,0.5) for dark buttons, or 0 6px 0 #1A9E38 for green primary buttons.

Active State (:active / onPressIn):

Element moves down to eat the shadow: transform: translateY(4px).

Shadow disappears: box-shadow: 0 0 0 transparent.

Transition: 0.1s cubic-bezier(0.4, 0, 0.2, 1) for a snappy recoil.

Grid Cards (Connections Mode)

Square ratio, slight linear gradient background (rgba(255,255,255,0.08) to 0.02).

Unselected: Grey elevation (box-shadow: 0 6px 0 rgba(0,0,0,0.6)).

Selected: Depressed state (transform applied), border turns Neon Green, text turns Neon Green, subtle background tint (rgba(46, 252, 93, 0.15)).

Glassmorphism & Glows

Locked game states or inactive panels use translucent backgrounds with slight borders to look like frosted glass.

Active/Current states (like the current clue in Career Path) use box-shadow: 0 0 20px rgba(46, 252, 93, 0.1) to emit an ambient glow.

5. Icons

Library: Lucide React

Styling: Stroke width generally 2px or 2.5px. Scale appropriately (e.g., 14px for small tags, 24px for headers).