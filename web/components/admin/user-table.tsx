"use client";

import { useState } from "react";
import { useAdminUsers } from "@/hooks/use-admin-users";
import type { UserCohort, UserRow } from "@/app/(dashboard)/admin/users/actions";
import { UserDetailRow } from "./user-detail-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

const COHORT_OPTIONS: { value: UserCohort; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "never_played", label: "Never Played" },
  { value: "active", label: "Active (7d)" },
  { value: "lapsed", label: "Lapsed (7-30d)" },
  { value: "churned", label: "Churned (30d+)" },
];

export function UserTable() {
  const [page, setPage] = useState(1);
  const [cohort, setCohort] = useState<UserCohort>("all");
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const pageSize = 25;

  const { rows, totalCount, isLoading } = useAdminUsers({
    page,
    pageSize,
    cohort,
    search: search || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleCohortChange = (value: string) => {
    setCohort(value as UserCohort);
    setPage(1);
    setExpandedUserId(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
    setExpandedUserId(null);
  };

  const toggleExpand = (userId: string) => {
    setExpandedUserId((prev) => (prev === userId ? null : userId));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={cohort} onValueChange={handleCohortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COHORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={handleSearchChange}
          className="w-full sm:w-64"
        />
        <div className="flex items-center text-sm text-muted-foreground ml-auto">
          {totalCount} user{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-muted-foreground">
                Last Active
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                Attempts
              </TableHead>
              <TableHead className="text-muted-foreground text-right">
                IQ
              </TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-white/5">
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <UserRowGroup
                  key={user.id}
                  user={user}
                  isExpanded={expandedUserId === user.id}
                  onToggle={() => toggleExpand(user.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRowGroup({
  user,
  isExpanded,
  onToggle,
}: {
  user: UserRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        className="border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={onToggle}
      >
        <TableCell className="text-floodlight font-medium">
          {user.display_name || "Anonymous"}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {user.created_at
            ? new Date(user.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {user.last_active
            ? new Date(user.last_active).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })
            : "Never"}
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {user.total_attempts}
        </TableCell>
        <TableCell className="text-right text-floodlight">
          {user.total_iq.toLocaleString()}
        </TableCell>
        <TableCell>
          {user.is_premium ? (
            <Badge variant="success">Pro</Badge>
          ) : user.total_attempts === 0 ? (
            <Badge variant="secondary">Never played</Badge>
          ) : null}
        </TableCell>
      </TableRow>
      {isExpanded && <UserDetailRow userId={user.id} />}
    </>
  );
}
