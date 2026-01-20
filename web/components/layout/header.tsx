"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/calendar": "Master Calendar",
  "/dashboard/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="h-16 border-b border-white/10 bg-stadium-navy/50 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-floodlight">{title}</h1>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-floodlight">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
