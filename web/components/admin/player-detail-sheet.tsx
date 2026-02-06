"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FlagIcon } from "@/components/ui/flag-icon";
import { ProBadge, isElitePlayer } from "./pro-badge";
import { usePlayerCommandCenter } from "@/hooks/use-player-command-center";
import { resyncPlayerFromWikidata } from "@/app/(dashboard)/admin/actions";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";
import { RefreshCw, Trophy, Building2, Gamepad2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlayerDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  playerQid: string | null;
}

export function PlayerDetailSheet({
  isOpen,
  onClose,
  playerQid,
}: PlayerDetailSheetProps) {
  const {
    player,
    clubHistory,
    trophyCabinet,
    appearances,
    modesSummary,
    isLoading,
    mutate,
  } = usePlayerCommandCenter(playerQid);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleResync = async () => {
    if (!playerQid) return;

    setIsSyncing(true);
    try {
      const result = await resyncPlayerFromWikidata(playerQid);
      if (result.success && result.data) {
        toast.success(
          `Synced ${result.data.careersUpdated} career entries and ${result.data.achievementsUpdated} achievements`
        );
        mutate();
      } else {
        toast.error(result.error ?? "Failed to resync player");
      }
    } catch {
      toast.error("An error occurred during resync");
    } finally {
      setIsSyncing(false);
    }
  };

  // Group trophies by category
  const trophiesByCategory = trophyCabinet.reduce(
    (acc, trophy) => {
      const category = trophy.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(trophy);
      return acc;
    },
    {} as Record<string, typeof trophyCabinet>
  );

  const categoryOrder = ["Individual", "Club", "International"];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] bg-stadium-navy border-white/10">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-pitch-green" />
          </div>
        ) : player ? (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {player.nationality_code && (
                    <FlagIcon code={player.nationality_code} size={32} />
                  )}
                  <div>
                    <SheetTitle className="text-floodlight text-xl">
                      {player.name}
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                      {player.id}
                    </SheetDescription>
                  </div>
                  {isElitePlayer(player.scout_rank) && <ProBadge />}
                </div>
                <Button
                  onClick={handleResync}
                  disabled={isSyncing}
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/5"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Force Re-sync
                </Button>
              </div>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-140px)] mt-6 pr-4">
              <div className="space-y-6">
                {/* Club History Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-pitch-green" />
                    <h3 className="font-semibold text-floodlight">
                      Club History
                    </h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {clubHistory.length} clubs
                    </Badge>
                  </div>
                  {clubHistory.length > 0 ? (
                    <div className="space-y-2">
                      {clubHistory.map((club, index) => (
                        <div
                          key={`${club.club_id}-${index}`}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-2">
                            {club.country_code && (
                              <FlagIcon code={club.country_code} size={16} />
                            )}
                            <span className="text-sm text-floodlight">
                              {club.club_name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {club.start_year ?? "?"} - {club.end_year ?? "Present"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No club history available
                    </p>
                  )}
                </section>

                {/* Trophy Cabinet Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-card-yellow" />
                    <h3 className="font-semibold text-floodlight">
                      Trophy Cabinet
                    </h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {trophyCabinet.length} trophies
                    </Badge>
                  </div>
                  {trophyCabinet.length > 0 ? (
                    <div className="space-y-4">
                      {categoryOrder.map((category) => {
                        const trophies = trophiesByCategory[category];
                        if (!trophies || trophies.length === 0) return null;

                        return (
                          <div key={category}>
                            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                              {category}
                            </h4>
                            <div className="space-y-1.5">
                              {trophies.map((trophy, index) => (
                                <div
                                  key={`${trophy.achievement_id}-${trophy.year}-${index}`}
                                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5 border border-white/5"
                                >
                                  <span className="text-sm text-floodlight">
                                    {trophy.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {trophy.club_name && (
                                      <span className="text-xs text-muted-foreground">
                                        {trophy.club_name}
                                      </span>
                                    )}
                                    {trophy.year && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-card-yellow/30 text-card-yellow"
                                      >
                                        {trophy.year}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No trophies available
                    </p>
                  )}
                </section>

                {/* Puzzle Appearances Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Gamepad2 className="h-4 w-4 text-pitch-green" />
                    <h3 className="font-semibold text-floodlight">
                      Puzzle Appearances
                    </h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {appearances.length} total
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {GAME_MODES.map((mode) => {
                      const count = modesSummary[mode] ?? 0;
                      const modeAppearances = appearances.filter(
                        (a) => a.game_mode === mode
                      );

                      return (
                        <div
                          key={mode}
                          className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                        >
                          <span className="text-sm text-floodlight">
                            {GAME_MODE_DISPLAY_NAMES[mode as GameMode]}
                          </span>
                          {count > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap justify-end max-w-[60%]">
                              {modeAppearances.slice(0, 5).map((app) => (
                                <Badge
                                  key={app.puzzle_id}
                                  variant="outline"
                                  className="text-xs border-pitch-green/30 text-pitch-green"
                                >
                                  {app.puzzle_date
                                    ? format(parseISO(app.puzzle_date), "MMM d")
                                    : "Backlog"}
                                </Badge>
                              ))}
                              {modeAppearances.length > 5 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-white/20 text-muted-foreground"
                                >
                                  +{modeAppearances.length - 5}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Never used
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No player selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
