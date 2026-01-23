import { Lock } from "lucide-react";

interface LockedStepCardProps {
  stepNumber: number;
}

export function LockedStepCard({ stepNumber }: LockedStepCardProps) {
  return (
    <div className="relative glass-card p-4 overflow-hidden">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-stadium-navy/70 backdrop-blur-sm" />

      {/* Content (visible but blurred) */}
      <div className="flex items-center gap-4 opacity-60">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm text-muted-foreground shrink-0">
          {stepNumber}
        </div>
        <span className="text-muted-foreground">???</span>
      </div>

      {/* Lock icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
