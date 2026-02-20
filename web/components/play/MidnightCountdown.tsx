"use client";

import { useEffect, useState } from "react";

function getTimeUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  return { hours, minutes };
}

export function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(
    null
  );

  useEffect(() => {
    // Set initial value after mount to avoid SSR mismatch
    setTimeLeft(getTimeUntilMidnight());

    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  if (timeLeft === null) return null;

  return (
    <span className="text-xs text-slate-500">
      Resets in {timeLeft.hours}h {timeLeft.minutes}m
    </span>
  );
}
