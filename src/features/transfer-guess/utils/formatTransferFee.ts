/**
 * Parses shorthand transfer fee strings and formats them as full currency values.
 *
 * Examples:
 *   "12m"   → "£12,000,000"
 *   "€80M"  → "€80,000,000"
 *   "500k"  → "£500,000"
 *   "Free"  → "FREE"
 *   "£12,000,000" → "£12,000,000" (passthrough)
 */

const CURRENCY_SYMBOLS = ['£', '€', '$'] as const;
const NON_NUMERIC_KEYWORDS = ['free', 'undisclosed', 'loan', 'swap', 'n/a'];

function formatWithCommas(n: number): string {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

export function formatTransferFee(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  // Check for non-numeric keywords
  if (NON_NUMERIC_KEYWORDS.includes(trimmed.toLowerCase())) {
    return trimmed.toUpperCase();
  }

  // Extract currency symbol (if present)
  let symbol = '£'; // default
  let rest = trimmed;

  for (const s of CURRENCY_SYMBOLS) {
    if (rest.startsWith(s)) {
      symbol = s;
      rest = rest.slice(s.length);
      break;
    }
  }

  // Already fully formatted (contains commas, no shorthand suffix)
  if (rest.includes(',') && !/[mkMK]\s*$/.test(rest)) {
    return `${symbol}${rest}`;
  }

  // Try to parse shorthand: e.g. "12m", "12.5M", "500k", "1.2K"
  const match = rest.match(/^([\d.]+)\s*([mkMK])?$/);
  if (!match) {
    // Can't parse — return as-is
    return trimmed;
  }

  const num = parseFloat(match[1]);
  if (isNaN(num)) return trimmed;

  const suffix = (match[2] ?? '').toLowerCase();
  let multiplier = 1;
  if (suffix === 'm') multiplier = 1_000_000;
  if (suffix === 'k') multiplier = 1_000;

  const fullValue = Math.round(num * multiplier);
  return `${symbol}${formatWithCommas(fullValue)}`;
}
