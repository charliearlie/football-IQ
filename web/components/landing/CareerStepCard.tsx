import { cn } from "@/lib/utils";
import type { CareerStep } from "@/types/careerPath";

interface CareerStepCardProps {
  step: CareerStep;
  stepNumber: number;
  isLatest?: boolean;
}

export function CareerStepCard({
  step,
  stepNumber,
  isLatest,
}: CareerStepCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-4 transition-all",
        isLatest && "border-pitch-green shadow-[0_0_20px_rgba(88,204,2,0.3)]"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Step number badge */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
            isLatest
              ? "bg-pitch-green text-stadium-navy"
              : "bg-white/10 text-muted-foreground"
          )}
        >
          {stepNumber}
        </div>

        {/* Step details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-floodlight">{step.text}</span>
            {step.type === "loan" && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-card-yellow text-stadium-navy rounded">
                LOAN
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{step.year}</div>
          {(step.apps !== undefined || step.goals !== undefined) && (
            <div className="text-xs text-muted-foreground mt-1">
              {step.apps !== undefined && `${step.apps} Apps`}
              {step.apps !== undefined && step.goals !== undefined && " · "}
              {step.goals !== undefined && `${step.goals} Gls`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
