"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { GridSandbox } from "@/app/admin/grid-sandbox/_components/GridSandbox";

export default function TheGridAdminPage() {
  return (
    <AdminPageShell
      title="The Grid"
      subtitle="Build, validate, and publish 3x3 grids"
    >
      <GridSandbox />
    </AdminPageShell>
  );
}
