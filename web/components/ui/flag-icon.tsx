import * as flags from "country-flag-icons/string/3x2";

/**
 * Home nation flag SVGs (GB-ENG, GB-SCT, GB-WLS, GB-NIR).
 * Not available in country-flag-icons, so we inline them.
 * All use viewBox 0 0 60 40 (3:2 aspect ratio).
 */
const HOME_NATION_SVGS: Record<string, string> = {
  "GB-ENG": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="100%" height="100%">
  <rect width="60" height="40" fill="#FFFFFF"/>
  <rect x="24" y="0" width="12" height="40" fill="#CE1124"/>
  <rect x="0" y="14" width="60" height="12" fill="#CE1124"/>
</svg>`,
  "GB-SCT": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="100%" height="100%">
  <rect width="60" height="40" fill="#005EB8"/>
  <path d="M0 0L60 40M60 0L0 40" stroke="#FFFFFF" stroke-width="6"/>
</svg>`,
  "GB-WLS": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="100%" height="100%">
  <rect width="60" height="20" fill="#FFFFFF"/>
  <rect y="20" width="60" height="20" fill="#00AB39"/>
  <path d="M20 10C22 8 26 6 30 8C32 6 36 6 38 8C40 6 42 8 42 12C42 16 38 20 34 22L30 28L26 22C22 20 18 16 18 12C18 10 19 9 20 10Z" fill="#D4351C"/>
</svg>`,
  "GB-NIR": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40" width="100%" height="100%">
  <rect width="60" height="40" fill="#FFFFFF"/>
  <path d="M0 0L60 40M60 0L0 40" stroke="#CE1124" stroke-width="5"/>
</svg>`,
};

const flagMap = flags as Record<string, string>;

function getFlagSvg(code: string): string | null {
  const upperCode = code.toUpperCase();

  // Check home nations first
  if (HOME_NATION_SVGS[upperCode]) {
    return HOME_NATION_SVGS[upperCode];
  }

  return flagMap[upperCode] ?? null;
}

interface FlagIconProps {
  code: string;
  size?: number;
  className?: string;
}

export function FlagIcon({ code, size = 20, className }: FlagIconProps) {
  const svg = getFlagSvg(code);
  if (!svg) return null;

  const width = Math.round(size * 1.5);

  return (
    <span
      className={className}
      style={{ width, height: size, display: "inline-block", borderRadius: 2, overflow: "hidden" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
