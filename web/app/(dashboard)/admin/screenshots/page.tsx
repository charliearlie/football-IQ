"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { ScreenshotGenerator } from "./_components/ScreenshotGenerator";

export default function ScreenshotsAdminPage() {
  return (
    <AdminPageShell
      title="Screenshots"
      subtitle="Generate polished App Store screenshots using AI"
    >
      <ScreenshotGenerator />
    </AdminPageShell>
  );
}
