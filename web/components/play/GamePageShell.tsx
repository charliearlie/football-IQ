"use client";

import { useState, useCallback, type ReactNode } from "react";
import { GameNav } from "./GameNav";
import { AdSlot } from "./AdSlot";
import { PostGameCTA } from "./PostGameCTA";
import type { GameResult } from "@/lib/play/types";

interface GamePageShellProps {
  title: string;
  gameSlug: string;
  /** Result reported by the embedded game; null while game is in progress. */
  result: GameResult | null;
  children: ReactNode;
}

/**
 * Pure layout shell: nav + ad slots + post-game CTA. Result state lives in the
 * caller (DailyPuzzleClient); the shell just renders against it.
 */
export function GamePageShell({
  title,
  gameSlug,
  result,
  children,
}: GamePageShellProps) {
  const [contentReady, setContentReady] = useState(false);

  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (node && node.childElementCount > 0) {
      setContentReady(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <GameNav title={title} />

      {contentReady && !result && (
        <div className="py-3">
          <AdSlot variant="banner" />
        </div>
      )}

      <div ref={contentRef} className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {children}

        {result && (
          <>
            <PostGameCTA
              won={result.won}
              answer={result.answer}
              shareText={result.shareText}
              gameSlug={gameSlug}
            />
            <div className="py-6">
              <AdSlot variant="rectangle" />
            </div>
          </>
        )}
      </div>

      <footer className="py-4 text-center border-t border-white/5">
        <p className="text-slate-600 text-xs">football-iq.app</p>
      </footer>
    </div>
  );
}
