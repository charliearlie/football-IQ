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

        // Fun trivia accent colors
        "coral": "#FF6B6B",
        "teal": "#4ECDC4",
        "purple-pop": "#9B59B6",
        "sky-blue": "#3B82F6",

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
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(88, 204, 2, 0.4)" },
          "50%": { boxShadow: "0 0 40px rgba(88, 204, 2, 0.8)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-20px) translateX(10px)" },
          "66%": { transform: "translateY(10px) translateX(-10px)" },
        },
        "drift": {
          "0%": { transform: "translateY(100vh) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(360deg)", opacity: "0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
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
        "wiggle": "wiggle 0.5s ease-in-out infinite",
        "confetti-fall": "confetti-fall 3s linear forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "drift": "drift 15s linear infinite",
        "gradient-shift": "gradient-shift 6s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
