"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PuzzleArchiveTable } from "@/components/admin/puzzle-archive-table";
import { UniversalAnswerSearch } from "@/components/admin/universal-answer-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GoalscorerRecallAdminPage() {
  return (
    <AdminPageShell
      title="Goalscorer Recall"
      subtitle="Manage Goalscorer Recall puzzles"
    >
      <Tabs defaultValue="archive" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="search">Player Search</TabsTrigger>
        </TabsList>

        <TabsContent value="archive">
          <PuzzleArchiveTable gameMode="guess_the_goalscorers" />
        </TabsContent>

        <TabsContent value="search">
          <UniversalAnswerSearch />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
