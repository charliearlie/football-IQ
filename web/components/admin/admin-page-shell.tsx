"use client";

import { ChevronRight } from "lucide-react";

interface AdminPageShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AdminPageShell({
  title,
  subtitle,
  children,
}: AdminPageShellProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span>Admin</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-floodlight">{title}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-bebas)] tracking-wide text-floodlight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
