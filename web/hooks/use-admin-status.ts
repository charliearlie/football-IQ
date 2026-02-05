"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAdminStatus(): AdminStatus {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isStale = false;
    const supabase = createClient();

    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isStale || !user) {
          setIsAdmin(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (!isStale) {
          setIsAdmin(profile?.is_admin ?? false);
        }
      } catch {
        if (!isStale) {
          setIsAdmin(false);
        }
      } finally {
        if (!isStale) {
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isStale = true;
    };
  }, []);

  return { isAdmin, isLoading };
}
