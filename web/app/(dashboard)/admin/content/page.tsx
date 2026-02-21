"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ContentHealthGrid } from "@/components/admin/content-health-grid";

export default function ContentHealthPage() {
  return (
    <AdminPageShell
      title="Content Health"
      subtitle="Days-of-coverage per game mode — ensure no game runs out of puzzles"
    >
      <ContentHealthGrid />
    </AdminPageShell>
  );
}
