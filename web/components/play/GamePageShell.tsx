"use client";

import { useState, useCallback, useContext, createContext, type ReactNode } from "react";
import { GameNav } from "./GameNav";
import { AdSlot } from "./AdSlot";
import { PostGameCTA } from "./PostGameCTA";

export interface GameCompleteResult {
  won: boolean;
  answer: string;
  shareText: string;
}

type OnGameComplete = (result: GameCompleteResult) => void;

const GameCompleteContext = createContext<OnGameComplete | null>(null);

export function useGameComplete(): OnGameComplete {
  const ctx = useContext(GameCompleteContext);
  if (!ctx) {
    throw new Error("useGameComplete must be used within a GamePageShell");
  }
  return ctx;
}

interface GamePageShellProps {
  title: string;
  gameSlug: string;
  children: ReactNode;
}

export function GamePageShell({
  title,
  gameSlug,
  children,
}: GamePageShellProps) {
  const [gameResult, setGameResult] = useState<GameCompleteResult | null>(null);
  const [contentReady, setContentReady] = useState(false);

  const handleGameComplete = useCallback((result: GameCompleteResult) => {
    setGameResult(result);
  }, []);

  // Track when game content mounts (avoids showing ads on empty loading state)
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (node && node.childElementCount > 0) {
      setContentReady(true);
    }
  }, []);

  return (
    <GameCompleteContext.Provider value={handleGameComplete}>
      <div className="min-h-screen flex flex-col">
        <GameNav title={title} />

        {/* Top banner ad — only visible while game content is active (not during loading/already-played) */}
        {contentReady && !gameResult && (
          <div className="py-3">
            <AdSlot variant="banner" />
          </div>
        )}

        {/* Game content area */}
        <div ref={contentRef} className="flex-1 max-w-md mx-auto w-full px-4 py-6">
          {children}

          {/* Post-game zone */}
          {gameResult && (
            <>
              <PostGameCTA
                won={gameResult.won}
                answer={gameResult.answer}
                shareText={gameResult.shareText}
                gameSlug={gameSlug}
              />

              {/* Rectangle ad — appears after game ends */}
              <div className="py-6">
                <AdSlot variant="rectangle" />
              </div>
            </>
          )}
        </div>

        {/* Mini footer */}
        <footer className="py-4 text-center border-t border-white/5">
          <p className="text-slate-600 text-xs">football-iq.app</p>
        </footer>
      </div>
    </GameCompleteContext.Provider>
  );
}
