"use client";

import type { RankSlotState } from "@/lib/top-tens/types";
import { RankCard } from "./RankCard";

interface RankGridProps {
  slots: RankSlotState[];
}

export function RankGrid({ slots }: RankGridProps) {
  return (
    <ol className="space-y-1.5 list-none m-0 p-0">
      {slots.map((slot) => (
        <li key={slot.rank}>
          <RankCard slot={slot} />
        </li>
      ))}
    </ol>
  );
}
