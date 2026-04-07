/**
 * Feedback logic for Who's That?
 *
 * Generates colour-coded attribute feedback for each guess,
 * following standard Wordle-style rules:
 *   green  = exact match
 *   yellow = close (same continent / same position category / within 2 years)
 *   red    = wrong
 */

import { WhosThatContent, FeedbackColor, AttributeFeedback, GuessFeedback } from '../types/whosThat.types';
import { nationalityCodeToName } from './nationalities';

// =============================================================================
// CONTINENT MAP (nationality → continent)
// =============================================================================

const CONTINENT_MAP: Record<string, string> = {
  // Europe
  England: 'Europe',
  France: 'Europe',
  Germany: 'Europe',
  Spain: 'Europe',
  Italy: 'Europe',
  Portugal: 'Europe',
  Netherlands: 'Europe',
  Belgium: 'Europe',
  Croatia: 'Europe',
  Serbia: 'Europe',
  Scotland: 'Europe',
  Wales: 'Europe',
  Poland: 'Europe',
  Denmark: 'Europe',
  Sweden: 'Europe',
  Norway: 'Europe',
  Switzerland: 'Europe',
  Austria: 'Europe',
  'Czech Republic': 'Europe',
  Turkey: 'Europe',
  Ukraine: 'Europe',
  'Republic of Ireland': 'Europe',
  Greece: 'Europe',
  Hungary: 'Europe',
  Slovakia: 'Europe',
  Slovenia: 'Europe',
  Finland: 'Europe',
  Romania: 'Europe',
  Bulgaria: 'Europe',
  Albania: 'Europe',
  'North Macedonia': 'Europe',
  Bosnia: 'Europe',
  Montenegro: 'Europe',
  Kosovo: 'Europe',
  Iceland: 'Europe',
  'Northern Ireland': 'Europe',
  Luxembourg: 'Europe',

  // South America
  Brazil: 'South America',
  Argentina: 'South America',
  Colombia: 'South America',
  Uruguay: 'South America',
  Chile: 'South America',
  Ecuador: 'South America',
  Paraguay: 'South America',
  Peru: 'South America',
  Venezuela: 'South America',
  Bolivia: 'South America',

  // Africa
  Nigeria: 'Africa',
  Senegal: 'Africa',
  Ghana: 'Africa',
  Cameroon: 'Africa',
  Egypt: 'Africa',
  Morocco: 'Africa',
  Algeria: 'Africa',
  'Ivory Coast': 'Africa',
  Tunisia: 'Africa',
  Mali: 'Africa',
  'DR Congo': 'Africa',
  'South Africa': 'Africa',
  Guinea: 'Africa',
  Gabon: 'Africa',
  Benin: 'Africa',
  'Burkina Faso': 'Africa',
  Mozambique: 'Africa',

  // North/Central America & Caribbean
  'United States': 'North America',
  Mexico: 'North America',
  Canada: 'North America',
  Jamaica: 'North America',
  'Costa Rica': 'North America',
  Honduras: 'North America',
  Panama: 'North America',
  Trinidad: 'North America',
  Cuba: 'North America',
  Haiti: 'North America',
  Guatemala: 'North America',
  'El Salvador': 'North America',
  Nicaragua: 'North America',

  // Asia
  Japan: 'Asia',
  'South Korea': 'Asia',
  Iran: 'Asia',
  'Saudi Arabia': 'Asia',
  China: 'Asia',
  Qatar: 'Asia',
  UAE: 'Asia',
  Iraq: 'Asia',
  Uzbekistan: 'Asia',

  // Oceania
  Australia: 'Oceania',
  'New Zealand': 'Oceania',
};

// =============================================================================
// POSITION CATEGORY MAP (specific position → broad category)
// =============================================================================

