"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface AuthUserState {
  /** True once the Supabase client has resolved the initial session. */
  ready: boolean;
  /** Active user, or null if signed out. May be anonymous. */
  user: User | null;
}

const INITIAL: AuthUserState = { ready: false, user: null };

/**
 * Thin client-side hook around `supabase.auth.getUser()` + `onAuthStateChange`.
 * Components like the paywall need to distinguish anonymous from signed-in
 * users without re-fetching on every render, and the layout-level provider
 * doesn't already expose this.
 */
export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>(INITIAL);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setState({ ready: true, user });
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ ready: true, user: session?.user ?? null });
      },
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
