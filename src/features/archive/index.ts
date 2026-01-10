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
} from './types/archive.types';

// Hooks
export { useArchivePuzzles } from './hooks/useArchivePuzzles';
export { useGatedNavigation } from './hooks/useGatedNavigation';

// Components
export { ArchiveList } from './components/ArchiveList';
export { GameModeFilter } from './components/GameModeFilter';
export { MonthHeader } from './components/MonthHeader';
export { DayHeader } from './components/DayHeader';
export { PremiumUpsellModal } from './components/PremiumUpsellModal';

// Services
export { syncCatalogFromSupabase } from './services/catalogSyncService';

// Utils
export {
  groupByMonth,
  formatPuzzleDate,
  isWithinFreeWindow,
  isPuzzleLocked,
} from './utils/dateGrouping';
