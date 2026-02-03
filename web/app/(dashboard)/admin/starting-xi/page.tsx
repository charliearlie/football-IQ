"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PuzzleArchiveTable } from "@/components/admin/puzzle-archive-table";
import { UniversalAnswerSearch } from "@/components/admin/universal-answer-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StartingXIAdminPage() {
  return (
    <AdminPageShell
      title="Starting XI"
      subtitle="Manage Starting XI puzzles"
    >
      <Tabs defaultValue="archive" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="search">Player Search</TabsTrigger>
        </TabsList>

        <TabsContent value="archive">
          <PuzzleArchiveTable gameMode="starting_xi" />
        </TabsContent>

        <TabsContent value="search">
          <UniversalAnswerSearch />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
