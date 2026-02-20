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

  const handleGameComplete = useCallback((result: GameCompleteResult) => {
    setGameResult(result);
  }, []);

  return (
    <GameCompleteContext.Provider value={handleGameComplete}>
      <div className="min-h-screen flex flex-col">
        <GameNav title={title} />

        {/* Top ad slot — visible before game starts, hidden during/after play */}
        <div className="py-3">
          <AdSlot variant="banner" visible={!gameResult} />
        </div>

        {/* Game content area */}
        <div className="flex-1 max-w-md mx-auto w-full px-4 py-6">
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

              {/* Bottom ad slot — appears after game ends */}
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
