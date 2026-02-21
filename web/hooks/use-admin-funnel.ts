"use client";

import useSWR from "swr";
import { fetchFunnelData } from "@/app/(dashboard)/admin/users/actions";

export function useAdminFunnel() {
  const { data, error, isLoading } = useSWR(
    "admin-funnel",
    () => fetchFunnelData(),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    funnel: data?.data ?? null,
    isLoading,
    error: error || (data && !data.success ? new Error(data.error) : null),
  };
}
