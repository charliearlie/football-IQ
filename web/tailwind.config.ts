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
        // Football IQ V2 Primary Palette
        "stadium-navy": "#05050A",
        "pitch-green": "#2EFC5D",
        "grass-shadow": "#1A9E38",
        "floodlight": "#FFFFFF",
        "card-yellow": "#FACC15",
        "red-card": "#EF4444",
        "warning-orange": "#FF4D00",
        "amber": "#F59E0B",
        "gold-primary": "#FFD700",
        "gold-shadow": "#B8960F",
        "accent-blue": "#00E5FF",
        "danger-red": "#FF3366",

        // Fun trivia accent colors
        "coral": "#FF6B6B",
        "teal": "#4ECDC4",
        "purple-pop": "#9B59B6",
        "sky-blue": "#3B82F6",

        // Semantic color mapping for shadcn/ui
        background: "#05050A",
        foreground: "#FFFFFF",
        card: {
          DEFAULT: "rgba(255, 255, 255, 0.03)",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#0E121A",
          foreground: "#FFFFFF",
        },
        primary: {
          DEFAULT: "#2EFC5D",
          foreground: "#05050A",
        },
        secondary: {
          DEFAULT: "#0E121A",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#0E121A",
          foreground: "rgba(255, 255, 255, 0.6)",
        },
        accent: {
          DEFAULT: "#FACC15",
          foreground: "#05050A",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        border: "rgba(255, 255, 255, 0.08)",
        input: "rgba(255, 255, 255, 0.08)",
        ring: "#2EFC5D",
      },
      fontFamily: {
        bebas: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
        sans: ["var(--font-outfit)", "Outfit", "system-ui", "sans-serif"],
        mono: ["var(--font-space-grotesk)", "Space Grotesk", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      backdropBlur: {
        glass: "10px",
      },
      boxShadow: {
        glow: "0 0 15px rgba(46, 252, 93, 0.3)",
        "glow-strong": "0 0 20px rgba(46, 252, 93, 0.15)",
        "card-depth": "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
        "3d-tile": "0 6px 0 #05050A",
        "3d-tile-pressed": "0 0 0 #05050A",
        "3d-green": "0 6px 0 #1A9E38",
        "3d-green-pressed": "0 0 0 #1A9E38",
        // 2026 design uplift surfaces
        card: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px -12px rgba(0,0,0,0.5)",
        elevated:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 48px -16px rgba(0,0,0,0.6)",
        "glow-green":
          "0 0 0 1px rgba(46,252,93,0.3), 0 8px 32px -8px rgba(46,252,93,0.4)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
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
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(15px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        merge: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(46, 252, 93, 0.7)" },
          "70%": { boxShadow: "0 0 0 10px rgba(46, 252, 93, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(46, 252, 93, 0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shake: "shake 0.5s ease-in-out",
        glint: "glint 0.7s ease-out",
        pulse: "pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "confetti-fall": "confetti-fall 3s linear forwards",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        merge: "merge 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pop-in": "pop-in 0.3s ease-out forwards",
        "pulse-ring": "pulse-ring 2s infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