const POSITION_CATEGORY: Record<string, string> = {
  Goalkeeper: 'Goalkeeper',
  'Centre-Back': 'Defender',
  'Left-Back': 'Defender',
  'Right-Back': 'Defender',
  'Wing-Back': 'Defender',
  Defender: 'Defender',
  'Defensive Midfielder': 'Midfielder',
  'Central Midfielder': 'Midfielder',
  'Attacking Midfielder': 'Midfielder',
  'Left Midfielder': 'Midfielder',
  'Right Midfielder': 'Midfielder',
  Midfielder: 'Midfielder',
  'Left Winger': 'Forward',
  'Right Winger': 'Forward',
  'Centre-Forward': 'Forward',
  Striker: 'Forward',
  Forward: 'Forward',
  Winger: 'Forward',
};

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function getContinent(nationality: string): string {
  return CONTINENT_MAP[nationality] ?? 'Unknown';
}

/**
 * Fuzzy club name comparison.
 * Handles Wikidata names ("Arsenal F.C.") vs puzzle answers ("Arsenal").
 */
function clubsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const normalize = (s: string) =>
    s.replace(/ F\.?C\.?$/i, '')
     .replace(/^AFC /i, '')
     .replace(/ A\.?F\.?C\.?$/i, '')
     .replace(/ & .*$/i, '')  // "Brighton & Hove Albion" → "Brighton"
     .trim()
     .toLowerCase();
  return normalize(a) === normalize(b);
}

function getPositionCategory(position: string): string {
  return POSITION_CATEGORY[position] ?? position;
}

function nationalityFeedback(
  guessNationality: string,
  answerNationality: string
): AttributeFeedback {
  // Normalize both to display names (handles ISO codes like "GB-ENG" → "England")
  const guessName = nationalityCodeToName(guessNationality);
  const answerName = nationalityCodeToName(answerNationality);

  if (guessName === answerName) {
    return { value: guessName, color: 'green' };
  }
  const guessContinent = getContinent(guessName);
  const answerContinent = getContinent(answerName);
  if (guessContinent !== 'Unknown' && guessContinent === answerContinent) {
    return { value: guessName, color: 'yellow' };
  }
  return { value: guessName, color: 'red' };
}

function positionFeedback(
  guessPosition: string,
  answerPosition: string
): AttributeFeedback {
  if (guessPosition === answerPosition) {
    return { value: guessPosition, color: 'green' };
  }
  const guessCategory = getPositionCategory(guessPosition);
  const answerCategory = getPositionCategory(answerPosition);
  if (guessCategory === answerCategory) {
    return { value: guessPosition, color: 'yellow' };
  }
  return { value: guessPosition, color: 'red' };
}

function birthYearFeedback(guessBirthYear: number, answerBirthYear: number): AttributeFeedback {
  if (guessBirthYear === answerBirthYear) {
    return { value: String(guessBirthYear), color: 'green' };
  }
  const diff = Math.abs(guessBirthYear - answerBirthYear);
  const color: FeedbackColor = diff <= 2 ? 'yellow' : 'red';
  // Born earlier = older player, arrow points down; born later = younger, arrow up
  const direction = guessBirthYear < answerBirthYear ? 'up' : 'down';
  return { value: String(guessBirthYear), color, direction };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Represents the attributes of a player guess (coming from PlayerAutocomplete).
 */
export interface GuessInput {
  playerName: string;
  club: string;
  league: string;
  nationality: string;
  position: string;
  birthYear: number;
}

/**
 * Generate feedback for a single guess against the puzzle answer.
 *
 * @param guess - The guessed player's attributes
 * @param answer - The correct answer from WhosThatContent
 * @returns GuessFeedback with colour codes for each attribute
 */
export function generateFeedback(
  guess: GuessInput,
  answer: WhosThatContent['answer']
): GuessFeedback {
  // Display clean club name (strip "F.C." etc.)
  const displayClub = guess.club
    .replace(/ F\.?C\.?$/i, '')
    .replace(/ A\.?F\.?C\.?$/i, '')
    .trim();

  return {
    playerName: guess.playerName,
    club: {
      value: displayClub || guess.club,
      color: clubsMatch(guess.club, answer.club) ? 'green' : 'red',
    },
    league: {
      value: guess.league,
      color: guess.league.toLowerCase() === answer.league.toLowerCase() ? 'green' : 'red',
    },
    nationality: nationalityFeedback(guess.nationality, answer.nationality),
    position: positionFeedback(guess.position, answer.position),
    birthYear: birthYearFeedback(guess.birthYear, answer.birth_year),
  };
}
