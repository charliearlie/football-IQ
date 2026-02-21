"use client";

import useSWR from "swr";
import type { UserCohort } from "@/app/(dashboard)/admin/users/actions";
import { fetchUserList } from "@/app/(dashboard)/admin/users/actions";

interface UseAdminUsersOptions {
  page: number;
  pageSize?: number;
  cohort: UserCohort;
  search?: string;
}

export function useAdminUsers(options: UseAdminUsersOptions) {
  const { page, pageSize = 25, cohort, search } = options;

  const { data, error, isLoading, mutate } = useSWR(
    ["admin-users", page, pageSize, cohort, search],
    () => fetchUserList({ page, pageSize, cohort, search }),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return {
    rows: data?.data?.rows ?? [],
    totalCount: data?.data?.totalCount ?? 0,
    isLoading,
    error: error || (data && !data.success ? new Error(data.error) : null),
    mutate,
  };
}
