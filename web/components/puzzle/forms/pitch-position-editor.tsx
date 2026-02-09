"use client";

import { useCallback, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFormationDefaultCoords } from "@/lib/schemas/puzzle-defaults";
import type { StartingXIContent } from "@/lib/schemas";

interface FormValues {
  content: StartingXIContent;
}

export function PitchPositionEditor() {
  const { control, setValue, getValues } = useFormContext<FormValues>();
  const formation = useWatch({ control, name: "content.formation" });
  const players = useWatch({ control, name: "content.players" });

  const pitchRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const getEffectiveCoords = useCallback(
    (player: StartingXIContent["players"][0]) => {
      if (player.override_x != null && player.override_y != null) {
        return { x: player.override_x, y: player.override_y };
      }
      return getFormationDefaultCoords(formation, player.position_key);
    },
    [formation]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDraggingIndex(index);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingIndex === null || !pitchRef.current) return;

      const rect = pitchRef.current.getBoundingClientRect();
      const x = Math.round(
        Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      );
      const y = Math.round(
        Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
      );

      setValue(`content.players.${draggingIndex}.override_x`, x);
      setValue(`content.players.${draggingIndex}.override_y`, y);
    },
    [draggingIndex, setValue]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const resetAllPositions = useCallback(() => {
    const currentPlayers = getValues("content.players");
    currentPlayers.forEach((_, index) => {
      setValue(`content.players.${index}.override_x`, null);
      setValue(`content.players.${index}.override_y`, null);
    });
  }, [getValues, setValue]);

  const resetPlayerPosition = useCallback(
    (index: number) => {
      setValue(`content.players.${index}.override_x`, null);
      setValue(`content.players.${index}.override_y`, null);
    },
    [setValue]
  );

  const hasAnyOverrides = players?.some(
    (p) => p.override_x != null || p.override_y != null
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-floodlight">
          Pitch Editor
        </h3>
        {hasAnyOverrides && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetAllPositions}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset All
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag players to adjust positions. Double-click to reset individual players.
      </p>

      {/* Pitch */}
      <div
        ref={pitchRef}
        className="relative bg-pitch-green/20 rounded-lg overflow-hidden aspect-[3/4] border border-pitch-green/30 select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        data-testid="pitch-editor"
      >
        {/* Pitch Markings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b border-l border-r border-white/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t border-l border-r border-white/20" />
        </div>

        {/* Player Markers */}
        {players?.map((player, index) => {
          const coords = getEffectiveCoords(player);
          const hasOverride =
            player.override_x != null || player.override_y != null;
          const isDragging = draggingIndex === index;
          const surname = player.player_name?.split(" ").pop() || "";

          return (
            <div
              key={index}
              className="absolute flex flex-col items-center"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isDragging ? 50 : 10,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onDoubleClick={() => resetPlayerPosition(index)}
              data-testid={`player-marker-${index}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-transform ${
                  isDragging ? "scale-125 ring-2 ring-white" : ""
                } ${
                  player.is_hidden
                    ? "bg-white/20 text-white/50 border-2 border-dashed border-white/40"
                    : hasOverride
                      ? "bg-card-yellow text-stadium-navy ring-1 ring-card-yellow/50"
                      : "bg-floodlight text-stadium-navy"
                }`}
              >
                {player.position_key.slice(0, 3)}
              </div>
              <span className="text-[9px] mt-0.5 text-center max-w-[50px] truncate text-floodlight/80">
                {surname || player.position_key}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
