"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PuzzleArchiveTable } from "@/components/admin/puzzle-archive-table";
import { UniversalAnswerSearch } from "@/components/admin/universal-answer-search";
import { CleanupPanel } from "@/components/admin/cleanup-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CareerPathAdminPage() {
  return (
    <AdminPageShell
      title="Career Path"
      subtitle="Manage Career Path and Career Path Pro puzzles"
    >
      <Tabs defaultValue="archive" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="search">Player Search</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
        </TabsList>

        <TabsContent value="archive">
          <PuzzleArchiveTable
            gameMode={["career_path", "career_path_pro"]}
          />
        </TabsContent>

        <TabsContent value="search">
          <UniversalAnswerSearch />
        </TabsContent>

        <TabsContent value="cleanup">
          <CleanupPanel
            gameMode={["career_path", "career_path_pro"]}
          />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
