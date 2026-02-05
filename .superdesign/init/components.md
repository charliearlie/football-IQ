# Football IQ Landing Page Components

## Landing-Specific Components

### MarketingHero.tsx
```tsx
import { AppScreenshot } from "./AppScreenshot";
import Image from "next/image";

export function MarketingHero() {
  return (
    <section className="relative w-full pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pitch-green/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stadium-navy/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left z-10">
            <h1 className="font-bebas text-6xl md:text-7xl lg:text-8xl text-floodlight tracking-wide leading-[0.9] mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
              TEST YOUR <br />
              <span className="text-pitch-green text-transparent bg-clip-text bg-gradient-to-r from-pitch-green to-grass-shadow">FOOTBALL IQ</span>
            </h1>

            <p className="font-sans text-lg md:text-xl text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
              The daily ritual for football fans. Challenge yourself with Career Paths, Transfers, Lineups, and more.
              Join 10,000+ players proving their knowledge every day.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
             <a href="#" className="transform hover:scale-105 transition-transform duration-200">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  width={160}
                  height={53}
                  className="h-[53px] w-auto"
                />
             </a>
             <a href="#" className="transform hover:scale-105 transition-transform duration-200">
               <Image
                 src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                 alt="Get it on Google Play"
                 width={180}
                 height={53}
                 className="h-[53px] w-auto border border-white/10 rounded-lg"
               />
             </a>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex-1 animate-in slide-in-from-right-8 fade-in duration-1000 delay-500">
             <div className="relative z-10 animate-float">
                <AppScreenshot
                  src="/images/app-screens/hero.png"
                  alt="Football IQ App Screen"
                  priority
                  className="rotate-[-6deg] hover:rotate-0 transition-transform duration-500"
                />
             </div>

             {/* Decorative elements behind phone */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-pitch-green/30 rounded-full animate-pulse -z-10" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-white/5 rounded-full -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
}
```

### CTAButton.tsx
```tsx
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
```

### CareerStepCard.tsx
```tsx
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
```

### LockedStepCard.tsx
```tsx
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
```

### AppScreenshot.tsx
```tsx
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppScreenshotProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function AppScreenshot({ src, alt, className, priority = false }: AppScreenshotProps) {
  return (
    <div className={cn("relative mx-auto h-[600px] w-[300px]", className)}>
      <div className="relative w-full h-full filter drop-shadow-2xl transition-transform duration-500 hover:scale-105">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          priority={priority}
        />
      </div>
    </div>
  );
}
```

### Footer.tsx
```tsx
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <div className="font-bebas text-2xl tracking-wider text-floodlight/50 mb-4">
          FOOTBALL IQ
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
          <Link href="/privacy" className="hover:text-floodlight transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-floodlight transition-colors">
            Terms of Service
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} Football IQ. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

## shadcn/ui Components Used

Located in `web/components/ui/`:
- button.tsx
- card.tsx
- badge.tsx
- input.tsx
- label.tsx
- dialog.tsx
- skeleton.tsx
- sheet.tsx
- tooltip.tsx
- select.tsx
- textarea.tsx
- checkbox.tsx
- tabs.tsx
- switch.tsx
- form.tsx
- scroll-area.tsx
- popover.tsx
- dropdown-menu.tsx
- table.tsx
