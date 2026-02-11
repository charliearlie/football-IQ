"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/calendar": "Master Calendar",
  "/dashboard/settings": "Settings",
  "/admin/career-path": "Career Path Admin",
  "/admin/guess-the-transfer": "Transfer Guess Admin",
  "/admin/starting-xi": "Starting XI Admin",
  "/admin/goalscorer-recall": "Goalscorer Recall Admin",
  "/admin/the-grid": "The Grid Admin",
};

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || (pathname.startsWith("/admin") ? "Admin" : "Dashboard");

  return (
    <header className="h-14 md:h-16 border-b border-white/10 bg-stadium-navy/50 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden text-muted-foreground hover:text-floodlight"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg md:text-xl font-semibold text-floodlight">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-floodlight">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
