import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface CTAButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const CTAButton = forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ children, className, variant = "primary", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          "relative font-bebas tracking-wider text-lg px-6 py-3 rounded-lg transition-all",
          "transform active:translate-y-[2px] active:shadow-none",
          // 3D effect with border-bottom trick
          variant === "primary" && [
            "bg-pitch-green text-stadium-navy",
            "shadow-[0_4px_0_0_#46A302]", // grass-shadow color
            "hover:shadow-[0_6px_0_0_#46A302] hover:-translate-y-[2px]",
            // Glint animation container
            "overflow-hidden",
          ],
          variant === "secondary" && [
            "bg-transparent text-floodlight border-2 border-white/20",
            "hover:border-pitch-green hover:text-pitch-green",
          ],
          disabled &&
            "opacity-50 cursor-not-allowed transform-none shadow-none",
          className
        )}
        {...props}
      >
        {/* Glint effect overlay */}
        {variant === "primary" && !disabled && (
          <span className="absolute inset-0 w-full h-full overflow-hidden rounded-lg pointer-events-none">
            <span className="absolute top-0 left-0 w-10 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
          </span>
        )}
        {children}
      </button>
    );
  }
);

CTAButton.displayName = "CTAButton";
