"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PuzzleArchiveTable } from "@/components/admin/puzzle-archive-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TheThreadAdminPage() {
  return (
    <AdminPageShell
      title="Threads"
      subtitle="Manage kit history puzzles"
    >
      <Tabs defaultValue="archive" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="archive">
          <PuzzleArchiveTable gameMode={["the_thread"]} />
        </TabsContent>

        <TabsContent value="stats">
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-gray-400">
              Stats and analytics coming soon
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Track brand frequency, club coverage, and puzzle performance
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
