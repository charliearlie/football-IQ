"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FunnelCards } from "@/components/admin/funnel-cards";
import { UserTable } from "@/components/admin/user-table";

export default function UsersAdminPage() {
  return (
    <AdminPageShell
      title="Users"
      subtitle="User cohorts, engagement metrics, and individual activity"
    >
      <FunnelCards />
      <UserTable />
    </AdminPageShell>
  );
}
