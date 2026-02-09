/**
 * Grid Rarity Hook
 *
 * Manages rarity data fetching and recording for The Grid game mode.
 * Implements optimistic UI pattern:
 * 1. Show green check immediately on local validation
 * 2. Record selection to server (fire-and-forget)
 * 3. Fade in rarity percentage when server responds
 */

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CellRarityData, GridIQScore, FilledCell } from '../types/theGrid.types';

/**
 * Hook for fetching and recording grid cell rarity data.
 *
 * @param puzzleId - The puzzle UUID (null if puzzle not loaded)
 * @returns Functions to record selections and fetch rarity
 */
export function useGridRarity(puzzleId: string | null) {
  /**
   * Record a player selection to the server.
   * Fire-and-forget: doesn't block UI, errors are logged but not thrown.
   */
  const recordSelection = useCallback(
    async (
      cellIndex: number,
      playerId: string,
      playerName: string,
      nationalityCode?: string
    ) => {
      if (!puzzleId) return;

      // Fire-and-forget: don't await, don't block UI
      supabase
        .rpc('record_grid_selection', {
          p_puzzle_id: puzzleId,
          p_cell_index: cellIndex,
          p_player_id: playerId,
          p_player_name: playerName,
          p_nationality_code: nationalityCode ?? null,
        })
        .then(({ error }) => {
          if (error) {
            console.warn('[GridRarity] Failed to record selection:', error.message);
          }
        })
        .catch((err) => {
          console.warn('[GridRarity] Network error recording selection:', err);
        });
    },
    [puzzleId]
  );

  /**
   * Fetch rarity percentage for a single cell + player.
   * Called after correct guess to show rarity on Player Card.
   *
   * @returns Rarity percentage (0-100) or null on error
   */
  const fetchCellRarity = useCallback(
    async (cellIndex: number, playerId: string): Promise<number | null> => {
      if (!puzzleId) return null;

      try {
        const { data, error } = await supabase.rpc('get_grid_cell_rarity', {
          p_puzzle_id: puzzleId,
          p_cell_index: cellIndex,
          p_player_id: playerId,
        });

        if (error) {
          console.warn('[GridRarity] Failed to fetch cell rarity:', error.message);
          return null;
        }

        // RPC returns array, take first row
        if (data && data.length > 0) {
          return data[0].rarity_pct;
        }

        // No data = first selection, treat as 100% (will normalize after more selections)
        return 100;
      } catch (err) {
        console.warn('[GridRarity] Network error fetching rarity:', err);
        return null;
      }
    },
    [puzzleId]
  );

  /**
   * Batch fetch rarity data for all filled cells.
   * Used by result modal to calculate Grid IQ score.
   *
   * @param selections - Array of filled cell data
   * @returns Array of rarity data or null on error
   */
  const fetchGridSummary = useCallback(
    async (
      selections: { cellIndex: number; playerId: string; playerName: string }[]
    ): Promise<CellRarityData[] | null> => {
      if (!puzzleId || selections.length === 0) return null;

      try {
        const { data, error } = await supabase.rpc('get_grid_summary_rarity', {
          p_puzzle_id: puzzleId,
          p_selections: selections,
        });

        if (error) {
          console.warn('[GridRarity] Failed to fetch grid summary:', error.message);
          return null;
        }

        return data as CellRarityData[];
      } catch (err) {
        console.warn('[GridRarity] Network error fetching summary:', err);
        return null;
      }
    },
    [puzzleId]
  );

  return {
    recordSelection,
    fetchCellRarity,
    fetchGridSummary,
  };
}

/**
 * Calculate Grid IQ score from rarity data.
 * Lower rarity percentages = higher IQ (obscure picks rewarded).
 *
 * Formula:
 * - iqContribution per cell = 100 - rarityPct
 * - totalRarityScore = sum of all contributions
 * - gridIQ = (totalRarityScore / 900) * 100
 *
 * @param cells - Filled cells with rarity data
 * @returns GridIQScore object
 */
export function calculateGridIQ(cells: (FilledCell | null)[]): GridIQScore {
  const cellScores: GridIQScore['cellScores'] = [];
  let totalRarityScore = 0;
  let cellsWithRarity = 0;

  cells.forEach((cell, index) => {
    if (cell && cell.rarityPct !== undefined) {
      const iqContribution = 100 - cell.rarityPct;
      cellScores.push({
        cellIndex: index,
        player: cell.player,
        rarityPct: cell.rarityPct,
        iqContribution,
      });
      totalRarityScore += iqContribution;
      cellsWithRarity++;
    }
  });

  // If no rarity data, return default
  if (cellsWithRarity === 0) {
    return {
      totalRarityScore: 0,
      maxScore: 900,
      gridIQ: 0,
      cellScores: [],
    };
  }

  // Normalize to 0-100 scale
  // Max possible = 900 (9 cells × 100 contribution each, if all picks are 0% rarity)
  const maxScore = 900;
  const gridIQ = Math.round((totalRarityScore / maxScore) * 100);

  return {
    totalRarityScore,
    maxScore,
    gridIQ,
    cellScores,
  };
}

/**
 * Get tier message based on Grid IQ score.
 */
export function getGridIQTierMessage(gridIQ: number): string {
  if (gridIQ >= 80) return 'Elite picks! You know the obscure legends.';
  if (gridIQ >= 60) return 'Deep cuts! Your knowledge runs deep.';
  if (gridIQ >= 40) return 'Solid knowledge. A few hidden gems in there.';
  if (gridIQ >= 20) return 'Playing it safe with the familiar names.';
  return 'Sticking to the superstars!';
}
