"use client";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { PuzzleArchiveTable } from "@/components/admin/puzzle-archive-table";
import { UniversalAnswerSearch } from "@/components/admin/universal-answer-search";
import { CleanupPanel } from "@/components/admin/cleanup-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TransferGuessAdminPage() {
  return (
    <AdminPageShell
      title="Transfer Guess"
      subtitle="Manage Transfer Guess puzzles"
    >
      <Tabs defaultValue="archive" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="archive">Archive</TabsTrigger>
          <TabsTrigger value="search">Player Search</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
        </TabsList>

        <TabsContent value="archive">
          <PuzzleArchiveTable gameMode="guess_the_transfer" />
        </TabsContent>

        <TabsContent value="search">
          <UniversalAnswerSearch />
        </TabsContent>

        <TabsContent value="cleanup">
          <CleanupPanel gameMode="guess_the_transfer" />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
