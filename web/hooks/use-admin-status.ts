"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AdminStatus {
  isAdmin: boolean;
  isReadonly: boolean;
  isLoading: boolean;
}

export function useAdminStatus(): AdminStatus {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReadonly, setIsReadonly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isStale = false;
    const supabase = createClient();

    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (isStale) return;
        if (!user) {
          setIsAdmin(false);
          setIsReadonly(false);
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, is_readonly")
          .eq("id", user.id)
          .single() as { data: { is_admin?: boolean; is_readonly?: boolean } | null };

        if (!isStale) {
          setIsAdmin(profile?.is_admin ?? false);
          setIsReadonly(profile?.is_readonly ?? false);
        }
      } catch {
        if (!isStale) {
          setIsAdmin(false);
          setIsReadonly(false);
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

  return { isAdmin, isReadonly, isLoading };
}
