# Football IQ Theme Configuration

## Framework
- Next.js 15 (App Router)
- Tailwind CSS with tailwindcss-animate plugin
- shadcn/ui components

## Tailwind Config (web/tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Football IQ Primary Palette
        "stadium-navy": "#0F172A",
        "pitch-green": "#58CC02",
        "grass-shadow": "#46A302",
        "floodlight": "#F8FAFC",
        "card-yellow": "#FACC15",
        "red-card": "#EF4444",
        "warning-orange": "#FF4D00",
        "amber": "#F59E0B",

        // Semantic color mapping for shadcn/ui
        background: "#0D1722",
        foreground: "#F8FAFC",
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.05)",
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        primary: {
          DEFAULT: "#58CC02",
          foreground: "#0F172A",
        },
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "rgba(248, 250, 252, 0.6)",
        },
        accent: {
          DEFAULT: "#FACC15",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#F8FAFC",
        },
        border: "rgba(255, 255, 255, 0.1)",
        input: "rgba(255, 255, 255, 0.1)",
        ring: "#58CC02",
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      backdropBlur: {
        glass: "10px",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        glint: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        shake: "shake 0.5s ease-in-out",
        glint: "glint 0.7s ease-out",
        pulse: "pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

## Global CSS (web/app/globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 9%;
    --foreground: 210 40% 98%;
    --card: 0 0% 100% / 0.05;
    --card-foreground: 210 40% 98%;
    --popover: 217 33% 17%;
    --popover-foreground: 210 40% 98%;
    --primary: 99 98% 40%;
    --primary-foreground: 222 47% 11%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 210 40% 98% / 0.6;
    --accent: 48 96% 53%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 0 0% 100% / 0.1;
    --input: 0 0% 100% / 0.1;
    --ring: 99 98% 40%;
    --radius: 8px;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: "Inter", system-ui, sans-serif;
  }
}

@layer components {
  .glass-card {
    @apply bg-white/5 backdrop-blur-[10px] border border-white/10 rounded-xl;
  }

  .data-row {
    @apply border-b border-white/5 hover:bg-white/5 transition-colors;
  }

  .status-dot {
    @apply w-2.5 h-2.5 rounded-full;
  }

  .status-dot-success {
    @apply bg-pitch-green shadow-[0_0_6px_rgba(88,204,2,0.5)];
  }

  .status-dot-empty {
    @apply bg-red-card/60;
  }

  .status-dot-draft {
    @apply bg-card-yellow;
  }
}

@layer utilities {
  .text-gradient {
    @apply bg-gradient-to-r from-pitch-green to-card-yellow bg-clip-text text-transparent;
  }

  .glow-green {
    box-shadow: 0 0 20px rgba(88, 204, 2, 0.3);
  }

  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-pitch-green focus:ring-offset-2 focus:ring-offset-stadium-navy;
  }
}
```

## Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Pitch Green | #58CC02 | Primary actions, success states |
| Stadium Navy | #0F172A | Backgrounds |
| Floodlight White | #F8FAFC | Primary text |
| Card Yellow | #FACC15 | Highlights, warnings, accents |
| Red Card | #EF4444 | Errors, destructive actions |
| Grass Shadow | #46A302 | Button shadows, depth |

## Typography
- Headlines: Bebas Neue (font-bebas)
- Body: Inter (font-sans)

## Core Visual Effects
- Glass morphism: `glass-card` utility class
- 3D buttons: Shadow-based depth with active state press
- Float animation: Gentle vertical movement
- Glint animation: Shine effect across buttons
