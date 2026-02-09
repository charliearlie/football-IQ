"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bell,
  Calendar,
  Trophy,
  Settings,
  LogOut,
  Globe,
  Route,
  ArrowLeftRight,
  Users,
  Target,
  Grid3X3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAdminStatus } from "@/hooks/use-admin-status";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Player Scout", href: "/player-scout", icon: Globe },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Career Path", href: "/admin/career-path", icon: Route },
      { name: "Transfer Guess", href: "/admin/guess-the-transfer", icon: ArrowLeftRight },
      { name: "Starting XI", href: "/admin/starting-xi", icon: Users },
      { name: "Goalscorer Recall", href: "/admin/goalscorer-recall", icon: Target },
      { name: "The Grid", href: "/admin/the-grid", icon: Grid3X3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin } = useAdminStatus();

  // Filter navigation to only show Admin section for admin users
  const visibleNavigation = navigation.filter(
    (section) => section.label !== "Admin" || isAdmin
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-stadium-navy border-r border-white/10">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-pitch-green flex items-center justify-center">
          <Trophy className="w-5 h-5 text-stadium-navy" />
        </div>
        <div>
          <span className="text-lg font-bold text-floodlight">Football IQ</span>
          <span className="block text-xs text-muted-foreground">Command Centre</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleNavigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            {section.label && (
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-pitch-green/10 text-pitch-green"
                      : "text-muted-foreground hover:bg-white/5 hover:text-floodlight"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-floodlight transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-red-card/10 hover:text-red-card transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}
