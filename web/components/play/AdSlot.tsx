"use client";

import { cn } from "@/lib/utils";

interface AdSlotProps {
  variant: "banner" | "rectangle";
  visible?: boolean;
  className?: string;
}

/**
 * Placeholder ad container with fixed dimensions to prevent CLS.
 * No ad provider is wired up yet — renders a reserved space.
 */
export function AdSlot({ variant, visible = true, className }: AdSlotProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white/[0.02] mx-auto",
        variant === "banner" && "w-[320px] h-[50px] md:w-[728px] md:h-[90px]",
        variant === "rectangle" && "w-[300px] h-[250px]",
        className
      )}
    >
      <span className="text-[10px] text-slate-600 uppercase tracking-widest">
        Advertisement
      </span>
    </div>
  );
}
