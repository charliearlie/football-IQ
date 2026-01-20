// Archive feature exports

// Types
export type {
  ArchivePuzzle,
  ArchiveSection,
  DayGroup,
  GameModeFilter as GameModeFilterType,
  FilterOption,
  UseArchivePuzzlesResult,
  CatalogSyncResult,
  GameMode,
  // New Match Calendar types
  ArchiveDateGroup,
  ArchiveListItem,
  StatusFilter,
  ArchiveFilterState,
  MiniCardData,
  UseArchiveCalendarResult,
} from './types/archive.types';

// Hooks
export { useArchivePuzzles } from './hooks/useArchivePuzzles';
export { useGatedNavigation } from './hooks/useGatedNavigation';
export { useAccordionState } from './hooks/useAccordionState';

// Components - New Match Calendar
export { ArchiveCalendar } from './components/ArchiveCalendar';
export { DateAccordionRow } from './components/DateAccordionRow';
export { ExpandedDateContent } from './components/ExpandedDateContent';
export { MiniGameCard } from './components/MiniGameCard';
export { AtAGlanceBar } from './components/AtAGlanceBar';
export { AdvancedFilterBar } from './components/AdvancedFilterBar';
export { ArchiveCalendarSkeleton } from './components/ArchiveCalendarSkeleton';

// Components - Legacy (kept for backward compatibility)
export { ArchiveList } from './components/ArchiveList';
export { GameModeFilter } from './components/GameModeFilter';
export { MonthHeader } from './components/MonthHeader';
export { DayHeader } from './components/DayHeader';
export { PremiumUpsellModal } from './components/PremiumUpsellModal';

// Services
export { syncCatalogFromSupabase } from './services/catalogSyncService';

// Utils - New Calendar transformers
export {
  groupByDate,
  buildListItems,
  applyFilters,
  formatDateShort,
  formatDateFull,
  getItemKey,
  getItemType,
} from './utils/calendarTransformers';

// Utils - Legacy
export {
  groupByMonth,
  formatPuzzleDate,
  isWithinFreeWindow,
  isPuzzleLocked,
} from './utils/dateGrouping';

// Constants
export { GAME_MODE_ROUTES } from './constants/routes';
