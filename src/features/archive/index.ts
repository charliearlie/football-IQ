// Archive feature exports

// Types
export type {
  ArchivePuzzle,
  ArchiveSection,
  GameModeFilter as GameModeFilterType,
  FilterOption,
  UseArchivePuzzlesResult,
  CatalogSyncResult,
  GameMode,
} from './types/archive.types';

// Hooks
export { useArchivePuzzles } from './hooks/useArchivePuzzles';

// Components
export { ArchiveList } from './components/ArchiveList';
export { ArchivePuzzleCard } from './components/ArchivePuzzleCard';
export { LockedArchiveCard } from './components/LockedArchiveCard';
export { GameModeFilter } from './components/GameModeFilter';
export { MonthHeader } from './components/MonthHeader';
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
