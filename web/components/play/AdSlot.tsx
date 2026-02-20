"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

const AD_CLIENT = "ca-pub-9426782115883407";

interface AdSlotProps {
  variant: "banner" | "rectangle";
  adSlot?: string;
  visible?: boolean;
  className?: string;
}

export function AdSlot({
  variant,
  adSlot = "5507725230",
  visible = true,
  className,
}: AdSlotProps) {
  const pushed = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || pushed.current) return;

    const tryPush = () => {
      const el = containerRef.current;
      if (!el || el.offsetWidth === 0) return false;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
        return true;
      } catch {
        return false;
      }
    };

    // Try immediately — if the container already has width
    if (tryPush()) return;

    // Otherwise retry on a short interval until layout is ready
    const interval = setInterval(() => {
      if (tryPush()) clearInterval(interval);
    }, 200);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "mx-auto overflow-hidden",
        variant === "banner" && "w-[320px] h-[50px] md:w-[728px] md:h-[90px]",
        variant === "rectangle" && "w-[300px] h-[250px]",
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format={variant === "banner" ? "horizontal" : "auto"}
        data-full-width-responsive={variant === "banner" ? "false" : "true"}
      />
    </div>
  );
}
