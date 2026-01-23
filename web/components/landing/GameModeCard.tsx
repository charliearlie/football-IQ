import Image from "next/image";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameModeCardProps {
  name: string;
  icon: string;
  schedule: string;
  isPremium: boolean;
}

export function GameModeCard({
  name,
  icon,
  schedule,
  isPremium,
}: GameModeCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-4 text-center group hover:border-pitch-green/50 transition-colors relative",
        isPremium && "border-card-yellow/30"
      )}
    >
      {/* Premium badge */}
      {isPremium && (
        <div className="absolute -top-2 -right-2 bg-card-yellow rounded-full p-1">
          <Crown className="w-4 h-4 text-stadium-navy" />
        </div>
      )}

      {/* 3D Icon */}
      <div className="relative w-16 h-16 mx-auto mb-3">
        <Image
          src={icon}
          alt={name}
          fill
          className="object-contain drop-shadow-lg"
          sizes="64px"
        />
      </div>

      <h3 className="font-semibold text-floodlight text-sm mb-1">{name}</h3>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">
        {schedule}
      </p>
    </div>
  );
}
