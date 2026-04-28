import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-pitch-green text-stadium-navy",
        warning: "border-transparent bg-card-yellow text-stadium-navy",
        // Football IQ 2026 — neutral pill against navy surfaces.
        iq: "border-white/15 bg-white/[0.04] text-floodlight uppercase tracking-wider",
        "iq-soft":
          "border-pitch-green/30 bg-pitch-green/10 text-pitch-green uppercase tracking-wider",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Optional accent color (game-mode hex). When provided, overrides variant
   * styling with a colour-tinted pill — bg = 18 alpha, border = 40 alpha,
   * text = solid colour.
   */
  accentColor?: string;
}

function Badge({ className, variant, accentColor, style, ...props }: BadgeProps) {
  if (accentColor) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
          className,
        )}
        style={{
          color: accentColor,
          backgroundColor: `${accentColor}18`,
          borderColor: `${accentColor}40`,
          ...style,
        }}
        {...props}
      />
    );
  }
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={style}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
