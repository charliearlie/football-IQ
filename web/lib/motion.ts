/**
 * Motion primitives — CSS-class-based variants used across the web app.
 *
 * We use Tailwind's animate utilities + tailwindcss-animate plugin rather
 * than framer-motion to keep the bundle small. Each variant returns a
 * className string ready to be applied.
 *
 * Always respect prefers-reduced-motion (handled by Tailwind via the
 * `motion-safe:` and `motion-reduce:` modifiers — apply animation classes
 * with `motion-safe:` when they would distract or cause vestibular issues).
 */

export const motionClasses = {
  fadeUp: "motion-safe:animate-[fade-in-up_0.4s_ease-out_forwards] opacity-0",
  fadeIn: "motion-safe:animate-[pulse_0s_forwards] opacity-0",
  popIn: "motion-safe:animate-pop-in",
  bounceIn: "motion-safe:animate-bounce-in",
  shimmer: "motion-safe:animate-shimmer",
  press: "active:scale-[0.97] transition-transform duration-150",
  hoverLift:
    "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated",
  hoverGlow:
    "transition-all duration-200 hover:shadow-glow-green hover:border-pitch-green/40",
} as const;

/** Stagger child entrance using inline style delays. */
export function staggerDelay(index: number, base = 60): React.CSSProperties {
  return { animationDelay: `${index * base}ms` };
}

/**
 * Inline style for the "snap" easing curve used on premium entrance moments.
 * Use when Tailwind's defaults don't read tactile enough.
 */
export const snapEase = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Detect reduced-motion preference at runtime. Falls back to false during SSR.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
